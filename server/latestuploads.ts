// <config>
const SC_USER_ID = '463895823';
const YT_UPLOADS_PLAYLIST_ID = 'UUgKJ63JuRY7dNUDHGLGoo2Q';
// </config>

// TODO: clean up this code some more (yeah highly doubt I'll ever do that...)

import { SCAPIv2TrackList } from '../shared/SCAPIv2TrackList.js';
import { YTDataAPIv3PlaylistItems } from '../shared/YTDataAPIv3PlaylistItems.js';
import { LatestUploads, LatestUploadsMerged } from '../shared/LatestUploads.js';

import { Env } from './index.js';

import pick from 'lodash/pick';
import { keys } from 'ts-transformer-keys';

namespace SoundCloudAPI {
  // based on https://github.com/ytdl-org/youtube-dl/blob/b8a86dcf1aa837577178ae25357d8241ab4ba6c1/youtube_dl/extractor/soundcloud.py#L277
  export async function extractClientId() {
    // proxy the request to https://soundcloud.com/ through my own site since we're getting blocked by cloudfront otherwise
    const html = await fetch('https://alpha.kwyntes.nl/~/sc_proxy').then(res => res.text());

    console.log(html);

    const scriptTagMatches = Array.from(html.matchAll(/<script[^>]+src="([^"]+)"/g));

    return Promise.any(
      scriptTagMatches.reverse().map(async scriptTagMatch => {
        const src = scriptTagMatch[1];
        const js = await fetch(src).then(res => res.text());
        const clientId = js.match(/client_id\s*:\s*"([0-9a-zA-Z]{32})"/)[1];

        return clientId ?? Promise.reject();
      })
    ).catch(() => Promise.reject("Couldn't extract SoundCloud client_id."));
  }

  export async function fetchTracks(clientId: string): Promise<SCAPIv2TrackList> {
    // prettier-ignore
    // ^ prettier is fucking cancer
    // and so is soundcloud, the limit parameter has no logic behind it whatsoever, setting it to 5 yields no tracks,
    // setting it to 14 yields 5 (god knows why, and He doesn't exist) but i don't trust that, so i set it to 1000 to get
    // all of them and do the limiting myself
    return fetch(`https://api-v2.soundcloud.com/users/${SC_USER_ID}/tracks?limit=1000&client_id=${clientId}`)
      .then(res => res.ok
        ? res.json()
        : Promise.reject({ status: res.status, msg: `Fetch tracklist failed with status code ${res.status}` })
      );
  }
}

namespace YouTubeAPI {
  export async function fetchVideos(apiKey: string): Promise<YTDataAPIv3PlaylistItems> {
    // prettier-ignore
    return fetch(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${YT_UPLOADS_PLAYLIST_ID}&key=${apiKey}`)
      .then(res => res.json());
  }
}

export default async (request: Request, env: Env) => {
  try {
    let clientId = await env.KV.get('sc_client_id');

    if (!clientId) {
      console.log('No client_id stored. Refetching...');

      clientId = await SoundCloudAPI.extractClientId();
      env.KV.put('sc_client_id', clientId);
    }

    const tracks = await SoundCloudAPI.fetchTracks(clientId).catch(async ({ status, msg }) => {
      if (status !== 401 /* Unauthorized */) return Promise.reject(msg);

      console.log('API status 401 Unauthorized. Refetching client_id...');

      clientId = await SoundCloudAPI.extractClientId();
      env.KV.put('sc_client_id', clientId);
      return SoundCloudAPI.fetchTracks(clientId).catch(({ msg }) => Promise.reject(msg + ' after retry'));
    });

    // query param ?sc_client_id_only
    const params = new URL(request.url).searchParams;
    if (params.has('sc_client_id_only') && !params.get('sc_client_id_only').match(/false|0|no/)) {
      return new Response(clientId);
    }

    if (params.has('raw_responses') && !params.get('raw_responses').match(/false|0|no/)) {
      return Response.json({
        soundcloud__tracks: tracks,
        youtube__playlistItems: await YouTubeAPI.fetchVideos(env.YT_API_KEY),
      });
    }

    const latestUploads: LatestUploads = {
      tracks: tracks.collection
        // sort by last modified date descending
        .sort((a, b) => new Date(b.last_modified).valueOf() - new Date(a.last_modified).valueOf())
        // take first 5 (lol i never updated this to say 7 and it actually confused the hell out of me)
        .slice(0, 7)
        // take only a subset of the keys
        .map(track =>
          pick(
            // fuck you soundcloud give me a higher resolution that 100x100 wtf
            { ...track, artwork_url: track.artwork_url?.replace('-large.jpg', '-t500x500.jpg') },
            keys<LatestUploads['tracks'][0]>()
          )
        ),

      videos: (await YouTubeAPI.fetchVideos(env.YT_API_KEY)).items
        // filter out bobawhale livestream vods (why doesn't he just save the vods himself (╥﹏╥) ╰(◣﹏◢)╯)
        .filter(item => !item.snippet.title.includes("bobawhale"))
        // take first 5
        .slice(0, 5)
        // take only a subset of the keys
        .map(item => ({
          // shortened resourceId.videoId to videoId - trust me, it makes sense to write it this way
          // (omitting the videoId from pick isn't actually necessary since it's not present on the source object anyway
          // and even if it was it would be overridden by the next line but it's just there to avoid possible confusion
          // for when I am inevitably going to have to touch this code sometime in the future)
          // ((( ... also who the fuck am i documenting this for it's not like anyone's ever going to read this lmao ... )))
          ...pick(item.snippet, keys<Omit<LatestUploads['videos'][0], 'videoId'>>()),
          videoId: item.snippet.resourceId.videoId,
        })),
    };

    if (!params.has('merged') || params.get('merged').match(/false|0|no/)) {
      return Response.json(latestUploads);
    }

    const latestUploadsMerged: LatestUploadsMerged = [
      ...latestUploads.tracks.map(track => ({ ...track, type: 'track' as const })),
      ...latestUploads.videos.map(video => ({ ...video, type: 'video' as const })),
    ]
      // sort tracks and videos by either created at date or published at date descending, whichever applies
      .sort(
        (a, b) =>
          new Date(b.type === 'track' ? b.created_at : b.publishedAt).valueOf() -
          new Date(a.type === 'track' ? a.created_at : a.publishedAt).valueOf()
      );

    return Response.json(latestUploadsMerged);
  } catch (e) {
    if (e instanceof Error) {
      return new Response(e.message + ' ' + (e as Error).cause + ' ' + e.stack, { status: 500 });
    } else {
      return new Response('Error:  ' + e, { status: 500 });
    }
  }
};

// "Rationale":
// * On mobile we want to merge the soundcloud and youtube list into a single one,
//   sorted by upload date (of both youtube videos and soundcloud tracks).
// * On desktop we want to show the two lists seperately side-by-side.

import { LatestUploadsMerged } from '../shared/LatestUploads';

const combinedList: HTMLDivElement = document.querySelector('#combined-list');
const ytVideoList: HTMLDivElement = document.querySelector('#yt-videolist');
const scTrackList: HTMLDivElement = document.querySelector('#sc-tracklist');

const mediaQuery = matchMedia('(min-width: 1400px)');

// need this because browser windows can be resized
mediaQuery.addEventListener('change', e => {
  if (e.matches) {
    // split the combined list into two seperate ones
    while (combinedList.children.length > 0) {
      const el = combinedList.children[0] as HTMLElement;
      (el.dataset['type'] === 'track' ? scTrackList : ytVideoList).append(el);
    }
  } else {
    // merge both lists into one (applying a sort of merge sort?)
    while (scTrackList.children.length > 0 || ytVideoList.children.length > 0) {
      // never would i have thought that i'd ever have to convince typescript that something could also be undefined
      // and especially not that it'd be so fucking hard
      // actually i give up i don't think it's even possible
      const trackEl = scTrackList.children[0] as HTMLElement | undefined;
      const videoEl = ytVideoList.children[0] as HTMLElement | undefined;

      // implicit conversion from string to number when using >/<
      combinedList.append(
        !videoEl || trackEl?.dataset['sortIndex'] < videoEl.dataset['sortIndex'] ? trackEl : videoEl
      );
    }
  }
});

// TODO: error handling!!!
try {
  const latestUploads: LatestUploadsMerged = await fetch('/latestuploads?merged=true')
    .then(res => (res.ok ? res : Promise.reject(res)))
    .then(res => res.json())
    .catch(async res => Promise.reject(await res.text()));

  latestUploads.forEach((upload, index) => {
    const thumbnailUrl =
      upload.type === 'track'
        ? upload.artwork_url
        : (
            upload.thumbnails.maxres ??
            upload.thumbnails.high ??
            upload.thumbnails.medium ??
            upload.thumbnails.default
          ).url;
    const permalink =
      upload.type === 'track' ? upload.permalink_url : `https://youtube.com/watch?v=${upload.videoId}`;

    const uploadDate = new Date(upload.type === 'track' ? upload.created_at : upload.publishedAt);
    // fuck your locale
    const formattedUploadDate =
      ('0' + uploadDate.getDate()).slice(-2) +
      '-' +
      ('0' + (uploadDate.getMonth() + 1)).slice(-2) +
      '-' +
      uploadDate.getFullYear();

    const targetList = mediaQuery.matches
      ? upload.type === 'track'
        ? scTrackList
        : ytVideoList
      : combinedList;

    // TODO: display date on this as well
    targetList.insertAdjacentHTML(
      'beforeend',
      // using the index in the array as a sort index since the array was presorted server-side already
      `<a class="upload-wrapper" href="${permalink}" data-type="${upload.type}" data-sort-index="${index}">
      <div>
        <img class="${upload.type === 'track' ? 'soundcloud' : 'youtube'}" src="${thumbnailUrl}" />
        <div class="content">
          <h3>${upload.title}</h3>
          <p>${upload.description}</p>
          <span class="upload-date">${formattedUploadDate}</span>
          <i class="fab fa-${upload.type === 'track' ? 'soundcloud' : 'youtube'} fa-fw"></i>
        </div>
      </div>
    </a>`
    );
  });
} catch (e) {
  document.querySelector('main').insertAdjacentHTML('afterbegin', `<p id="error-msg">${e}</p>`);
}

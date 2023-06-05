import { SCAPIv2TrackList } from './SCAPIv2TrackList';
import { YTDataAPIv3PlaylistItems } from './YTDataAPIv3PlaylistItems';

export interface LatestUploads {
  tracks: SCAPIv2TrackList['collection'];
  videos: (Omit<YTDataAPIv3PlaylistItems['items'][0]['snippet'], 'resourceId'> & { videoId: string })[];
}

export type LatestUploadsMerged = (
  | (LatestUploads['tracks'][0] & { type: 'track' })
  | (LatestUploads['videos'][0] & { type: 'video' })
)[];

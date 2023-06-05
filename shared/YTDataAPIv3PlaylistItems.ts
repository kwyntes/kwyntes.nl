// contains only the keys we care about
export interface YTDataAPIv3PlaylistItems {
  items: {
    snippet: {
      publishedAt: string;
      title: string;
      description: string;
      thumbnails: {
        // some of these are optional but i'm too lazy to try and figure out which
        default: YTDataAPIv3Thumbnail;
        medium: YTDataAPIv3Thumbnail;
        high: YTDataAPIv3Thumbnail;
        standard: YTDataAPIv3Thumbnail;
        maxres: YTDataAPIv3Thumbnail;
      };
      position: number;
      resourceId: {
        videoId: string;
      };
    };
  }[];
}

interface YTDataAPIv3Thumbnail {
  url: string;
  width: number;
  height: number;
}

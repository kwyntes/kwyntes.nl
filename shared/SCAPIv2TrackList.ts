// contains only the keys we care about
export interface SCAPIv2TrackList {
  collection: {
    artwork_url?: string;
    created_at: string;
    description: string;
    // normal duration is probably limited by not having a Go Next Plus Unlimited Next Next Plus++ or whatever subscription
    // so it becomes only 30 seconds then but that's only for those top billboard tracks and shit and won't apply here
    full_duration: number;
    genre: string;
    id: string;
    last_modified: string;
    likes_count: number; // :(
    permalink_url: string;
    playback_count: number; // :((
    title: string;
    waveform_url: string; // if we can figure out how this works...
  }[];
}

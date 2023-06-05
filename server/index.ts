import latestUploadsHandler from './latestuploads.js';

export interface Env {
  ASSETS: Fetcher;

  KV: KVNamespace;

  YT_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === '/latestuploads') {
      return latestUploadsHandler(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

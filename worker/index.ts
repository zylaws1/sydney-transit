export interface Env {
  TFNSW_API_KEY: string;
  ASSETS: Fetcher;
}

// Cloudflare account creates new projects as Workers-with-static-assets now
// (the classic standalone "Pages" product isn't offered for new projects),
// so this single Worker does both jobs that used to be split across Pages'
// static hosting + functions/api/tfnsw/[[path]].ts:
// 1. Proxy /api/tfnsw/<endpoint> to TfNSW's real API with the server-side
//    API key attached (same reason as before: no CORS headers on their
//    side, and the key must never reach the browser).
// 2. Everything else: serve the built static site via the ASSETS binding.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
      if (url.pathname === '/api/tfnsw-debug') {
          const key = env.TFNSW_API_KEY;
          return new Response(
              JSON.stringify({
                  present: typeof key === 'string' && key.length > 0,
                  length: typeof key === 'string' ? key.length : 0,
                  hasLeadingOrTrailingWhitespace:
                  typeof key === 'string' && key !== key.trim(),
              }),
              { headers: { 'Content-Type': 'application/json' } },
          );
      }
    if (url.pathname.startsWith('/api/tfnsw/')) {
      const endpoint = url.pathname.replace('/api/tfnsw/', '');
      if (!endpoint) {
        return new Response(JSON.stringify({ error: 'Missing TfNSW endpoint' }), { status: 400 });
      }

      const upstreamUrl = new URL(`https://api.transport.nsw.gov.au/v1/tp/${endpoint}`);
      upstreamUrl.search = url.search;

      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        headers: {
          Authorization: `apikey ${env.TFNSW_API_KEY}`,
          Accept: 'application/json',
        },
      });

      const body = await upstreamResponse.text();
      return new Response(body, {
        status: upstreamResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};

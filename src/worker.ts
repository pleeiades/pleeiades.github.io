const ALLOWED_ORIGIN = 'https://static.arasaac.org/';

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/pictogram-proxy') {
      const target = url.searchParams.get('url');

      if (!target) {
        return new Response('Missing url parameter', { status: 400 });
      }

      if (!target.startsWith(ALLOWED_ORIGIN)) {
        return new Response('URL must start with https://static.arasaac.org/', { status: 400 });
      }

      let upstream: Response;
      try {
        upstream = await fetch(target);
      } catch {
        return new Response('Failed to fetch upstream image', { status: 502 });
      }

      if (!upstream.ok) {
        return new Response(`Upstream returned ${upstream.status}`, { status: 502 });
      }

      const contentType = upstream.headers.get('Content-Type') ?? 'image/png';
      const body = await upstream.arrayBuffer();

      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=7776000',
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};

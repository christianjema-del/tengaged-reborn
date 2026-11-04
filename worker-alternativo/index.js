/**
 * Tengaged Reborn V75: alternativa de entrada en workers.dev.
 * Este Worker sirve de proxy del proyecto de Pages; no almacena cuentas, sesiones ni datos.
 * La URL de destino es fija: no acepta proxys abiertos ni redirecciones arbitrarias.
 */
const ORIGIN = 'https://tengaged-reborns.pages.dev';

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    if (incoming.pathname === '/__v75') {
      return new Response('Tengaged Reborn acceso alternativo V75', {
        headers: {'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store'}
      });
    }
    const upstream = new URL(incoming.pathname + incoming.search, ORIGIN);
    const headers = new Headers(request.headers);
    // No reenviar cabeceras cuyo host/identidad pertenece al acceso del visitante.
    headers.delete('host');
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ipcountry');
    headers.delete('x-forwarded-host');
    // Only normalize a same-origin request to this trusted proxy. Preserve foreign Origins.
    if(headers.get('origin')===incoming.origin)headers.set('origin',ORIGIN);
    const outbound = new Request(upstream.toString(), {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual'
    });
    let reply;
    try {
      reply = await fetch(outbound);
    } catch (_err) {
      return new Response(`No se puede conectar con el servidor de Tengaged en este momento.`, {
        status: 502,
        headers: {'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}
      });
    }
    const responseHeaders = new Headers(reply.headers);
    const redirect = responseHeaders.get('location');
    if (redirect) {
      try {
        const redirectURL = new URL(redirect, ORIGIN);
        if (redirectURL.origin === ORIGIN) {
          responseHeaders.set('location', incoming.origin + redirectURL.pathname + redirectURL.search + redirectURL.hash);
        }
      } catch (_err) {}
    }
    // Hostname alternativo: evitar políticas de cookies específicas de pages.dev.
    const cookies = responseHeaders.get('set-cookie');
    if (cookies && /(?:^|;)\s*domain=/i.test(cookies)) {
      responseHeaders.set('set-cookie', cookies.replace(/;\s*domain=[^;]*/ig, ''));
    }
    responseHeaders.set('x-tengaged-access', 'v75-worker-proxy');
    return new Response(reply.body, {status: reply.status, statusText: reply.statusText, headers: responseHeaders});
  }
};

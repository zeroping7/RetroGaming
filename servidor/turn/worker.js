// Worker de Cloudflare que entrega credenciales TURN temporales a RetroGaming (D-009).
// No se publica desde este repo: se pega a mano en el panel de Cloudflare.
// Variables del Worker (Settings → Variables and Secrets):
//   TURN_KEY_ID        → texto: el "Turn Token ID" de la clave TURN
//   TURN_KEY_API_TOKEN → secreto: el "API Token" de la clave TURN
// Las credenciales caducan a las 3 h (ttl) para limitar el abuso si alguien las copia.
// Respuesta: { iceServers: [...] }, lista para new RTCPeerConnection({ iceServers }).

const ORIGENES = ['https://zeroping7.github.io'];

export default {
  async fetch(request, env) {
    const origen = request.headers.get('Origin');
    const cors = {
      'Access-Control-Allow-Origin': origen && ORIGENES.includes(origen) ? origen : ORIGENES[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    // Sin cabecera Origin (abrir la URL en el navegador) se permite, para poder probarlo.
    if (origen && !ORIGENES.includes(origen)) {
      return new Response('Origen no permitido', { status: 403, headers: cors });
    }

    const r = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: 10800 }),
      },
    );
    if (!r.ok) return new Response('Error de Cloudflare: ' + r.status, { status: 502, headers: cors });

    const { iceServers } = await r.json();
    // Los navegadores bloquean el puerto 53: se quitan esas URLs para que no haya esperas.
    for (const s of iceServers) s.urls = [].concat(s.urls).filter((u) => !/:53(\?|$)/.test(u));

    return Response.json({ iceServers }, { headers: { ...cors, 'Cache-Control': 'no-store' } });
  },
};

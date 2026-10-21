// Servidores ICE para la conexión directa por WebRTC (D-009).
// STUN: le dice a cada móvil cuál es su dirección pública, para que el otro pueda llegar a él.
// Hoy solo STUN público y gratuito. Para añadir TURN más adelante, basta con que esta función
// devuelva también los servidores del Worker (servidor/turn/worker.js).

export function servidoresIce() {
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ];
}

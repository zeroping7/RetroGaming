// Sala online compartida entre juegos (plan de 000-plataforma §4, docs/arquitectura.md §5).
// Hoy va por MQTT contra varios servidores públicos a la vez (D-004): todo se envía por todos
// y se acepta lo primero que llegue por cualquiera. En T014 se añade WebRTC directo (D-009)
// sin cambiar esta API.
//
// La sala añade a cada mensaje los campos `n` (secuencia), `_t`, `_e` y `_a` (medida del
// retardo). Los juegos no deben usar esos nombres para sus datos.

const MQTT_URL = 'https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js';
const SERVIDORES = [
  { url: 'wss://public.cloud.shiftr.io:443', username: 'public', password: 'public' },
  { url: 'wss://broker.hivemq.com:8884/mqtt' },
  { url: 'wss://broker.emqx.io:8084/mqtt' },
];
const ESPERA_CONEXION = 10000; // ms antes de dar la conexión por fallida
const RETARDO_INICIAL = 300;   // ms de ida y vuelta supuestos hasta medir el real

export const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I/L

export function codigoAleatorio() {
  let s = '';
  for (let i = 0; i < 4; i++) s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  return s;
}

export function codigoValido(c) {
  return typeof c === 'string' && c.length === 4 && [...c].every((ch) => ALFABETO.includes(ch));
}

let cargaMqtt = null;
function cargarMqtt() {
  if (globalThis.mqtt) return Promise.resolve(globalThis.mqtt);
  if (!cargaMqtt) {
    cargaMqtt = new Promise((ok, mal) => {
      const s = document.createElement('script');
      s.src = MQTT_URL;
      s.onload = () => (globalThis.mqtt ? ok(globalThis.mqtt) : mal(new Error('MQTT no disponible')));
      s.onerror = () => { cargaMqtt = null; s.remove(); mal(new Error('MQTT no disponible')); };
      document.head.appendChild(s);
    });
  }
  return cargaMqtt;
}

/**
 * Se conecta a la sala y se resuelve en cuanto responde el primer servidor.
 * @param {object} o
 * @param {string} o.juego      id del juego (prefijo de los temas)
 * @param {number} o.version    versión del protocolo del juego (súbela si cambian sus mensajes)
 * @param {string} o.codigo     código de 4 caracteres
 * @param {string[]} o.escuchar temas que envía el otro jugador (p. ej. el anfitrión escucha ['in'])
 * @returns {Promise<{
 *   codigo: string, via: 'mqtt', retardo: number, retardoMedido: boolean,
 *   enviar(tema: string, datos: object): void, alRecibir(fn: (tema: string, datos: object) => void): void,
 *   servidores(): string, cerrar(): void }>}
 *   `retardo`: ida y vuelta suavizada, en ms. `servidores()`: p. ej. '✓1 ✓2 ✗3'.
 */
export async function crearSala({ juego, version, codigo, escuchar }) {
  let mqtt;
  try { mqtt = await cargarMqtt(); } catch { throw new Error('Sin conexión: el modo online necesita internet.'); }

  const base = `${juego}/v${version}/${codigo}/`;
  const todos = [];      // clientes creados
  const conectados = []; // clientes que han conectado alguna vez
  const ultimo = {};     // última secuencia recibida por tema
  let seq = Date.now();  // así, tras recargar la página, la secuencia sigue subiendo
  let cerrada = false, oyente = null;
  let ecoT = null, ecoEn = 0; // última hora del otro jugador y cuándo llegó

  const sala = {
    codigo,
    via: 'mqtt',
    retardo: RETARDO_INICIAL,
    retardoMedido: false,
    enviar(tema, datos) {
      if (cerrada) return;
      const ahora = performance.now();
      datos.n = ++seq;
      datos._t = Math.round(ahora);
      if (ecoT !== null) { datos._e = ecoT; datos._a = Math.round(ahora - ecoEn); }
      const m = JSON.stringify(datos);
      for (const c of conectados) {
        try { if (c.connected) c.publish(base + tema, m, { qos: 0 }); } catch {}
      }
    },
    alRecibir(fn) { oyente = fn; },
    servidores() {
      return SERVIDORES.map((_, i) => (conectados.some((c) => c.connected && c.__i === i) ? '✓' : '✗') + (i + 1)).join(' ');
    },
    cerrar() {
      cerrada = true;
      for (const c of todos) { try { c.end(true); } catch {} }
    },
  };

  function recibir(tp, buf) {
    if (cerrada || !tp.startsWith(base)) return;
    const tema = tp.slice(base.length);
    if (!escuchar.includes(tema)) return;
    let d;
    try { d = JSON.parse(buf.toString()); } catch { return; }
    if (!d || typeof d !== 'object' || typeof d.n !== 'number') return;
    // Llega repetido por cada servidor: se acepta solo lo nuevo
    const u = ultimo[tema];
    if (u !== undefined && d.n <= u && u - d.n < 1000) return;
    ultimo[tema] = d.n;

    // Retardo: el otro devuelve mi hora (_e) y cuánto tardó en contestar (_a)
    const ahora = performance.now();
    if (typeof d._t === 'number' && isFinite(d._t)) { ecoT = d._t; ecoEn = ahora; }
    if (typeof d._e === 'number' && typeof d._a === 'number') {
      const rtt = ahora - d._e - d._a;
      if (rtt > 0 && rtt < 3000) {
        sala.retardo = sala.retardoMedido ? sala.retardo + (rtt - sala.retardo) * 0.2 : rtt;
        sala.retardoMedido = true;
      }
    }
    if (oyente) oyente(tema, d);
  }

  return new Promise((ok, mal) => {
    let lista = false;
    SERVIDORES.forEach((s, i) => {
      let c;
      try {
        c = mqtt.connect(s.url, {
          clientId: 'rg_' + Math.random().toString(36).slice(2, 12), clean: true,
          connectTimeout: 8000, reconnectPeriod: 3000, keepalive: 20, username: s.username, password: s.password,
        });
      } catch { return; }
      c.__i = i;
      todos.push(c);
      c.on('connect', () => {
        if (cerrada) return;
        if (!conectados.includes(c)) conectados.push(c);
        c.subscribe(escuchar.map((t) => base + t), { qos: 0 });
        if (!lista) { lista = true; ok(sala); }
      });
      c.on('message', recibir);
    });
    setTimeout(() => {
      if (!lista) { sala.cerrar(); mal(new Error('No se pudo conectar al servidor. Revisa la conexión.')); }
    }, ESPERA_CONEXION);
  });
}

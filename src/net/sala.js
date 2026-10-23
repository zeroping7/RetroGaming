// Sala online compartida entre juegos (plan de 000-plataforma §4, docs/arquitectura.md §5).
//
// Dos vías, con la misma API para el juego:
//  - MQTT contra varios servidores públicos a la vez (D-004): siempre conectado. Sirve para
//    encontrarse con el código, para preparar la conexión directa y como respaldo.
//  - WebRTC directo (D-009): en cuanto abre, los datos del juego van de móvil a móvil.
//    En la misma WiFi no salen de casa. Si se cae, se vuelve a MQTT sin cortar la partida.
//
// La sala añade a cada mensaje los campos `n` (secuencia), `_t`, `_e` y `_a` (medida del
// retardo). Los juegos no deben usar esos nombres para sus datos.

import { servidoresIce } from './ice.js';

const MQTT_URL = 'https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js';
const SERVIDORES = [
  { url: 'wss://public.cloud.shiftr.io:443', username: 'public', password: 'public' },
  { url: 'wss://broker.hivemq.com:8884/mqtt' },
  { url: 'wss://broker.emqx.io:8084/mqtt' },
];
const ESPERA_CONEXION = 10000; // ms antes de dar la conexión MQTT por fallida
const RETARDO_INICIAL = 300;   // ms de ida y vuelta supuestos hasta medir el real
const ESPERA_DIRECTA = 6000;   // ms que se espera a que abra la conexión directa antes de reintentar
const INTENTOS_DIRECTA = 3;
// Sin orden (un mensaje viejo no frena a los nuevos) y con 2 reintentos rápidos por si se pierde
// alguno: en una WiFi tardan milisegundos y evitan perder, por ejemplo, un disparo.
const CANAL = { ordered: false, maxRetransmits: 2 };

// Prueba de mala conexión (constitución Q2, D-014): ?lag=150&loss=5 añade 150 ms a la ida y
// vuelta (la mitad al enviar y la otra mitad al recibir) y pierde un 5 % de los mensajes.
const PRUEBA_RED = (() => {
  try {
    const q = new URLSearchParams(location.search);
    return { lag: Math.max(0, Math.min(3000, Number(q.get('lag')) || 0)), loss: Math.max(0, Math.min(90, Number(q.get('loss')) || 0)) };
  } catch { return { lag: 0, loss: 0 }; }
})();
function conMalaRed(fn) {
  if (!PRUEBA_RED.lag && !PRUEBA_RED.loss) { fn(); return; }
  if (Math.random() * 100 < PRUEBA_RED.loss) return;
  if (PRUEBA_RED.lag) setTimeout(fn, PRUEBA_RED.lag / 2); else fn();
}

export const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I/L

export function codigoAleatorio() {
  let s = '';
  for (let i = 0; i < 4; i++) s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  return s;
}

export function codigoValido(c) {
  return typeof c === 'string' && c.length === 4 && [...c].every((ch) => ALFABETO.includes(ch));
}

// Enlace para unirse a una partida (plan de 000 §6, D-008): <sitio>/juegos/<id>/?sala=CODIGO
const RAIZ = new URL('../../', import.meta.url);
export function enlaceDePartida(idJuego, codigo) {
  return new URL(`juegos/${idJuego}/?sala=${codigo}`, RAIZ).href;
}

/** Código de `?sala=` en la URL actual, o null si no hay o no es válido. Lo quita de la URL. */
export function codigoDeUrl() {
  const u = new URL(location.href);
  const c = (u.searchParams.get('sala') || '').trim().toUpperCase();
  if (u.searchParams.has('sala')) {
    u.searchParams.delete('sala');
    history.replaceState(history.state, '', u.pathname + u.search + u.hash); // recargar no vuelve a unirse
  }
  return codigoValido(c) ? c : null;
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
 * Se conecta a la sala y se resuelve en cuanto responde el primer servidor MQTT.
 * La conexión directa se prepara después, sola.
 * @param {object} o
 * @param {string} o.juego       id del juego (prefijo de los temas)
 * @param {number} o.version     versión del protocolo del juego (súbela si cambian sus mensajes)
 * @param {string} o.codigo      código de 4 caracteres
 * @param {string[]} o.escuchar  temas que envía el otro jugador (p. ej. el anfitrión escucha ['in'])
 * @param {boolean} o.anfitrion  el invitado es quien propone la conexión directa
 * @returns {Promise<{
 *   codigo: string, via: 'directa'|'mqtt', retardo: number, retardoMedido: boolean, enviados: number, recibidos: number,
 *   enviar(tema: string, datos: object): void, alRecibir(fn: (tema: string, datos: object) => void): void,
 *   servidores(): string, cerrar(): void }>}
 *   `retardo`: ida y vuelta suavizada, en ms. `servidores()`: p. ej. '✓1 ✓2 ✗3'.
 */
export async function crearSala({ juego, version, codigo, escuchar, anfitrion = false }) {
  let mqtt;
  try { mqtt = await cargarMqtt(); } catch { throw new Error('Sin conexión: el modo online necesita internet.'); }

  const base = `${juego}/v${version}/${codigo}/`;
  const yo = Math.random().toString(36).slice(2, 10); // para reconocer mis propias señales
  const todos = [];      // clientes MQTT creados
  const conectados = []; // clientes MQTT que han conectado alguna vez
  const ultimo = {};     // última secuencia recibida por tema
  let seq = Date.now();  // así, tras recargar la página, la secuencia sigue subiendo
  let cerrada = false, oyente = null;
  let ecoT = null, ecoEn = 0; // última hora del otro jugador y cuándo llegó

  // Conexión directa
  const hayWebRTC = typeof RTCPeerConnection === 'function';
  let pc = null, canal = null, otro = null, intento = 0, intentos = 0, espera = 0;
  let pendientes = [];          // candidatos ICE que llegan antes de poder usarse
  const senalesVistas = new Set();

  const sala = {
    codigo,
    via: 'mqtt',
    retardo: RETARDO_INICIAL,
    retardoMedido: false,
    /** Bytes enviados y recibidos de datos del juego (para ?debug=1, constitución Q1). */
    enviados: 0,
    recibidos: 0,
    /** Retardo y pérdida simulados con ?lag= y ?loss= (Q2). */
    prueba: PRUEBA_RED,
    enviar(tema, datos) {
      if (cerrada) return;
      const ahora = performance.now();
      datos.n = ++seq;
      datos._t = Math.round(ahora);
      if (ecoT !== null) { datos._e = ecoT; datos._a = Math.round(ahora - ecoEn); }
      const m = JSON.stringify(datos);
      sala.enviados += m.length;
      conMalaRed(() => {
        if (cerrada) return;
        if (canal && canal.readyState === 'open') {
          try { canal.send(tema + '|' + m); return; } catch {}
        }
        publicar(tema, m);
      });
    },
    alRecibir(fn) { oyente = fn; },
    servidores() {
      return SERVIDORES.map((_, i) => (conectados.some((c) => c.connected && c.__i === i) ? '✓' : '✗') + (i + 1)).join(' ');
    },
    cerrar() {
      cerrada = true;
      clearTimeout(espera);
      cerrarDirecta();
      for (const c of todos) { try { c.end(true); } catch {} }
    },
  };

  function publicar(tema, m) {
    for (const c of conectados) {
      try { if (c.connected) c.publish(base + tema, m, { qos: 0 }); } catch {}
    }
  }

  // Mensaje del juego, llegue por la vía que llegue (con ?lag/?loss, después de la espera simulada)
  function procesar(tema, d, bytes) {
    conMalaRed(() => { if (!cerrada) procesarYa(tema, d, bytes); });
  }
  function procesarYa(tema, d, bytes) {
    if (!d || typeof d !== 'object' || typeof d.n !== 'number') return;
    // Por MQTT llega repetido (un servidor por copia) y sin orden por la vía directa:
    // se acepta solo lo más nuevo
    const u = ultimo[tema];
    if (u !== undefined && d.n <= u && u - d.n < 1000) return;
    ultimo[tema] = d.n;
    sala.recibidos += bytes || 0;

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

  function recibirMqtt(tp, buf) {
    if (cerrada || !tp.startsWith(base)) return;
    const tema = tp.slice(base.length);
    let d;
    const txt = buf.toString();
    try { d = JSON.parse(txt); } catch { return; }
    if (tema === 'rtc') senal(d);
    else if (escuchar.includes(tema)) procesar(tema, d, txt.length);
  }

  /* ---------- conexión directa (WebRTC) ----------
     Señalización por el tema `rtc` de MQTT: el invitado manda una oferta, el anfitrión
     responde y los dos se pasan sus candidatos (direcciones posibles) hasta que una funciona. */

  function enviarSenal(o) {
    o.de = yo; o.n = ++seq;
    if (otro) o.para = otro;
    publicar('rtc', JSON.stringify(o));
  }

  function senal(d) {
    if (!d || typeof d !== 'object' || typeof d.de !== 'string' || d.de === yo || typeof d.n !== 'number') return;
    if (d.para && d.para !== yo) return;
    const clave = d.de + ':' + d.n; // las señales llegan repetidas y sin orden: se mira si ya se vio
    if (senalesVistas.has(clave)) return;
    senalesVistas.add(clave);
    if (senalesVistas.size > 300) senalesVistas.clear();
    if (typeof d.i !== 'number') return;

    if (d.tipo === 'oferta' && anfitrion && typeof d.sdp === 'string' && d.sdp.length < 20000) atenderOferta(d);
    else if (d.tipo === 'respuesta' && !anfitrion && typeof d.sdp === 'string' && d.sdp.length < 20000) atenderRespuesta(d);
    else if (d.tipo === 'ice' && d.c && typeof d.c === 'object') {
      if (pendientes.length < 60) pendientes.push({ de: d.de, i: d.i, c: d.c });
      vaciarPendientes();
    }
  }

  function vaciarPendientes() {
    if (!pc || !pc.remoteDescription || !otro) return;
    const p = pc;
    pendientes = pendientes.filter((x) => {
      if (x.de !== otro || x.i !== intento) return x.i >= intento; // los de intentos viejos se tiran
      p.addIceCandidate(x.c).catch(() => {});
      return false;
    });
  }

  function nuevaConexion(i) {
    const p = new RTCPeerConnection({ iceServers: servidoresIce() });
    p.onicecandidate = (e) => { if (e.candidate && pc === p) enviarSenal({ tipo: 'ice', i, c: e.candidate.toJSON() }); };
    p.onconnectionstatechange = () => {
      if (pc === p && (p.connectionState === 'failed' || p.connectionState === 'closed')) perderDirecta();
    };
    if (anfitrion) p.ondatachannel = (e) => prepararCanal(e.channel, p);
    return p;
  }

  function prepararCanal(ch, p) {
    ch.onopen = () => {
      if (pc !== p || cerrada) return;
      canal = ch; sala.via = 'directa';
      sala.retardoMedido = false; // se vuelve a medir por la vía nueva
      intentos = 0;
      clearTimeout(espera);
    };
    ch.onclose = () => { if (canal === ch) perderDirecta(); };
    ch.onmessage = (e) => {
      if (cerrada || typeof e.data !== 'string') return;
      const k = e.data.indexOf('|');
      if (k < 1) return;
      const tema = e.data.slice(0, k);
      if (!escuchar.includes(tema)) return;
      let d;
      try { d = JSON.parse(e.data.slice(k + 1)); } catch { return; }
      procesar(tema, d, e.data.length - k - 1);
    };
  }

  function cerrarDirecta() {
    if (pc) { try { pc.close(); } catch {} }
    pc = null; canal = null; sala.via = 'mqtt';
  }

  // Se cayó la directa: se sigue por MQTT y el invitado lo vuelve a intentar
  function perderDirecta() {
    const estaba = sala.via === 'directa';
    cerrarDirecta();
    if (estaba) sala.retardoMedido = false;
    if (!anfitrion && !cerrada) { clearTimeout(espera); espera = setTimeout(intentarDirecta, 1000); }
  }

  // Invitado: propone la conexión directa
  async function intentarDirecta() {
    if (!hayWebRTC || anfitrion || cerrada || intentos >= INTENTOS_DIRECTA) return;
    if (canal && canal.readyState === 'open') return;
    intentos++; intento++;
    cerrarDirecta(); otro = null;
    const p = pc = nuevaConexion(intento);
    prepararCanal(p.createDataChannel('juego', CANAL), p);
    try {
      await p.setLocalDescription(await p.createOffer());
      if (pc === p) enviarSenal({ tipo: 'oferta', i: intento, sdp: p.localDescription.sdp });
    } catch {}
    clearTimeout(espera);
    espera = setTimeout(() => { if (sala.via !== 'directa') intentarDirecta(); }, ESPERA_DIRECTA);
  }

  async function atenderRespuesta(d) {
    if (!pc || d.i !== intento || pc.signalingState !== 'have-local-offer') return;
    const p = pc;
    otro = d.de;
    try { await p.setRemoteDescription({ type: 'answer', sdp: d.sdp }); vaciarPendientes(); } catch {}
  }

  // Anfitrión: acepta la oferta del invitado (una nueva sustituye a la anterior)
  async function atenderOferta(d) {
    if (!hayWebRTC || cerrada) return;
    cerrarDirecta();
    otro = d.de; intento = d.i;
    const p = pc = nuevaConexion(d.i);
    try {
      await p.setRemoteDescription({ type: 'offer', sdp: d.sdp });
      vaciarPendientes();
      await p.setLocalDescription(await p.createAnswer());
      if (pc === p) enviarSenal({ tipo: 'respuesta', i: d.i, sdp: p.localDescription.sdp });
    } catch {}
  }

  /* ---------- MQTT ---------- */
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
        c.subscribe(escuchar.concat('rtc').map((t) => base + t), { qos: 0 });
        if (!lista) {
          lista = true;
          ok(sala);
          setTimeout(intentarDirecta, 300); // da tiempo a que conecten los demás servidores
        }
      });
      c.on('message', recibirMqtt);
    });
    setTimeout(() => {
      if (!lista) { sala.cerrar(); mal(new Error('No se pudo conectar al servidor. Revisa la conexión.')); }
    }, ESPERA_CONEXION);
  });
}

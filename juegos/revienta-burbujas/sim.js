// Reglas de Revienta Burbujas (constitución A1): JavaScript puro, sin canvas ni DOM.
// Recibe el estado y las entradas de cada jugador y lo avanza. Lo usan el modo local,
// el anfitrión online y la predicción del invitado.

export const W = 400, H = 560, FLOOR = 520;
export const R = [0, 9, 16, 26, 40];          // radio por tamaño (1 a 4)
export const BOUNCE = [0, 150, 230, 310, 380]; // altura del bote por tamaño
export const G = 900;                          // gravedad, px/s²
export const VEL_JUGADOR = 220, VEL_ARPON = 520; // px/s
const PUNTOS = [0, 100, 60, 40, 20];           // por burbuja, de pequeña a grande
const ESTADOS = ['ready', 'play', 'dead', 'clear', 'over'];

// Armas (spec 002). El índice es lo que viaja por la red.
export const ARMAS = ['normal', 'doble', 'fijo', 'triple'];
const MAX_ARPONES = [1, 2, 1, 3];               // arpones a la vez, por arma
export const ESPERA_DISPARO = 0.2;              // s entre disparos (que el doble no salga de golpe)
export const FIJO_SEG = 3;                      // s que el arpón fijo se queda clavado en el techo
export const SEP_TRIPLE = 24;                   // px entre las líneas del triple

// Potenciadores (spec 002)
export const VEL_ARPON_RAPIDO = 900;            // px/s con «velocidad»
export const RAPIDO_SEG = 10;
export const INVULNERABLE_SEG = 1;              // tras romperse el escudo
export const RELOJ_SEG = 5;
const MAX_BURBUJAS = 40;                        // tope al partir con dinamita

// Objetos (spec 002)
export const TIPOS = ['doble', 'fijo', 'triple', 'velocidad', 'escudo', 'dinamita', 'reloj'];
const PESOS = [25, 20, 20, 15, 12, 4, 4];       // probabilidad relativa de cada tipo (suman 100)
export const PROB_OBJETO = 1 / 8;               // por burbuja reventada
export const MAX_OBJETOS = 2;
export const TAM_OBJETO = 16;                   // px de lado
export const OBJ_EN_SUELO = 10;                 // s que espera en el suelo antes de desaparecer
export const OBJ_PARPADEO = 2;                  // s finales en los que parpadea
const G_OBJETO = 600, SALTO_OBJETO = -160;      // caída y pequeño salto inicial, px/s² y px/s
const PUNTOS_OBJETO = 100;

/** @typedef {{ s: number, x: number, y: number, vx: number, vy: number }} Burbuja  s: tamaño 1-4
 *  @typedef {{ x: number, top: number, fijo: boolean, clavado: number }} Arpon
 *  clavado: s que le quedan clavado en el techo (0 = subiendo). Solo el arpón fijo se clava.
 *  @typedef {Object} Jugador
 *  @property {number} x, w, h, dir
 *  @property {number} arma          índice en ARMAS
 *  @property {Arpon[]} arpones
 *  @property {number} espera        s hasta poder volver a disparar
 *  @property {boolean} escudo
 *  @property {number} invulnerable  s sin daño (tras romperse el escudo)
 *  @property {number} rapido        s de velocidad que quedan
 *  @typedef {{ x: number, y: number, s: number, t: number }} Estallido  anillo visual
 *  @typedef {{ tipo: number, x: number, y: number, vy: number, enSuelo: number }} Objeto
 *  tipo: índice en TIPOS. enSuelo: segundos desde que tocó el suelo (-1 mientras cae).
 *  @typedef {Object} Estado
 *  @property {1|2} n          jugadores
 *  @property {'ready'|'play'|'dead'|'clear'|'over'|'again'} state  'again': fin de partida y alguien pulsó disparo
 *  @property {number} t       segundos que quedan de la fase actual
 *  @property {number} lvl, score, lives
 *  @property {number} hit     jugador tocado (-1 ninguno)
 *  @property {number} ronda   sube cada vez que se reinicia el nivel
 *  @property {number} congelado  s de reloj que quedan (0 = nada)
 *  @property {Burbuja[]} balls
 *  @property {Jugador[]} ps
 *  @property {Estallido[]} pop
 *  @property {Objeto[]} objetos
 *  @property {number} semilla  estado del generador aleatorio (nunca Math.random() aquí)
 *  @property {number[]|null} prueba  modo de prueba: tipos que caen siempre, por turnos
 *
 *  @typedef {{ left: boolean, right: boolean, a: boolean, x?: number }} Entrada
 *  `x` (opcional): posición a la que acercar al jugador, en vez de moverlo con left/right.
 *  La usa el anfitrión para el invitado online.
 */

/** Número aleatorio entre 0 y 1 a partir de la semilla del estado (mulberry32): mismo
 *  resultado con la misma semilla, así las pruebas son repetibles. */
function azar(st) {
  let t = (st.semilla = (st.semilla + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function tipoAlAzar(st) {
  let r = azar(st) * 100;
  for (let i = 0; i < PESOS.length; i++) { if ((r -= PESOS[i]) < 0) return i; }
  return 0;
}

/* ---------- objetos ---------- */

/** Suelta un objeto en (x, y). `tipo` opcional (índice o nombre); si no, al azar. */
export function soltarObjeto(st, x, y, tipo) {
  const t = typeof tipo === 'string' ? TIPOS.indexOf(tipo) : typeof tipo === 'number' ? tipo : tipoAlAzar(st);
  const m = TAM_OBJETO / 2;
  st.objetos.push({ tipo: t, x: Math.max(m, Math.min(W - m, x)), y: Math.min(y, FLOOR - m), vy: SALTO_OBJETO, enSuelo: -1 });
}

// Al reventar una burbuja: a veces cae un objeto. En modo de prueba, siempre y por turnos.
function quizaSoltar(st, x, y) {
  if (st.objetos.length >= MAX_OBJETOS) return;
  if (st.prueba && st.prueba.length) { soltarObjeto(st, x, y, st.prueba[st.pruebaI++ % st.prueba.length]); return; }
  if (azar(st) < PROB_OBJETO) soltarObjeto(st, x, y);
}

/** Caída de los objetos y tiempo en el suelo. También lo usa la predicción del invitado. */
export function moverObjetos(list, dt) {
  const suelo = FLOOR - TAM_OBJETO / 2;
  for (const o of list) {
    if (o.enSuelo >= 0) { o.enSuelo += dt; continue; }
    o.vy += G_OBJETO * dt; o.y += o.vy * dt;
    if (o.y >= suelo) { o.y = suelo; o.vy = 0; o.enSuelo = 0; }
  }
}

/* ---------- armas ---------- */

/** Dispara si el arma lo permite (arpones libres y sin espera). También lo usa el invitado. */
export function disparar(p) {
  const arma = ARMAS[p.arma], n = arma === 'triple' ? 3 : 1;
  if (p.espera > 0 || p.arpones.length + n > MAX_ARPONES[p.arma]) return false;
  const top = FLOOR - p.h, fijo = arma === 'fijo';
  if (n === 1) p.arpones.push({ x: p.x, top, fijo, clavado: 0 });
  else for (const d of [-1, 0, 1]) p.arpones.push({ x: Math.max(2, Math.min(W - 2, p.x + d * SEP_TRIPLE)), top, fijo, clavado: 0 });
  p.espera = ESPERA_DISPARO;
  return true;
}

/** Sube los arpones, clava el fijo en el techo y lleva los temporizadores del jugador.
 *  También lo usa el invitado. */
export function moverArpones(p, dt) {
  if (p.espera > 0) p.espera -= dt;
  if (p.invulnerable > 0) p.invulnerable -= dt;
  if (p.rapido > 0) p.rapido -= dt;
  const vel = p.rapido > 0 ? VEL_ARPON_RAPIDO : VEL_ARPON;
  for (let k = p.arpones.length - 1; k >= 0; k--) {
    const a = p.arpones[k];
    if (a.clavado > 0) { a.clavado -= dt; if (a.clavado <= 0) p.arpones.splice(k, 1); continue; }
    a.top -= vel * dt;
    if (a.top <= 0) {
      if (a.fijo) { a.top = 0; a.clavado = FIJO_SEG; } else p.arpones.splice(k, 1);
    }
  }
}

/* ---------- burbujas ---------- */

function bounceV(s) { return -Math.sqrt(2 * G * BOUNCE[s]); }
function newBall(s, x, y, dir) { return { s, x, y, vx: dir * 70, vy: bounceV(s) * 0.6 }; }

function level(st) {
  const n = st.lvl, b = [];
  const cnt = Math.min(1 + Math.floor((n - 1) / 2), 4) + (st.n - 1), size = Math.min(2 + n, 4);
  for (let i = 0; i < cnt; i++) b.push(newBall(size, (W / (cnt + 1)) * (i + 1), 140, i % 2 ? -1 : 1));
  return b;
}

/** ¿Toca la burbuja el segmento vertical del arpón (de `top` al suelo en `sx`)? */
function hitSeg(b, sx, top) {
  const cy = Math.max(top, Math.min(FLOOR, b.y)), dx = b.x - sx, dy = b.y - cy;
  return dx * dx + dy * dy < R[b.s] * R[b.s];
}

/** Mueve burbujas con gravedad y rebotes. También lo usa la predicción del invitado. */
export function moverBurbujas(list, dt) {
  for (const b of list) moverBurbuja(b, dt);
}
function moverBurbuja(b, dt) {
  b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt;
  const r = R[b.s];
  if (b.y + r > FLOOR) { b.y = FLOOR - r; b.vy = bounceV(b.s); }
  if (b.y - r < 0) { b.y = r; b.vy = Math.abs(b.vy); }
  if (b.x - r < 0) { b.x = r; b.vx = Math.abs(b.vx); }
  if (b.x + r > W) { b.x = W - r; b.vx = -Math.abs(b.vx); }
}

// Dinamita: cada burbuja se parte hasta el tamaño más pequeño (sin pasar de 40 en pantalla)
function dinamita(st) {
  const nuevas = [];
  let libres = MAX_BURBUJAS - st.balls.length;
  for (const b of st.balls) {
    const n = 1 << (b.s - 1); // cuántas pequeñas salen de esta
    if (b.s === 1 || n - 1 > libres) { nuevas.push(b); continue; }
    libres -= n - 1;
    st.pop.push({ x: b.x, y: b.y, s: b.s, t: 0.3 });
    for (let j = 0; j < n; j++) {
      const d = j % 2 ? 1 : -1, off = (j - (n - 1) / 2) * R[1] * 2.2;
      const c = newBall(1, Math.max(R[1], Math.min(W - R[1], b.x + off)), b.y, d);
      c.vy = -200;
      nuevas.push(c);
    }
  }
  st.balls = nuevas;
}

/* ---------- partida ---------- */

function nuevoJugador(st, i, antes) {
  return {
    x: st.n === 1 ? W / 2 : W * (i ? 0.7 : 0.3), w: 26, h: 34, dir: 0,
    arma: antes ? antes.arma : 0, escudo: antes ? antes.escudo : false, // se conservan entre niveles
    arpones: [], espera: 0, invulnerable: 0, rapido: 0,
  };
}

function reset(st) {
  st.balls = level(st);
  const antes = st.ps || [];
  st.ps = [];
  for (let i = 0; i < st.n; i++) st.ps.push(nuevoJugador(st, i, antes[i]));
  st.state = 'ready'; st.t = 1.4; st.pop = []; st.objetos = []; st.hit = -1; st.congelado = 0; st.ronda++;
}

/**
 * Partida nueva para 1 o 2 jugadores.
 * @param {number} [semilla] para pruebas repetibles
 * @param {{ prueba?: string[] }} [opciones]  prueba: tipos de objeto que caerán siempre, por turnos
 * @returns {Estado}
 */
export function crear(n, semilla = (Date.now() ^ (performance.now() * 1000)) | 0, opciones = {}) {
  const prueba = (opciones.prueba || []).map((t) => TIPOS.indexOf(t)).filter((t) => t >= 0);
  const st = { n, score: 0, lives: n === 2 ? 5 : 3, lvl: 1, ronda: 0, semilla, prueba: prueba.length ? prueba : null, pruebaI: 0 };
  reset(st);
  return st;
}

/**
 * Avanza el estado `dt` segundos.
 * @param {Estado} st
 * @param {Entrada[]} entradas  una por jugador
 */
export function paso(st, entradas, dt) {
  guardarAnterior(st);
  if (st.state === 'ready') { st.t -= dt; if (st.t <= 0) st.state = 'play'; return; }
  if (st.state === 'dead') { st.t -= dt; if (st.t <= 0) { if (st.lives <= 0) { st.state = 'over'; st.t = 1; } else reset(st); } return; }
  if (st.state === 'clear') { st.t -= dt; if (st.t <= 0) { st.lvl++; reset(st); } return; }
  if (st.state === 'over') { st.t -= dt; if (st.t <= 0 && st.ps.some((p, i) => entradas[i].a)) st.state = 'again'; return; }
  if (st.state !== 'play') return;

  st.ps.forEach((p, i) => {
    const k = entradas[i];
    p.dir = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    if (typeof k.x === 'number') p.x += (k.x - p.x) * Math.min(1, dt * 20);
    else { if (k.left) p.x -= VEL_JUGADOR * dt; if (k.right) p.x += VEL_JUGADOR * dt; }
    p.x = Math.max(p.w / 2, Math.min(W - p.w / 2, p.x));
    if (k.a) disparar(p);
    moverArpones(p, dt);
  });

  // Reloj: las burbujas no se mueven, pero siguen haciendo daño y se pueden romper
  const quietas = st.congelado > 0;
  if (quietas) st.congelado = Math.max(0, st.congelado - dt);

  const nb = [];
  outer: for (const b of st.balls) {
    if (!quietas) moverBurbuja(b, dt);
    const r = R[b.s];
    for (const p of st.ps) {
      const k = p.arpones.findIndex((a) => hitSeg(b, a.x, a.top));
      if (k >= 0) {
        p.arpones.splice(k, 1); st.score += PUNTOS[b.s];
        st.pop.push({ x: b.x, y: b.y, s: b.s, t: 0.3 });
        quizaSoltar(st, b.x, b.y);
        if (b.s > 1) for (const d of [-1, 1]) {
          const n = newBall(b.s - 1, b.x + d * (quietas ? R[b.s - 1] : 4), b.y, d); // congeladas: separadas para verse
          n.vy = -Math.min(420, Math.sqrt(2 * G * BOUNCE[b.s - 1]) * 0.8);
          nb.push(n);
        }
        continue outer;
      }
    }
    for (let i = 0; i < st.ps.length; i++) {
      const p = st.ps[i];
      if (p.invulnerable > 0) continue;
      const px = Math.max(p.x - p.w / 2 + 4, Math.min(p.x + p.w / 2 - 4, b.x)), py = Math.max(FLOOR - p.h + 6, Math.min(FLOOR, b.y));
      if ((b.x - px) ** 2 + (b.y - py) ** 2 < r * r) {
        if (p.escudo) { p.escudo = false; p.invulnerable = INVULNERABLE_SEG; continue; } // el escudo aguanta el golpe
        st.lives--; st.state = 'dead'; st.t = 1.3; st.hit = i;
        p.arma = 0; p.escudo = false; p.rapido = 0; // el tocado lo pierde todo (P2)
        st.ps.forEach((q) => { q.arpones.length = 0; });
        return;
      }
    }
    nb.push(b);
  }
  st.balls = nb;
  st.pop = st.pop.filter((q) => (q.t -= dt) > 0);
  pasoObjetos(st, dt);
  if (!st.balls.length) { st.state = 'clear'; st.t = 1.6; st.score += 500; }
}

/** Objetos: caen, se recogen al tocarlos y desaparecen tras 10 s en el suelo. */
function pasoObjetos(st, dt) {
  moverObjetos(st.objetos, dt);
  const m = TAM_OBJETO / 2;
  for (let k = st.objetos.length - 1; k >= 0; k--) {
    const o = st.objetos[k];
    let quien = -1;
    for (let i = 0; i < st.ps.length && quien < 0; i++) {
      const p = st.ps[i];
      if (Math.abs(o.x - p.x) < p.w / 2 + m && o.y + m > FLOOR - p.h && o.y - m < FLOOR) quien = i;
    }
    if (quien >= 0) { st.objetos.splice(k, 1); recoger(st, quien, o); }
    else if (o.enSuelo >= OBJ_EN_SUELO) st.objetos.splice(k, 1);
  }
}

/** Efecto de recoger un objeto. Las armas sustituyen a la que se llevaba. */
function recoger(st, i, o) {
  const p = st.ps[i], tipo = TIPOS[o.tipo];
  st.score += PUNTOS_OBJETO;
  st.pop.push({ x: o.x, y: o.y, s: 1, t: 0.3 });
  const arma = ARMAS.indexOf(tipo);
  if (arma > 0) { p.arma = arma; p.arpones.length = 0; p.espera = 0; return; }
  if (tipo === 'velocidad') p.rapido = RAPIDO_SEG;
  else if (tipo === 'escudo') p.escudo = true;
  else if (tipo === 'dinamita') dinamita(st);
  else if (tipo === 'reloj') st.congelado = RELOJ_SEG;
}

/** Guarda la posición del tick anterior (ax, ay, atop) para que el dibujo pueda
 *  interpolar entre ticks en pantallas de 90 o 120 Hz. No se envía por la red. */
function guardarAnterior(st) {
  if (!st.ps) return;
  for (const b of st.balls) { b.ax = b.x; b.ay = b.y; }
  for (const p of st.ps) { p.ax = p.x; for (const a of p.arpones) a.atop = a.top; }
  if (st.objetos) for (const o of st.objetos) o.ay = o.y;
}

/* ---------- red ---------- */

const NUM_JUGADOR = 13; // números por jugador en la instantánea

/** Instantánea compacta para enviar al invitado: números redondeados y arrays planos. */
export function codificar(st) {
  const b = [];
  for (const o of st.balls) b.push(o.s, Math.round(o.x), Math.round(o.y), Math.round(o.vx), Math.round(o.vy));
  // por jugador: x, dirección, arma, marcas (1 escudo, 2 invulnerable, 4 rápido)
  // y 3 arpones (x, top, k; k = 0 normal, 1 + décimas clavado si es fijo; -1 si no hay)
  const p = [];
  for (const o of st.ps) {
    p.push(Math.round(o.x), o.dir, o.arma, (o.escudo ? 1 : 0) | (o.invulnerable > 0 ? 2 : 0) | (o.rapido > 0 ? 4 : 0));
    for (let k = 0; k < 3; k++) {
      const a = o.arpones[k];
      if (a) p.push(Math.round(a.x), Math.round(a.top), a.fijo ? 1 + Math.round(a.clavado * 10) : 0);
      else p.push(-1, -1, -1);
    }
  }
  const q = [];
  for (const o of st.pop) q.push(Math.round(o.x), Math.round(o.y), o.s, Math.round(o.t * 100));
  const o = [];
  for (const j of st.objetos) o.push(j.tipo, Math.round(j.x), Math.round(j.y), Math.round(j.vy), Math.round(j.enSuelo * 10));
  return { m: ESTADOS.indexOf(st.state), t: Math.round(st.t * 10), v: st.lvl, sc: st.score, li: st.lives, h: st.hit, c: Math.round(st.congelado * 10), b, p, q, o };
}

/** Lo contrario de `codificar`, validando todo (los mensajes llegan de la red). @returns {Estado|null} */
export function decodificar(d) {
  if (!d || !Array.isArray(d.b) || !Array.isArray(d.p)) return null;
  const s = {
    n: 2, state: ESTADOS[d.m] || 'play', t: (+d.t || 0) / 10, lvl: +d.v || 1, score: +d.sc || 0, lives: +d.li || 0, hit: +d.h,
    congelado: Math.max(0, Math.min(RELOJ_SEG, (+d.c || 0) / 10)), ronda: 0, balls: [], ps: [], pop: [], objetos: [],
  };
  for (let i = 0; i + 4 < d.b.length && s.balls.length < 80; i += 5) {
    const sz = d.b[i] | 0;
    if (sz >= 1 && sz <= 4) s.balls.push({ s: sz, x: +d.b[i + 1], y: +d.b[i + 2], vx: +d.b[i + 3] || 0, vy: +d.b[i + 4] || 0 });
  }
  for (let i = 0; i + NUM_JUGADOR - 1 < d.p.length && s.ps.length < 2; i += NUM_JUGADOR) {
    const arma = d.p[i + 2] | 0, marcas = d.p[i + 3] | 0, arpones = [];
    for (let k = 0; k < 3; k++) {
      const j = i + 4 + k * 3, ax = +d.p[j], at = +d.p[j + 1], f = d.p[j + 2] | 0;
      if (ax >= 0 && at >= 0) arpones.push({ x: ax, top: at, fijo: f > 0, clavado: f > 0 ? Math.min(FIJO_SEG, (f - 1) / 10) : 0 });
    }
    s.ps.push({
      x: +d.p[i] || 0, w: 26, h: 34, dir: Math.max(-1, Math.min(1, d.p[i + 1] | 0)),
      arma: arma >= 0 && arma < ARMAS.length ? arma : 0, arpones, espera: 0,
      escudo: !!(marcas & 1), invulnerable: marcas & 2 ? 0.5 : 0, rapido: marcas & 4 ? 1 : 0,
    });
  }
  if (Array.isArray(d.q)) for (let i = 0; i + 3 < d.q.length && s.pop.length < 40; i += 4) {
    const sz = d.q[i + 2] | 0;
    if (sz >= 1 && sz <= 4) s.pop.push({ x: +d.q[i], y: +d.q[i + 1], s: sz, t: d.q[i + 3] / 100 });
  }
  if (Array.isArray(d.o)) for (let i = 0; i + 4 < d.o.length && s.objetos.length < MAX_OBJETOS; i += 5) {
    const t = d.o[i] | 0;
    if (t >= 0 && t < TIPOS.length) s.objetos.push({ tipo: t, x: +d.o[i + 1] || 0, y: +d.o[i + 2] || 0, vy: +d.o[i + 3] || 0, enSuelo: (+d.o[i + 4] || 0) / 10 });
  }
  return s;
}

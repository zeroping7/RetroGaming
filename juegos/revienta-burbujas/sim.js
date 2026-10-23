// Reglas de Revienta Burbujas (constitución A1): JavaScript puro, sin canvas ni DOM.
// Recibe el estado y las entradas de cada jugador y lo avanza. Lo usan el modo local,
// el anfitrión online y la predicción del invitado.

import { FASES, empiezaMundo } from './fases.js';

export const W = 400, H = 560, FLOOR = 520;
export const R = [0, 9, 16, 26, 40];          // radio por tamaño (1 a 4)
export const BOUNCE = [0, 150, 230, 310, 380]; // altura del bote por tamaño
export const G = 900;                          // gravedad, px/s²
export const VEL_JUGADOR = 220, VEL_ARPON = 520; // px/s
const PUNTOS = [0, 100, 60, 40, 20];           // por burbuja, de pequeña a grande
const ESTADOS = ['ready', 'play', 'dead', 'clear', 'over', 'continuar']; // añadir al final: el índice viaja por la red

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

// Reglas arcade (spec 004, bloque A)
export const TIEMPO_BASE = 45, TIEMPO_POR_BURBUJA = 15, TIEMPO_MAX = 100; // s por nivel
export const AVISO_TIEMPO = 10;                 // s finales en los que avisa
const BONO_SEGUNDO = 20;                        // puntos por segundo que sobra
export const COMBO_SEG = 3, COMBO_MAX = 8;      // s máximos entre burbujas del combo, multiplicador máximo
const VIDAS_EXTRA = [20000, 50000];             // y después cada 50.000
const VIDAS_CADA = 50000, MAX_VIDAS = 9;
const PUNTOS_FRUTA = 500;

// Cuenta inicial de cada fase; más larga al empezar un mundo, para anunciarlo (spec 004, bloque C)
export const READY_SEG = 1.4, MUNDO_SEG = 2.8;

// Final de partida (spec 004, bloque D)
export const CONTINUAR_SEG = 10;                 // s para decidir si se sigue

// Escenario (spec 004, bloque B)
export const VEL_HEX = 95;                       // px/s en cada eje de las burbujas hexagonales
const PUNTOS_BLOQUE = 50;                        // por romper un bloque
export const MAX_BLOQUES = 12;

// Objetos (spec 002 y 004). Añadir al final: el índice viaja por la red.
export const TIPOS = ['doble', 'fijo', 'triple', 'velocidad', 'escudo', 'dinamita', 'reloj', 'fruta', 'vida'];
const PESOS = [25, 20, 20, 15, 12, 4, 4, 15, 1]; // probabilidad relativa de cada tipo
const SUMA_PESOS = PESOS.reduce((a, b) => a + b, 0);
export const PROB_OBJETO = 1 / 8;               // por burbuja reventada
export const MAX_OBJETOS = 2;
export const TAM_OBJETO = 16;                   // px de lado
export const OBJ_EN_SUELO = 10;                 // s que espera en el suelo antes de desaparecer
export const OBJ_PARPADEO = 2;                  // s finales en los que parpadea
const G_OBJETO = 600, SALTO_OBJETO = -160;      // caída y pequeño salto inicial, px/s² y px/s
const PUNTOS_OBJETO = 100;

// Eventos (spec 003): lo que ha pasado en el tick, para que la página lo convierta en sonido.
// Cada evento es [código, dato]: dato = jugador (disparo, clavado, escudo, muerte),
// tamaño (estallido) o tipo de objeto (objeto); 0 en el resto.
export const EVENTOS = ['listo', 'disparo', 'clavado', 'estallido', 'aparece', 'objeto', 'dinamita', 'reloj', 'escudo', 'muerte', 'limpio', 'fin', 'combo', 'vida', 'tiempo', 'aviso', 'rompe', 'mundo', 'continua'];
const MAX_EVENTOS = 64; // por si nadie los recoge (p. ej. en las pruebas)
function ev(st, nombre, dato = 0) {
  if (st.eventos.length >= MAX_EVENTOS) st.eventos.splice(0, 2);
  st.eventos.push(EVENTOS.indexOf(nombre), dato);
}

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
 *  @property {'ready'|'play'|'dead'|'clear'|'continuar'|'over'|'again'} state  'continuar': sin vidas, cuenta
 *    atrás para seguir; 'again': fin de partida y alguien pulsó disparo
 *  @property {{ p: number, f: number }} mejor  mejor tramo de la partida (puntos y fase): continuar pone los
 *    puntos a 0, así que el récord se guarda con lo mejor que se llegó a hacer
 *  @property {boolean} soltado  en 'continuar': nadie tiene pulsado disparo desde que empezó la cuenta
 *  @property {number} t       segundos que quedan de la fase actual
 *  @property {number} lvl, score, lives
 *  @property {number} hit     jugador tocado (-1 ninguno)
 *  @property {number} ronda   sube cada vez que se reinicia el nivel
 *  @property {number} congelado  s de reloj que quedan (0 = nada)
 *  @property {number} tiempo     s que quedan para limpiar el nivel
 *  @property {number} bono       puntos del bonus de tiempo del último nivel limpio (para mostrarlo)
 *  @property {{ s: number, n: number, t: number }} combo  tamaño, cuántas seguidas y s desde la última
 *  @property {number} proximaVida  puntos a los que se gana la siguiente vida
 *  @property {Texto[]} textos    textos flotantes: { x, y, k, v, t }; k: 0 «xN», 1 «+N», 2 «1UP»
 *  @property {Bloque[]} bloques  { x, y, w, h, duro }: las burbujas rebotan y los arpones se paran
 *  Burbuja: además `hex` (sin gravedad, en diagonal) y `obj` (siempre suelta un objeto)
 *  @property {Burbuja[]} balls
 *  @property {Jugador[]} ps
 *  @property {Estallido[]} pop
 *  @property {Objeto[]} objetos
 *  @property {number} semilla  estado del generador aleatorio (nunca Math.random() aquí)
 *  @property {number[]|null} prueba  modo de prueba: tipos que caen siempre, por turnos
 *  @property {number[]} eventos  pares [código, dato] pendientes de sonar (los vacía la página)
 *
 *  @typedef {{ left: boolean, right: boolean, a: boolean, x?: number }} Entrada
 *  `x` (opcional): posición a la que acercar al jugador, en vez de moverlo con left/right.
 *  La usa el anfitrión para el invitado online.
 */

/** Número aleatorio entre 0 y 1 a partir de la semilla del estado (mulberry32): mismo
 *  resultado con la misma semilla, así las pruebas son repetibles. */
function azar(st) { return azarDe(st); }
function azarDe(st) {
  let t = (st.semilla = (st.semilla + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function tipoAlAzar(st) {
  let r = azar(st) * SUMA_PESOS;
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
function quizaSoltar(st, x, y, seguro = false) {
  if (seguro) { soltarObjeto(st, x, y, st.prueba ? st.prueba[st.pruebaI++ % st.prueba.length] : undefined); ev(st, 'aparece'); return; }
  if (st.objetos.length >= MAX_OBJETOS) return;
  if (st.prueba && st.prueba.length) { soltarObjeto(st, x, y, st.prueba[st.pruebaI++ % st.prueba.length]); ev(st, 'aparece'); return; }
  if (azar(st) < PROB_OBJETO) { soltarObjeto(st, x, y); ev(st, 'aparece'); }
}

/** Caída de los objetos y tiempo en el suelo. También lo usa la predicción del invitado. */
export function moverObjetos(list, dt, bloques = []) {
  const m = TAM_OBJETO / 2, suelo = FLOOR - m;
  for (const o of list) {
    if (o.enSuelo >= 0) { o.enSuelo += dt; continue; }
    const antes = o.y;
    o.vy += G_OBJETO * dt; o.y += o.vy * dt;
    if (o.y >= suelo) { o.y = suelo; o.vy = 0; o.enSuelo = 0; continue; }
    // se posa encima de un bloque al caer sobre él
    if (o.vy > 0) for (const k of bloques) {
      if (o.x >= k.x && o.x <= k.x + k.w && antes + m <= k.y && o.y + m > k.y) { o.y = k.y - m; o.vy = 0; o.enSuelo = 0; break; }
    }
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
 *  También lo usa el invitado. @returns {boolean} si algún arpón se acaba de clavar */
export function moverArpones(p, dt) {
  let clavo = false;
  if (p.espera > 0) p.espera -= dt;
  if (p.invulnerable > 0) p.invulnerable -= dt;
  if (p.rapido > 0) p.rapido -= dt;
  const vel = p.rapido > 0 ? VEL_ARPON_RAPIDO : VEL_ARPON;
  for (let k = p.arpones.length - 1; k >= 0; k--) {
    const a = p.arpones[k];
    if (a.clavado > 0) { a.clavado -= dt; if (a.clavado <= 0) p.arpones.splice(k, 1); continue; }
    a.top -= vel * dt;
    if (a.top <= 0) {
      if (a.fijo) { a.top = 0; a.clavado = FIJO_SEG; clavo = true; } else p.arpones.splice(k, 1);
    }
  }
  return clavo;
}

/**
 * Arpones contra bloques: el arpón se para en la cara de abajo del bloque. El rompible se
 * rompe (si hay `romper`; el invitado no rompe, solo quita su arpón) y el fijo se clava
 * debajo del duro. También lo usa el invitado. @returns {boolean} si algún arpón se clavó
 */
export function arponesYBloques(p, bloques, romper) {
  let clavo = false;
  const base = FLOOR - p.h;
  for (let k = p.arpones.length - 1; k >= 0; k--) {
    const a = p.arpones[k];
    if (a.clavado > 0) continue;
    for (let i = 0; i < bloques.length; i++) {
      const b = bloques[i], abajo = b.y + b.h;
      if (a.x < b.x || a.x > b.x + b.w || a.top > abajo || base <= abajo) continue;
      if (!b.duro) { if (romper) romper(i); p.arpones.splice(k, 1); }
      else if (a.fijo) { a.top = abajo; a.clavado = FIJO_SEG; clavo = true; }
      else p.arpones.splice(k, 1);
      break;
    }
  }
  return clavo;
}

/* ---------- burbujas ---------- */

function bounceV(s) { return -Math.sqrt(2 * G * BOUNCE[s]); }
function newBall(s, x, y, dir, hex = false) {
  return hex ? { s, x, y, vx: dir * VEL_HEX, vy: -VEL_HEX, hex: true } : { s, x, y, vx: dir * 70, vy: bounceV(s) * 0.6 };
}

// Fase del nivel actual (spec 004, bloque C): las 20 primeras salen de fases.js; desde la 21
// se generan con la semilla de la partida, cada vez con más burbujas, hexagonales y bloques duros.
// Con 2 jugadores hay una burbuja más: un tamaño menos que la primera, donde haya más hueco.
function level(st) {
  const f = FASES[st.lvl - 1], b = [];
  if (f) {
    for (const o of f.burbujas) { const c = newBall(o.s, o.x, o.y, o.dir, !!o.hex); if (o.obj) c.obj = true; b.push(c); }
    st.bloques = f.bloques.map((k) => ({ x: k.x, y: k.y, w: k.w, h: k.h, duro: !!k.duro }));
    st.tiempoFase = f.tiempo;
  } else {
    generarFase(st, b);
    st.tiempoFase = tiempoNivel(b.length);
  }
  if (st.n > 1 && b.length) {
    // donde más lejos quede de las demás burbujas (en horizontal)
    const p = b[0];
    let x = W / 2, lejos = -1;
    for (let cx = 40; cx <= W - 40; cx += 20) {
      let d = Infinity;
      for (const o of b) d = Math.min(d, Math.abs(o.x - cx));
      if (d > lejos) { lejos = d; x = cx; }
    }
    b.push(newBall(Math.max(1, p.s - 1), x, p.y, x < W / 2 ? 1 : -1, !!p.hex));
  }
  return b;
}

// Cada fase generada sale de la semilla de la partida y su número: al morir se repite igual.
function generarFase(st, b) {
  const d = st.lvl - FASES.length; // 1 en la fase 21
  const g = { semilla: (st.base ^ Math.imul(st.lvl, 0x9e3779b1)) | 0 };
  const cnt = Math.min(2 + Math.floor(d / 3), 5), hex = Math.min(0.2 + 0.03 * d, 0.6);
  for (let i = 0; i < cnt; i++) {
    const s = azar(g) < 0.75 ? 4 : 3;
    b.push(newBall(s, (W / (cnt + 1)) * (i + 1), 120 + Math.floor(azar(g) * 3) * 10, i % 2 ? -1 : 1, azar(g) < hex));
  }
  if (azar(g) < 0.5) b[Math.floor(azar(g) * b.length)].obj = true;
  st.bloques = [];
  const total = Math.min(2 + Math.floor(d / 4), 6), duro = Math.min(0.3 + 0.02 * d, 0.7);
  for (let t = 0; t < 40 && st.bloques.length < total; t++) {
    const w = 50 + Math.floor(azar(g) * 5) * 10, h = 14;
    const k = { x: 20 + Math.floor(azar(g) * (W - 40 - w)), y: 200 + Math.floor(azar(g) * 9) * 20, w, h, duro: azar(g) < duro };
    if (st.bloques.every((o) => k.x + k.w + 16 < o.x || o.x + o.w + 16 < k.x || k.y + k.h + 30 < o.y || o.y + o.h + 30 < k.y)) st.bloques.push(k);
  }
}

/** ¿Toca la burbuja el segmento vertical del arpón (de `top` al suelo en `sx`)? */
function hitSeg(b, sx, top) {
  const cy = Math.max(top, Math.min(FLOOR, b.y)), dx = b.x - sx, dy = b.y - cy;
  return dx * dx + dy * dy < R[b.s] * R[b.s];
}

/** Mueve burbujas con gravedad y rebotes. También lo usa la predicción del invitado. */
export function moverBurbujas(list, dt, bloques = []) {
  for (const b of list) moverBurbuja(b, dt, bloques);
}
function moverBurbuja(b, dt, bloques) {
  if (!b.hex) b.vy += G * dt; // las hexagonales van a velocidad constante
  b.x += b.vx * dt; b.y += b.vy * dt;
  const r = R[b.s];
  if (b.y + r > FLOOR) { b.y = FLOOR - r; b.vy = b.hex ? -Math.abs(b.vy) : bounceV(b.s); }
  if (b.y - r < 0) { b.y = r; b.vy = Math.abs(b.vy); }
  if (b.x - r < 0) { b.x = r; b.vx = Math.abs(b.vx); }
  if (b.x + r > W) { b.x = W - r; b.vx = -Math.abs(b.vx); }
  for (const k of bloques) chocarBloque(b, k);
}

// Círculo contra rectángulo: si se tocan, saca la burbuja por el lado más cercano y la rebota
function chocarBloque(b, k) {
  const r = R[b.s];
  const cx = Math.max(k.x, Math.min(k.x + k.w, b.x)), cy = Math.max(k.y, Math.min(k.y + k.h, b.y));
  let dx = b.x - cx, dy = b.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return;
  if (d2 === 0) {
    // el centro está dentro del bloque: sale por el lado con menos solape
    const l = b.x - k.x, rr = k.x + k.w - b.x, t = b.y - k.y, bo = k.y + k.h - b.y, m = Math.min(l, rr, t, bo);
    if (m === t) { b.y = k.y - r; b.vy = -Math.abs(b.vy); } else if (m === bo) { b.y = k.y + k.h + r; b.vy = Math.abs(b.vy); }
    else if (m === l) { b.x = k.x - r; b.vx = -Math.abs(b.vx); } else { b.x = k.x + k.w + r; b.vx = Math.abs(b.vx); }
    return;
  }
  const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
  b.x = cx + nx * r; b.y = cy + ny * r;
  if (Math.abs(ny) >= Math.abs(nx)) b.vy = ny < 0 ? -Math.abs(b.vy) : Math.abs(b.vy);
  else b.vx = nx < 0 ? -Math.abs(b.vx) : Math.abs(b.vx);
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
      const c = newBall(1, Math.max(R[1], Math.min(W - R[1], b.x + off)), b.y, d, b.hex);
      if (!c.hex) c.vy = -200;
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

// Texto flotante que sube y se desvanece (combo, vida extra, fruta)
function texto(st, x, y, k, v) {
  if (st.textos.length >= 8) st.textos.shift();
  st.textos.push({ x: Math.max(20, Math.min(W - 20, x)), y, k, v, t: 1 });
}
/** Sube y desvanece los textos. También lo usa el invitado. */
export function moverTextos(list, dt) {
  for (let i = list.length - 1; i >= 0; i--) { const q = list[i]; q.y -= 30 * dt; q.t -= dt; if (q.t <= 0) list.splice(i, 1); }
}

function sumarPuntos(st, n, x, y) {
  st.score += n;
  while (st.score >= st.proximaVida) {
    if (st.lives < MAX_VIDAS) { st.lives++; ev(st, 'vida'); texto(st, x, y - 20, 2, 0); }
    const i = VIDAS_EXTRA.indexOf(st.proximaVida);
    st.proximaVida = i >= 0 && i + 1 < VIDAS_EXTRA.length ? VIDAS_EXTRA[i + 1] : st.proximaVida + VIDAS_CADA;
  }
}

/* ---------- final de partida (spec 004, bloque D) ---------- */

function guardarMejor(st) { if (st.score > st.mejor.p) st.mejor = { p: st.score, f: st.lvl }; }

function empezarContinuar(st) {
  guardarMejor(st);
  st.state = 'continuar'; st.t = CONTINUAR_SEG; st.soltado = false;
}

// Cuenta atrás: un disparo (pulsado de nuevo, no el que se traía) sigue en la misma fase con los
// puntos a 0 y las vidas del principio. A 0, fin de partida.
function pasoContinuar(st, entradas, dt) {
  const alguno = st.ps.some((p, i) => entradas[i] && entradas[i].a);
  if (!alguno) st.soltado = true;
  else if (st.soltado) {
    st.score = 0; st.lives = vidasIniciales(st.n); st.proximaVida = VIDAS_EXTRA[0];
    reset(st); ev(st, 'continua');
    return;
  }
  const antes = Math.ceil(st.t);
  st.t -= dt;
  if (st.t <= 0) { st.state = 'over'; st.t = 1; ev(st, 'fin'); return; }
  if (Math.ceil(st.t) < antes) ev(st, 'aviso');
}

function vidasIniciales(n) { return n === 2 ? 5 : 3; }

function tiempoNivel(n) { return Math.min(TIEMPO_MAX, TIEMPO_BASE + TIEMPO_POR_BURBUJA * n); }

function reset(st, nuevaFase = false) {
  st.balls = level(st);
  st.tiempo = st.tiempoFase; st.combo = { s: 0, n: 0, t: 0 }; st.textos = [];
  const antes = st.ps || [];
  st.ps = [];
  for (let i = 0; i < st.n; i++) st.ps.push(nuevoJugador(st, i, antes[i]));
  st.state = 'ready'; st.t = READY_SEG; st.pop = []; st.objetos = []; st.hit = -1; st.congelado = 0; st.ronda++;
  // al empezar un mundo nuevo, la cuenta inicial es más larga y la pantalla lo anuncia (render.js)
  if (nuevaFase && empiezaMundo(st.lvl)) { st.t = MUNDO_SEG; ev(st, 'mundo'); }
}

/**
 * Partida nueva para 1 o 2 jugadores.
 * @param {number} [semilla] para pruebas repetibles
 * @param {{ prueba?: string[], nivel?: number }} [opciones]  prueba: tipos de objeto que caerán siempre,
 *   por turnos; nivel: en qué nivel empezar (para probar)
 * @returns {Estado}
 */
export function crear(n, semilla = (Date.now() ^ (performance.now() * 1000)) | 0, opciones = {}) {
  const prueba = (opciones.prueba || []).map((t) => TIPOS.indexOf(t)).filter((t) => t >= 0);
  const st = { n, base: semilla, score: 0, lives: vidasIniciales(n), mejor: { p: 0, f: 1 }, soltado: false, lvl: Math.max(1, opciones.nivel | 0 || 1), ronda: 0, semilla, prueba: prueba.length ? prueba : null, pruebaI: 0, eventos: [], bono: 0, proximaVida: VIDAS_EXTRA[0] };
  reset(st, true);
  return st;
}

/**
 * Avanza el estado `dt` segundos.
 * @param {Estado} st
 * @param {Entrada[]} entradas  una por jugador
 */
export function paso(st, entradas, dt) {
  guardarAnterior(st);
  if (st.state === 'ready') { st.t -= dt; if (st.t <= 0) { st.state = 'play'; ev(st, 'listo'); } return; }
  if (st.state === 'dead') { st.t -= dt; if (st.t <= 0) { if (st.lives <= 0) empezarContinuar(st); else reset(st); } return; }
  if (st.state === 'continuar') { pasoContinuar(st, entradas, dt); return; }
  if (st.state === 'clear') { st.t -= dt; if (st.t <= 0) { st.lvl++; reset(st, true); } return; }
  if (st.state === 'over') { st.t -= dt; if (st.t <= 0 && st.ps.some((p, i) => entradas[i].a)) st.state = 'again'; return; }
  if (st.state !== 'play') return;

  st.ps.forEach((p, i) => {
    const k = entradas[i];
    p.dir = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    if (typeof k.x === 'number') p.x += (k.x - p.x) * Math.min(1, dt * 20);
    else { if (k.left) p.x -= VEL_JUGADOR * dt; if (k.right) p.x += VEL_JUGADOR * dt; }
    p.x = Math.max(p.w / 2, Math.min(W - p.w / 2, p.x));
    if (k.a && disparar(p)) ev(st, 'disparo', i);
    if (moverArpones(p, dt)) ev(st, 'clavado', i);
    if (arponesYBloques(p, st.bloques, (j) => romperBloque(st, j))) ev(st, 'clavado', i);
  });

  // Tiempo del nivel: avisa los últimos segundos y, a 0, se pierde una vida
  const antes = Math.ceil(st.tiempo);
  st.tiempo = Math.max(0, st.tiempo - dt);
  const ahora = Math.ceil(st.tiempo);
  if (ahora < antes && ahora <= AVISO_TIEMPO && st.tiempo > 0) ev(st, 'aviso');
  if (st.tiempo <= 0) {
    st.lives--; st.state = 'dead'; st.t = 1.6; st.hit = -1; ev(st, 'tiempo');
    st.ps.forEach((q) => { q.arpones.length = 0; });
    return;
  }
  if (st.combo.n) { st.combo.t += dt; if (st.combo.t > COMBO_SEG) st.combo.n = 0; }

  // Reloj: las burbujas no se mueven, pero siguen haciendo daño y se pueden romper
  const quietas = st.congelado > 0;
  if (quietas) st.congelado = Math.max(0, st.congelado - dt);

  const nb = [];
  outer: for (const b of st.balls) {
    if (!quietas) moverBurbuja(b, dt, st.bloques);
    const r = R[b.s];
    for (const p of st.ps) {
      const k = p.arpones.findIndex((a) => hitSeg(b, a.x, a.top));
      if (k >= 0) {
        p.arpones.splice(k, 1);
        // combo: seguidas del mismo tamaño multiplican los puntos
        const c = st.combo;
        if (c.n && c.s === b.s) c.n = Math.min(COMBO_MAX, c.n + 1); else { c.s = b.s; c.n = 1; }
        c.t = 0;
        if (c.n > 1) { texto(st, b.x, b.y, 0, c.n); ev(st, 'combo', c.n); }
        sumarPuntos(st, PUNTOS[b.s] * c.n, b.x, b.y);
        st.pop.push({ x: b.x, y: b.y, s: b.s, t: 0.3 });
        ev(st, 'estallido', b.s);
        quizaSoltar(st, b.x, b.y, !!b.obj);
        if (b.s > 1) for (const d of [-1, 1]) {
          const n = newBall(b.s - 1, b.x + d * (quietas ? R[b.s - 1] : 4), b.y, d, b.hex); // congeladas: separadas para verse
          if (!n.hex) n.vy = -Math.min(420, Math.sqrt(2 * G * BOUNCE[b.s - 1]) * 0.8);
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
        if (p.escudo) { p.escudo = false; p.invulnerable = INVULNERABLE_SEG; ev(st, 'escudo', i); continue; } // el escudo aguanta el golpe
        st.lives--; st.state = 'dead'; st.t = 1.3; st.hit = i; ev(st, 'muerte', i);
        p.arma = 0; p.escudo = false; p.rapido = 0; // el tocado lo pierde todo (P2)
        st.ps.forEach((q) => { q.arpones.length = 0; });
        return;
      }
    }
    nb.push(b);
  }
  st.balls = nb;
  st.pop = st.pop.filter((q) => (q.t -= dt) > 0);
  moverTextos(st.textos, dt);
  pasoObjetos(st, dt);
  if (!st.balls.length) {
    st.bono = Math.floor(st.tiempo) * BONO_SEGUNDO;
    st.state = 'clear'; st.t = 2.2; ev(st, 'limpio');
    sumarPuntos(st, 500 + st.bono, W / 2, 300);
  }
}

/** Objetos: caen, se recogen al tocarlos y desaparecen tras 10 s en el suelo. */
function romperBloque(st, i) {
  const k = st.bloques[i];
  st.bloques.splice(i, 1);
  sumarPuntos(st, PUNTOS_BLOQUE, k.x + k.w / 2, k.y);
  ev(st, 'rompe');
}

function pasoObjetos(st, dt) {
  moverObjetos(st.objetos, dt, st.bloques);
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
  if (tipo === 'fruta') { sumarPuntos(st, PUNTOS_FRUTA, o.x, o.y); texto(st, o.x, o.y - 10, 1, PUNTOS_FRUTA); ev(st, 'objeto', o.tipo); return; }
  if (tipo === 'vida') {
    if (st.lives < MAX_VIDAS) st.lives++;
    texto(st, o.x, o.y - 10, 2, 0); ev(st, 'vida'); sumarPuntos(st, PUNTOS_OBJETO, o.x, o.y);
    return;
  }
  sumarPuntos(st, PUNTOS_OBJETO, o.x, o.y);
  st.pop.push({ x: o.x, y: o.y, s: 1, t: 0.3 });
  ev(st, 'objeto', o.tipo);
  const arma = ARMAS.indexOf(tipo);
  if (arma > 0) { p.arma = arma; p.arpones.length = 0; p.espera = 0; return; }
  if (tipo === 'velocidad') p.rapido = RAPIDO_SEG;
  else if (tipo === 'escudo') p.escudo = true;
  else if (tipo === 'dinamita') { dinamita(st); ev(st, 'dinamita'); }
  else if (tipo === 'reloj') { st.congelado = RELOJ_SEG; ev(st, 'reloj'); }
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
  // tamaño + 8 si es hexagonal + 16 si suelta objeto
  for (const o of st.balls) b.push(o.s + (o.hex ? 8 : 0) + (o.obj ? 16 : 0), Math.round(o.x), Math.round(o.y), Math.round(o.vx), Math.round(o.vy));
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
  const x = [];
  for (const j of st.textos) x.push(Math.round(j.x), Math.round(j.y), j.k, j.v, Math.round(j.t * 10));
  return {
    m: ESTADOS.indexOf(st.state), t: Math.round(st.t * 10), v: st.lvl, sc: st.score, li: st.lives, h: st.hit, c: Math.round(st.congelado * 10),
    ti: Math.round(st.tiempo * 10), bo: st.bono, b, p, q, o, x, k: bloquesPlanos(st.bloques), mp: st.mejor.p, mf: st.mejor.f,
  };
}

function bloquesPlanos(list) {
  const k = [];
  for (const j of list) k.push(Math.round(j.x), Math.round(j.y), Math.round(j.w), Math.round(j.h), j.duro ? 1 : 0);
  return k;
}

/** Lo contrario de `codificar`, validando todo (los mensajes llegan de la red). @returns {Estado|null} */
export function decodificar(d) {
  if (!d || !Array.isArray(d.b) || !Array.isArray(d.p)) return null;
  const s = {
    n: 2, state: ESTADOS[d.m] || 'play', t: (+d.t || 0) / 10, lvl: +d.v || 1, score: +d.sc || 0, lives: +d.li || 0, hit: +d.h,
    congelado: Math.max(0, Math.min(RELOJ_SEG, (+d.c || 0) / 10)), ronda: 0, balls: [], ps: [], pop: [], objetos: [],
    tiempo: Math.max(0, Math.min(TIEMPO_MAX, (+d.ti || 0) / 10)), bono: Math.max(0, +d.bo || 0), textos: [], bloques: [],
    mejor: { p: Math.max(0, Math.min(1e9, d.mp | 0)), f: Math.max(1, Math.min(999, d.mf | 0)) },
  };
  if (Array.isArray(d.k)) for (let i = 0; i + 4 < d.k.length && s.bloques.length < MAX_BLOQUES; i += 5) {
    const w = +d.k[i + 2], h = +d.k[i + 3];
    if (w > 0 && h > 0 && w <= W && h <= H) s.bloques.push({ x: +d.k[i] || 0, y: +d.k[i + 1] || 0, w, h, duro: d.k[i + 4] === 1 });
  }
  if (Array.isArray(d.x)) for (let i = 0; i + 4 < d.x.length && s.textos.length < 8; i += 5) {
    const k = d.x[i + 2] | 0;
    if (k >= 0 && k <= 2) s.textos.push({ x: +d.x[i] || 0, y: +d.x[i + 1] || 0, k, v: Math.max(0, Math.min(99999, d.x[i + 3] | 0)), t: Math.max(0, Math.min(1, (+d.x[i + 4] || 0) / 10)) });
  }
  for (let i = 0; i + 4 < d.b.length && s.balls.length < 80; i += 5) {
    const v = d.b[i] | 0, sz = v & 7;
    if (sz >= 1 && sz <= 4) {
      const c = { s: sz, x: +d.b[i + 1], y: +d.b[i + 2], vx: +d.b[i + 3] || 0, vy: +d.b[i + 4] || 0 };
      if (v & 8) c.hex = true;
      if (v & 16) c.obj = true;
      s.balls.push(c);
    }
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

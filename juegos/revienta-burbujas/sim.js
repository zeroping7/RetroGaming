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

/** @typedef {{ s: number, x: number, y: number, vx: number, vy: number }} Burbuja  s: tamaño 1-4
 *  @typedef {{ x: number, w: number, h: number, dir: number, shot: { x: number, top: number } | null }} Jugador
 *  @typedef {{ x: number, y: number, s: number, t: number }} Estallido  anillo visual
 *  @typedef {Object} Estado
 *  @property {1|2} n          jugadores
 *  @property {'ready'|'play'|'dead'|'clear'|'over'|'again'} state  'again': fin de partida y alguien pulsó disparo
 *  @property {number} t       segundos que quedan de la fase actual
 *  @property {number} lvl, score, lives
 *  @property {number} hit     jugador tocado (-1 ninguno)
 *  @property {number} ronda   sube cada vez que se reinicia el nivel
 *  @property {Burbuja[]} balls
 *  @property {Jugador[]} ps
 *  @property {Estallido[]} pop
 *
 *  @typedef {{ left: boolean, right: boolean, a: boolean, x?: number }} Entrada
 *  `x` (opcional): posición a la que acercar al jugador, en vez de moverlo con left/right.
 *  La usa el anfitrión para el invitado online.
 */

function bounceV(s) { return -Math.sqrt(2 * G * BOUNCE[s]); }
function newBall(s, x, y, dir) { return { s, x, y, vx: dir * 70, vy: bounceV(s) * 0.6 }; }

function level(st) {
  const n = st.lvl, b = [];
  const cnt = Math.min(1 + Math.floor((n - 1) / 2), 4) + (st.n - 1), size = Math.min(2 + n, 4);
  for (let i = 0; i < cnt; i++) b.push(newBall(size, (W / (cnt + 1)) * (i + 1), 140, i % 2 ? -1 : 1));
  return b;
}

function reset(st) {
  st.balls = level(st);
  st.ps = [];
  for (let i = 0; i < st.n; i++) st.ps.push({ x: st.n === 1 ? W / 2 : W * (i ? 0.7 : 0.3), w: 26, h: 34, dir: 0, shot: null });
  st.state = 'ready'; st.t = 1.4; st.pop = []; st.hit = -1; st.ronda++;
}

/** Partida nueva para 1 o 2 jugadores. @returns {Estado} */
export function crear(n) {
  const st = { n, score: 0, lives: n === 2 ? 5 : 3, lvl: 1, ronda: 0 };
  reset(st);
  return st;
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

/**
 * Avanza el estado `dt` segundos.
 * @param {Estado} st
 * @param {Entrada[]} entradas  una por jugador
 */
export function paso(st, entradas, dt) {
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
    if (k.a && !p.shot) p.shot = { x: p.x, top: FLOOR - p.h };
    if (p.shot) { p.shot.top -= VEL_ARPON * dt; if (p.shot.top <= 0) p.shot = null; }
  });

  const nb = [];
  outer: for (const b of st.balls) {
    moverBurbuja(b, dt);
    const r = R[b.s];
    for (const p of st.ps) {
      if (p.shot && hitSeg(b, p.shot.x, p.shot.top)) {
        p.shot = null; st.score += PUNTOS[b.s];
        st.pop.push({ x: b.x, y: b.y, s: b.s, t: 0.3 });
        if (b.s > 1) for (const d of [-1, 1]) {
          const n = newBall(b.s - 1, b.x + d * 4, b.y, d);
          n.vy = -Math.min(420, Math.sqrt(2 * G * BOUNCE[b.s - 1]) * 0.8);
          nb.push(n);
        }
        continue outer;
      }
    }
    for (let i = 0; i < st.ps.length; i++) {
      const p = st.ps[i];
      const px = Math.max(p.x - p.w / 2 + 4, Math.min(p.x + p.w / 2 - 4, b.x)), py = Math.max(FLOOR - p.h + 6, Math.min(FLOOR, b.y));
      if ((b.x - px) ** 2 + (b.y - py) ** 2 < r * r) {
        st.lives--; st.state = 'dead'; st.t = 1.3; st.hit = i;
        st.ps.forEach((q) => { q.shot = null; });
        return;
      }
    }
    nb.push(b);
  }
  st.balls = nb;
  st.pop = st.pop.filter((q) => (q.t -= dt) > 0);
  if (!st.balls.length) { st.state = 'clear'; st.t = 1.6; st.score += 500; }
}

/** Instantánea compacta para enviar al invitado: números redondeados y arrays planos. */
export function codificar(st) {
  const b = [];
  for (const o of st.balls) b.push(o.s, Math.round(o.x), Math.round(o.y), Math.round(o.vx), Math.round(o.vy));
  const p = [];
  for (const o of st.ps) p.push(Math.round(o.x), o.shot ? Math.round(o.shot.x) : -1, o.shot ? Math.round(o.shot.top) : -1, o.dir);
  const q = [];
  for (const o of st.pop) q.push(Math.round(o.x), Math.round(o.y), o.s, Math.round(o.t * 100));
  return { m: ESTADOS.indexOf(st.state), t: Math.round(st.t * 10), v: st.lvl, sc: st.score, li: st.lives, h: st.hit, b, p, q };
}

/** Lo contrario de `codificar`, validando todo (los mensajes llegan de la red). @returns {Estado|null} */
export function decodificar(d) {
  if (!d || !Array.isArray(d.b) || !Array.isArray(d.p)) return null;
  const s = { n: 2, state: ESTADOS[d.m] || 'play', t: (+d.t || 0) / 10, lvl: +d.v || 1, score: +d.sc || 0, lives: +d.li || 0, hit: +d.h, ronda: 0, balls: [], ps: [], pop: [] };
  for (let i = 0; i + 4 < d.b.length && s.balls.length < 80; i += 5) {
    const sz = d.b[i] | 0;
    if (sz >= 1 && sz <= 4) s.balls.push({ s: sz, x: +d.b[i + 1], y: +d.b[i + 2], vx: +d.b[i + 3] || 0, vy: +d.b[i + 4] || 0 });
  }
  for (let i = 0; i + 3 < d.p.length && s.ps.length < 2; i += 4) {
    s.ps.push({ x: +d.p[i], w: 26, h: 34, dir: Math.max(-1, Math.min(1, d.p[i + 3] | 0)), shot: d.p[i + 1] >= 0 ? { x: +d.p[i + 1], top: +d.p[i + 2] } : null });
  }
  if (Array.isArray(d.q)) for (let i = 0; i + 3 < d.q.length && s.pop.length < 40; i += 4) {
    const sz = d.q[i + 2] | 0;
    if (sz >= 1 && sz <= 4) s.pop.push({ x: +d.q[i], y: +d.q[i + 1], s: sz, t: d.q[i + 3] / 100 });
  }
  return s;
}

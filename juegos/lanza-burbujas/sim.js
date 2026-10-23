// Reglas de Lanza Burbujas (spec 005). JavaScript puro: no toca Phaser, el canvas ni el DOM
// (constitución A1). La página llama a paso() 60 veces por segundo (A2) con las acciones de
// cada tablero y dibuja el estado que queda.
import { filasDe, mundoDe, MUNDOS, TOTAL_NIVELES, NUM_COLORES } from './niveles.js';

/* ---------- medidas (plan §4) ---------- */
export const D = 20, R = 10, FILA = D * Math.sqrt(3) / 2;
export const COLS = 8, FILAS = 14, LINEA = 12;     // con una burbuja en la fila 12 (contando bajadas) se pierde
export const ANCHO = 160, ALTO = 262;
export const CANON_X = 80, CANON_Y = 240;
export const VEL = 560, SUBPASOS = 3, CHOQUE = 16;
const GRADO = Math.PI / 180;
export const ANG_MAX = 80 * GRADO, PASO_GIRO = 1.2 * GRADO;
const GIRO_LENTO = 70 * GRADO, GIRO_RAPIDO = 140 * GRADO, GIRO_ESPERA = 0.15, GIRO_ACELERA = 0.6;
export const PRISA = 10, AVISO_PRISA = 5;
export const AVISO_TECHO = 2, TECHO_VS = 20, AVISO_TECHO_VS = 3;
export const PUNTOS_BURBUJA = 10, MAX_CAIDA = 1310720, BONUS_FINAL = 100000;
export const BASURA_MAX = 18, FILAS_VS = 5;
export const T_LISTO = 1.6, T_MUNDO = 2.8, T_LIMPIO = 2.6, T_PERDIDO = 1.8, T_CONTINUAR = 10, T_RONDA = 3, T_PARTIDA = 2.6, T_RIVAL = 2.6;
export const RONDAS_GANAR = 2, RIVALES = 8;

export const FASES = ['listo', 'juego', 'limpio', 'perdido', 'continuar', 'over', 'final', 'ronda', 'partida', 'rival', 'campeon'];
export const EVENTOS = ['listo', 'disparo', 'rebote', 'pega', 'explota', 'cae', 'cascada', 'tiembla', 'baja', 'prisa',
  'limpio', 'pierde', 'ronda', 'partida', 'basura', 'envia', 'continua', 'mundo', 'campeon', 'final', 'rival'];
const EV = Object.fromEntries(EVENTOS.map((n, i) => [n, i]));
const MODOS = ['niveles', 'cpu', 'online'];

/* ---------- rejilla hexagonal ----------
   Filas pares: 8 huecos; impares: 7, desplazadas media burbuja a la derecha.
   La fila 0 siempre está pegada al techo; al bajar el techo baja todo (bajadas). */
export const ancho = (r) => (r & 1 ? 7 : 8);
export const valida = (r, c) => r >= 0 && r < FILAS && c >= 0 && c < ancho(r);
export const celda = (r, c) => r * COLS + c;

const VEC = new Int16Array(6);
/** Vecinos de (r, c) en VEC; devuelve cuántos hay. */
export function vecinos(r, c) {
  let n = 0;
  const imp = r & 1, a = imp ? c : c - 1, b = imp ? c + 1 : c; // columnas de las filas de arriba y abajo
  if (valida(r, c - 1)) VEC[n++] = celda(r, c - 1);
  if (valida(r, c + 1)) VEC[n++] = celda(r, c + 1);
  if (valida(r - 1, a)) VEC[n++] = celda(r - 1, a);
  if (valida(r - 1, b)) VEC[n++] = celda(r - 1, b);
  if (valida(r + 1, a)) VEC[n++] = celda(r + 1, a);
  if (valida(r + 1, b)) VEC[n++] = celda(r + 1, b);
  return n;
}
export const vecinosDe = () => VEC;

export const centroX = (r, c) => R + c * D + (r & 1 ? R : 0);
export const centroY = (t, r) => R + (r + t.bajadas) * FILA;

/* ---------- azar con semilla (mulberry32): nunca Math.random() en la simulación ---------- */
export function azar(o) {
  let t = (o.rng = (o.rng + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/* ---------- tableros ---------- */
export function crearTablero() {
  return {
    celdas: new Int8Array(FILAS * COLS), bajadas: 0, ang: 0, actual: 1, siguiente: 1,
    vuelo: { activo: false, quieto: false, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, c: 0, reb: 0 },
    disparos: 0, fc: 0, desdeBajada: 0, prisa: 0, basura: 0, rng: 1, giroT: 0, giroD: 0, prevA: false, perdido: false,
  };
}

/** Bits de los colores que hay en el tablero (bit c = color c). */
export function presentes(t) {
  let m = 0;
  const cs = t.celdas;
  for (let i = 0; i < cs.length; i++) if (cs[i]) m |= 1 << cs[i];
  return m;
}

export function vacio(t) {
  const cs = t.celdas;
  for (let i = 0; i < cs.length; i++) if (cs[i]) return false;
  return true;
}

/** Color al azar entre los que hay en el tablero (o entre los n primeros si está vacío). */
function colorAleatorio(t, mascara, n) {
  if (!mascara) return 1 + Math.floor(azar(t) * n);
  let k = 0;
  for (let c = 1; c <= NUM_COLORES; c++) if (mascara & (1 << c)) k++;
  let i = Math.floor(azar(t) * k);
  for (let c = 1; c <= NUM_COLORES; c++) if (mascara & (1 << c) && i-- === 0) return c;
  return 1;
}

function cargarFilas(t, filas) {
  t.celdas.fill(0);
  for (let r = 0; r < filas.length && r < FILAS; r++) {
    for (let c = 0; c < ancho(r) && c < filas[r].length; c++) t.celdas[celda(r, c)] = filas[r][c];
  }
}

function prepararTablero(t, semilla, ncolores) {
  t.bajadas = 0; t.ang = 0; t.desdeBajada = 0; t.prisa = 0; t.basura = 0; t.giroT = 0; t.giroD = 0;
  t.perdido = false; t.vuelo.activo = false; t.vuelo.quieto = false; t.rng = semilla | 0;
  const m = presentes(t);
  t.actual = colorAleatorio(t, m, ncolores);
  t.siguiente = colorAleatorio(t, m, ncolores);
}

/** Si el color cargado ya no está en el tablero, se cambia por uno que sí (§6.1). */
function revisarColores(t, ncolores) {
  const m = presentes(t);
  if (!m) return;
  if (!(m & (1 << t.actual))) t.actual = colorAleatorio(t, m, ncolores);
  if (!(m & (1 << t.siguiente))) t.siguiente = colorAleatorio(t, m, ncolores);
}

/* ---------- cañón ---------- */
const recorta = (a) => (a < -ANG_MAX ? -ANG_MAX : a > ANG_MAX ? ANG_MAX : a);

/** Gira el cañón: un toque = un paso fino; mantener = giro continuo que acelera. */
export function girar(t, e, dt) {
  const dir = (e.right ? 1 : 0) - (e.left ? 1 : 0);
  if (!dir) { t.giroT = 0; t.giroD = 0; return; }
  if (dir !== t.giroD) { t.giroD = dir; t.giroT = 0; t.ang = recorta(t.ang + dir * PASO_GIRO); return; }
  t.giroT += dt;
  if (t.giroT > GIRO_ESPERA) t.ang = recorta(t.ang + dir * (t.giroT > GIRO_ACELERA ? GIRO_RAPIDO : GIRO_LENTO) * dt);
}

export function lanzar(v, ang, c) {
  v.activo = true; v.quieto = false; v.reb = 0;
  v.x = v.px = CANON_X; v.y = v.py = CANON_Y; v.vx = Math.sin(ang) * VEL; v.vy = -Math.cos(ang) * VEL; v.c = c;
}

/** Dispara la burbuja cargada; la siguiente pasa a cargada. */
export function disparar(t, ncolores) {
  if (t.vuelo.activo) return false;
  lanzar(t.vuelo, t.ang, t.actual);
  t.actual = t.siguiente;
  t.siguiente = colorAleatorio(t, presentes(t), ncolores);
  t.disparos++; t.prisa = 0;
  return true;
}

/* ---------- vuelo y choque ---------- */
/** ¿Toca la burbuja en (x, y) el techo u otra burbuja? */
export function choca(t, x, y) {
  const arriba = t.bajadas * FILA;
  if (y - R <= arriba) return true;
  const rf = Math.floor((y - arriba - R) / FILA);
  const cs = t.celdas, lim = CHOQUE * CHOQUE;
  for (let r = rf - 1; r <= rf + 1; r++) {
    if (r < 0 || r >= FILAS) continue;
    const cy = R + (r + t.bajadas) * FILA, dy = y - cy;
    if (dy * dy >= lim) continue;
    const cc = Math.round((x - R - (r & 1 ? R : 0)) / D);
    for (let c = cc - 1; c <= cc + 1; c++) {
      if (!valida(r, c) || !cs[celda(r, c)]) continue;
      const dx = x - centroX(r, c);
      if (dx * dx + dy * dy < lim) return true;
    }
  }
  return false;
}

/**
 * Mueve una burbuja en vuelo. Rebota en las paredes. Devuelve true si ha chocado
 * (se queda en su sitio para pegarla). `ev` (opcional): lista de eventos para los rebotes.
 */
export function moverVuelo(t, v, dt, ev, b) {
  v.px = v.x; v.py = v.y; // posición anterior, para suavizar el dibujo entre ticks
  if (!v.activo || v.quieto) return false;
  const s = dt / SUBPASOS;
  for (let i = 0; i < SUBPASOS; i++) {
    v.x += v.vx * s; v.y += v.vy * s;
    if (v.x < R) { v.x = 2 * R - v.x; v.vx = -v.vx; v.reb++; if (ev) ev.push(EV.rebote, b); }
    else if (v.x > ANCHO - R) { v.x = 2 * (ANCHO - R) - v.x; v.vx = -v.vx; v.reb++; if (ev) ev.push(EV.rebote, b); }
    if (choca(t, v.x, v.y)) return true;
  }
  return false;
}

/** Hueco donde se queda una burbuja que ha chocado en (x, y): el libre más cercano que toca algo. */
export function hueco(t, x, y) {
  const cs = t.celdas;
  const rr = Math.max(0, Math.min(FILAS - 1, Math.round((y - R) / FILA - t.bajadas)));
  let mejor = -1, md = Infinity;
  for (let pasada = 0; pasada < 2 && mejor < 0; pasada++) {
    const r0 = pasada ? 0 : rr - 1, r1 = pasada ? FILAS - 1 : rr + 1;
    for (let r = r0; r <= r1; r++) {
      if (r < 0 || r >= FILAS) continue;
      const cy = centroY(t, r);
      for (let c = 0; c < ancho(r); c++) {
        const i = celda(r, c);
        if (cs[i]) continue;
        const dx = x - centroX(r, c), dy = y - cy, d2 = dx * dx + dy * dy;
        if (d2 >= md || (pasada === 0 && d2 > 4 * D * D)) continue;
        let toca = r === 0;
        if (!toca) { const n = vecinos(r, c); for (let k = 0; k < n; k++) if (cs[VEC[k]]) { toca = true; break; } }
        if (toca) { md = d2; mejor = i; }
      }
    }
  }
  return mejor;
}

/* ---------- grupos y caídas ---------- */
const PILA = new Int16Array(FILAS * COLS), MARCA = new Uint8Array(FILAS * COLS);
export const GRUPO = new Int16Array(FILAS * COLS);  // celdas del último grupo encontrado
export const SUELTAS = new Int16Array(FILAS * COLS); // celdas que caen

/** Celdas conectadas del mismo color que `i`; las deja en GRUPO y devuelve cuántas son. */
export function grupo(cs, i) {
  const col = cs[i];
  if (!col) return 0;
  MARCA.fill(0);
  let sp = 0, n = 0;
  PILA[sp++] = i; MARCA[i] = 1;
  while (sp) {
    const k = PILA[--sp];
    GRUPO[n++] = k;
    const m = vecinos((k / COLS) | 0, k % COLS);
    for (let j = 0; j < m; j++) {
      const v = VEC[j];
      if (!MARCA[v] && cs[v] === col) { MARCA[v] = 1; PILA[sp++] = v; }
    }
  }
  return n;
}

/** Celdas que no están unidas a la fila 0; las deja en SUELTAS y devuelve cuántas son. */
export function sueltas(cs) {
  MARCA.fill(0);
  let sp = 0;
  for (let c = 0; c < COLS; c++) if (cs[c]) { MARCA[c] = 1; PILA[sp++] = c; }
  while (sp) {
    const k = PILA[--sp];
    const m = vecinos((k / COLS) | 0, k % COLS);
    for (let j = 0; j < m; j++) {
      const v = VEC[j];
      if (!MARCA[v] && cs[v]) { MARCA[v] = 1; PILA[sp++] = v; }
    }
  }
  let n = 0;
  for (let i = 0; i < cs.length; i++) if (cs[i] && !MARCA[i]) SUELTAS[n++] = i;
  return n;
}

/** Puntos de una caída de n burbujas: 20, 40, 80… hasta 1.310.720. */
export const bonusCaida = (n) => (n <= 0 ? 0 : Math.min(MAX_CAIDA, PUNTOS_BURBUJA * 2 ** Math.min(n, 17)));

/** Bonus de tiempo al limpiar: 50.000 en ≤ 5 s, baja en línea hasta 0 a los 60 s. */
export function bonusTiempo(s) {
  if (s <= 5) return 50000;
  if (s >= 60) return 0;
  return Math.round((50000 * (60 - s)) / 55 / 10) * 10;
}

export function perdio(t) {
  const cs = t.celdas;
  for (let r = Math.max(0, LINEA - t.bajadas); r < FILAS; r++) {
    for (let c = 0; c < ancho(r); c++) if (cs[celda(r, c)]) return true;
  }
  return t.bajadas >= LINEA;
}

const enc = (b, i, c) => b * 10000 + i * 10 + c;

/** Pega la burbuja en la celda i y resuelve grupos, caídas, basura y techo. */
function resolver(st, b, i, color) {
  const t = st.tab[b], cs = t.celdas, ev = st.eventos;
  cs[i] = color;
  ev.push(EV.pega, enc(b, i, color));
  let explotan = 0, caen = 0;
  const n = grupo(cs, i);
  if (n >= 3) {
    explotan = n;
    for (let k = 0; k < n; k++) { const j = GRUPO[k]; ev.push(EV.explota, enc(b, j, cs[j])); cs[j] = 0; }
    caen = sueltas(cs);
    for (let k = 0; k < caen; k++) { const j = SUELTAS[k]; ev.push(EV.cae, enc(b, j, cs[j])); cs[j] = 0; }
    if (caen) ev.push(EV.cascada, b * 100 + Math.min(99, caen));
  }
  if (st.modo === 'niveles') st.puntos += explotan * PUNTOS_BURBUJA + bonusCaida(caen);
  else if (caen) { st.tab[1 - b].basura += caen; ev.push(EV.envia, b * 100 + Math.min(99, caen)); }

  revisarColores(t, st.ncolores);
  if (vacio(t)) return;
  // la basura que me han mandado llega después de mi disparo (§6.2)
  if (t.basura > 0) entregarBasura(st, b);
  if (st.modo === 'niveles') {
    t.desdeBajada++;
    if (t.desdeBajada >= st.techo) bajarTecho(st, b);
    else if (st.techo - t.desdeBajada === AVISO_TECHO) ev.push(EV.tiembla, b);
  }
  revisarColores(t, st.ncolores);
}

function bajarTecho(st, b) {
  const t = st.tab[b];
  t.bajadas++; t.desdeBajada = 0;
  st.eventos.push(EV.baja, b);
}

/** Basura: cada burbuja entra por abajo en una columna al azar y sube hasta pegarse. */
function entregarBasura(st, b) {
  const t = st.tab[b], v = TMP;
  const n = Math.min(BASURA_MAX, t.basura);
  t.basura -= n;
  for (let k = 0; k < n; k++) {
    v.x = R + azar(t) * (ANCHO - 2 * R);
    v.y = ALTO + R;
    while (v.y > 0 && !choca(t, v.x, v.y)) v.y -= 2;
    const i = hueco(t, v.x, v.y);
    if (i < 0) continue;
    const c = colorAleatorio(t, presentes(t), st.ncolores);
    t.celdas[i] = c;
    st.eventos.push(EV.basura, enc(b, i, c));
  }
}
const TMP = { activo: false, quieto: false, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, c: 0, reb: 0 };

/* ---------- trayectorias (guía de puntería y CPU) ---------- */
/**
 * Sigue el disparo con ángulo `ang` sin cambiar nada. Deja en `out`:
 * `i` hueco donde se pegaría (-1 si ninguno), `reb` rebotes, (`gx`, `gy`) primer rebote
 * o choque (para la guía) y (`x`, `y`) dónde choca.
 */
export function trayectoria(t, ang, out) {
  const v = TMP;
  lanzar(v, ang, 0);
  out.gx = NaN;
  for (let k = 0; k < 600; k++) {
    const antes = v.reb;
    const choco = moverVuelo(t, v, 1 / 60, null, 0);
    if (v.reb > antes && out.gx !== out.gx) {
      // punto exacto del rebote: la x de la pared
      const px = v.vx > 0 ? R : ANCHO - R, f = Math.abs((px - CANON_X) / Math.sin(ang) / VEL);
      out.gx = px; out.gy = CANON_Y - Math.cos(ang) * VEL * f;
    }
    if (choco) {
      if (out.gx !== out.gx) { out.gx = v.x; out.gy = v.y; }
      out.x = v.x; out.y = v.y; out.reb = v.reb; out.i = hueco(t, v.x, v.y);
      return out;
    }
  }
  out.i = -1; out.reb = v.reb; out.x = v.x; out.y = v.y;
  if (out.gx !== out.gx) { out.gx = v.x; out.gy = v.y; }
  return out;
}

/* ---------- partida ---------- */
/**
 * @param {'niveles'|'cpu'|'online'} modo
 * @param {{ semilla?: number, nivel?: number, rival?: number }} [o]
 */
export function crear(modo, o = {}) {
  const st = {
    modo, fase: 'listo', t: 0, dur: T_LISTO, tick: 0,
    tab: modo === 'niveles' ? [crearTablero()] : [crearTablero(), crearTablero()],
    nivel: Math.max(1, Math.min(TOTAL_NIVELES, o.nivel | 0 || 1)), mundo: -1, techo: 8, ncolores: 4,
    puntos: 0, bonus: 0, tiempoNivel: 0, mejor: { p: 0, f: 1 },
    rival: Math.max(0, Math.min(RIVALES - 1, (o.rival | 0) - 1 || 0)), marcador: [0, 0], ronda: 1, ganador: -1, techoT: 0,
    revancha: [false, false], prevA: [false, false],
    rng: (o.semilla ?? 12345) | 0, eventos: [],
  };
  if (modo === 'niveles') iniciarNivel(st);
  else iniciarPartida(st);
  return st;
}

function fase(st, f, dur = 0) { st.fase = f; st.t = 0; st.dur = dur; }

function iniciarNivel(st) {
  const m = mundoDe(st.nivel), t = st.tab[0], filas = filasDe(st.nivel);
  const nuevoMundo = m !== st.mundo;
  st.mundo = m; st.techo = MUNDOS[m].techo; st.tiempoNivel = 0; st.bonus = 0;
  cargarFilas(t, filas);
  let n = 0; for (const f of filas) for (const c of f) n = Math.max(n, c);
  st.ncolores = Math.max(2, n);
  prepararTablero(t, (azar(st) * 4294967296) | 0, st.ncolores);
  fase(st, 'listo', nuevoMundo ? T_MUNDO : T_LISTO);
  st.eventos.push(nuevoMundo ? EV.mundo : EV.listo, m);
}

/** Colores en versus: la CPU empieza con pocos; online, 5. */
export const coloresVersus = (st) => (st.modo === 'cpu' ? (st.rival < 2 ? 4 : st.rival < 5 ? 5 : 6) : 5);

function iniciarPartida(st) {
  st.marcador[0] = st.marcador[1] = 0; st.ronda = 1; st.revancha[0] = st.revancha[1] = false;
  iniciarRonda(st);
}

/** Ronda nueva: los dos tableros con el mismo dibujo al azar y la misma semilla (§6.2). */
function iniciarRonda(st) {
  st.ncolores = coloresVersus(st); st.techoT = 0; st.ganador = -1;
  const [a, b] = st.tab, cs = a.celdas, n = st.ncolores;
  cs.fill(0);
  for (let r = 0; r < FILAS_VS; r++) {
    for (let c = 0; c < ancho(r); c++) {
      let col = 0;
      if (c > 0 && azar(st) < 0.45) col = cs[celda(r, c - 1)];
      else if (r > 0 && azar(st) < 0.35) col = cs[celda(r - 1, r & 1 ? c : Math.max(0, c - 1))];
      cs[celda(r, c)] = col || 1 + Math.floor(azar(st) * n);
    }
  }
  b.celdas.set(cs);
  const semilla = (azar(st) * 4294967296) | 0;
  prepararTablero(a, semilla, n);
  prepararTablero(b, semilla, n);
  fase(st, 'listo', T_LISTO);
  st.eventos.push(EV.listo, st.ronda);
}

/** Entradas reutilizables para un tablero: acciones y, online o CPU, ángulo directo. */
export function crearEntrada() {
  return { left: false, right: false, a: false, ang: NaN, fc: -1, fa: NaN };
}

/** Avanza la partida dt segundos. `ent[i]`: entradas del tablero i (crearEntrada). */
export function paso(st, ent, dt) {
  st.tick++; st.t += dt;
  const ev = st.eventos;
  // flancos de A para las pantallas entre partidas (continuar, revancha)
  const pulsa = [false, false];
  for (let i = 0; i < 2; i++) {
    const a = !!(ent[i] && ent[i].a);
    pulsa[i] = a && !st.prevA[i];
    st.prevA[i] = a;
  }

  switch (st.fase) {
    case 'listo':
      if (st.t >= st.dur) { fase(st, 'juego'); for (const t of st.tab) t.prevA = true; } // lo que ya venía pulsado no dispara
      break;

    case 'juego':
      jugar(st, ent, dt);
      break;

    case 'limpio':
      if (st.t >= st.dur) {
        if (st.nivel >= TOTAL_NIVELES) {
          st.puntos += BONUS_FINAL; st.bonus = BONUS_FINAL;
          anotarMejor(st);
          fase(st, 'final'); ev.push(EV.final, 0);
        } else { st.nivel++; iniciarNivel(st); }
      }
      break;

    case 'perdido':
      if (st.t >= st.dur) fase(st, 'continuar', T_CONTINUAR);
      break;

    case 'continuar':
      if (pulsa[0]) {
        ev.push(EV.continua, 0);
        if (st.modo === 'niveles') { st.puntos = 0; iniciarNivel(st); }
        else iniciarPartida(st);
      } else if (st.t >= st.dur) fase(st, 'over');
      break;

    case 'ronda':
      if (st.t >= st.dur) {
        const g = st.ganador;
        if (g >= 0 && st.marcador[g] >= RONDAS_GANAR) { fase(st, 'partida', T_PARTIDA); ev.push(EV.partida, g); }
        else { st.ronda++; iniciarRonda(st); }
      }
      break;

    case 'partida':
      if (st.modo === 'cpu') {
        if (st.t >= st.dur) {
          if (st.ganador !== 0) fase(st, 'continuar', T_CONTINUAR);
          else if (st.rival >= RIVALES - 1) { fase(st, 'campeon'); ev.push(EV.campeon, 0); }
          else { st.rival++; fase(st, 'rival', T_RIVAL); ev.push(EV.rival, st.rival); }
        }
      } else if (st.t >= 1) {
        // online: revancha cuando los dos pulsan A
        for (let i = 0; i < 2; i++) if (pulsa[i]) st.revancha[i] = true;
        if (st.revancha[0] && st.revancha[1]) iniciarPartida(st);
      }
      break;

    case 'rival':
      if (st.t >= st.dur) iniciarPartida(st);
      break;
  }
}

function anotarMejor(st) {
  if (st.puntos > st.mejor.p) { st.mejor.p = st.puntos; st.mejor.f = st.nivel; }
}

function jugar(st, ent, dt) {
  const ev = st.eventos, vs = st.modo !== 'niveles';
  st.tiempoNivel += dt;
  for (let b = 0; b < st.tab.length; b++) {
    const t = st.tab[b], e = ent[b];
    if (t.perdido || !e) continue;
    // cañón: con ángulo directo (invitado online o CPU) o girando con izquierda/derecha
    if (e.ang === e.ang) t.ang = recorta(e.ang); else girar(t, e, dt);
    // disparo: online por contador (no se pierde aunque falte un mensaje), si no por flanco de A
    let quiere;
    if (e.fc >= 0) quiere = e.fc > t.fc;
    else { quiere = e.a && !t.prevA; t.prevA = e.a; }
    if (quiere && !t.vuelo.activo) {
      if (e.fc >= 0) { t.fc = e.fc; if (e.fa === e.fa) t.ang = recorta(e.fa); }
      disparar(t, st.ncolores); ev.push(EV.disparo, b);
    }
    // prisa: a los 10 s sin disparar, dispara solo
    if (!t.vuelo.activo) {
      const antes = Math.ceil(PRISA - t.prisa);
      t.prisa += dt;
      const ahora = Math.ceil(PRISA - t.prisa);
      if (ahora !== antes && ahora <= AVISO_PRISA && ahora > 0) ev.push(EV.prisa, b * 100 + ahora);
      if (t.prisa >= PRISA) { disparar(t, st.ncolores); ev.push(EV.disparo, b); }
    }
    if (t.vuelo.activo && moverVuelo(t, t.vuelo, dt, ev, b)) {
      const v = t.vuelo;
      v.activo = false;
      const i = hueco(t, v.x, v.y);
      if (i >= 0) resolver(st, b, i, v.c);
    }
  }
  // versus: el techo baja por tiempo
  if (vs) {
    const antes = st.techoT;
    st.techoT += dt;
    if (antes < TECHO_VS - AVISO_TECHO_VS && st.techoT >= TECHO_VS - AVISO_TECHO_VS) ev.push(EV.tiembla, 2);
    if (st.techoT >= TECHO_VS) { st.techoT = 0; for (let b = 0; b < 2; b++) bajarTecho(st, b); }
  }
  // resultado
  if (!vs) {
    const t = st.tab[0];
    if (vacio(t)) {
      st.bonus = bonusTiempo(st.tiempoNivel); st.puntos += st.bonus; t.vuelo.activo = false;
      fase(st, 'limpio', T_LIMPIO); ev.push(EV.limpio, 0);
    } else if (perdio(t)) {
      t.perdido = true; t.vuelo.activo = false; anotarMejor(st);
      fase(st, 'perdido', T_PERDIDO); ev.push(EV.pierde, 0);
    }
    return;
  }
  let pierden = 0;
  for (let b = 0; b < 2; b++) {
    const t = st.tab[b];
    if (!t.perdido && perdio(t)) { t.perdido = true; ev.push(EV.pierde, b); }
    if (t.perdido) pierden |= 1 << b;
    // limpiar tu tablero en versus también gana la ronda
    if (!t.perdido && vacio(t) && !(pierden & (1 << (1 - b)))) { st.tab[1 - b].perdido = true; pierden |= 1 << (1 - b); }
  }
  if (pierden) {
    st.ganador = pierden === 3 ? -1 : pierden === 1 ? 1 : 0;
    if (st.ganador >= 0) st.marcador[st.ganador]++;
    for (const t of st.tab) t.vuelo.activo = false;
    fase(st, 'ronda', T_RONDA); ev.push(EV.ronda, st.ganador + 1);
  }
}

/** ¿Está temblando el techo? (aviso de que va a bajar) */
export function temblando(st, b) {
  if (st.fase !== 'juego') return false;
  if (st.modo === 'niveles') return st.techo - st.tab[b].desdeBajada <= AVISO_TECHO;
  return TECHO_VS - st.techoT <= AVISO_TECHO_VS;
}

/* ---------- instantáneas online (plan §5) ---------- */
const r1 = (v) => Math.round(v * 10) / 10;

export function codificar(st) {
  const d = {
    f: FASES.indexOf(st.fase), k: st.tick, t: r1(st.t), du: r1(st.dur), m: st.marcador.slice(), ro: st.ronda, g: st.ganador,
    tc: r1(st.techoT), nc: st.ncolores, rv: [st.revancha[0] ? 1 : 0, st.revancha[1] ? 1 : 0], b: [],
  };
  for (const t of st.tab) {
    let s = '';
    for (let i = 0; i < t.celdas.length; i++) s += t.celdas[i];
    const v = t.vuelo;
    d.b.push([s, t.bajadas, Math.round(t.ang * 1000), t.actual, t.siguiente, t.disparos, t.fc, r1(t.prisa), t.basura,
      t.desdeBajada, t.perdido ? 1 : 0, v.activo ? 1 : 0, r1(v.x), r1(v.y), Math.round(v.vx), Math.round(v.vy), v.c]);
  }
  return d;
}

const num = (v, min, max, def = min) => (typeof v === 'number' && isFinite(v) ? Math.max(min, Math.min(max, v)) : def);

/**
 * Convierte una instantánea en estado. Valida todo (los temas son públicos).
 * @param {object} d  datos recibidos
 * @param {object} [st] estado a rellenar (para no crear objetos en cada instantánea, R5)
 * @returns {object|null}
 */
export function decodificar(d, st) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.b) || d.b.length !== 2) return null;
  const f = FASES[d.f | 0];
  if (!f) return null;
  if (!st || st.tab.length !== 2) st = crear('online');
  st.modo = 'online'; st.fase = f; st.tick = num(d.k, 0, 1e12) | 0; st.t = num(d.t, 0, 1e5); st.dur = num(d.du, 0, 100);
  st.ronda = num(d.ro, 1, 99, 1) | 0; st.ganador = num(d.g, -1, 1, -1) | 0; st.techoT = num(d.tc, 0, TECHO_VS);
  st.ncolores = num(d.nc, 2, NUM_COLORES, 5) | 0;
  if (Array.isArray(d.m)) { st.marcador[0] = num(d.m[0], 0, 9) | 0; st.marcador[1] = num(d.m[1], 0, 9) | 0; }
  if (Array.isArray(d.rv)) { st.revancha[0] = !!d.rv[0]; st.revancha[1] = !!d.rv[1]; }
  for (let b = 0; b < 2; b++) {
    const a = d.b[b], t = st.tab[b];
    if (!Array.isArray(a) || a.length < 17 || typeof a[0] !== 'string' || a[0].length !== FILAS * COLS) return null;
    for (let i = 0; i < t.celdas.length; i++) {
      const c = a[0].charCodeAt(i) - 48;
      t.celdas[i] = c >= 0 && c <= NUM_COLORES ? c : 0;
    }
    t.bajadas = num(a[1], 0, LINEA) | 0; t.ang = recorta(num(a[2], -2000, 2000, 0) / 1000);
    t.actual = num(a[3], 1, NUM_COLORES, 1) | 0; t.siguiente = num(a[4], 1, NUM_COLORES, 1) | 0;
    t.disparos = num(a[5], 0, 1e9) | 0; t.fc = num(a[6], 0, 1e15); t.prisa = num(a[7], 0, PRISA);
    t.basura = num(a[8], 0, 999) | 0; t.desdeBajada = num(a[9], 0, 99) | 0; t.perdido = !!a[10];
    const v = t.vuelo;
    v.activo = !!a[11]; v.quieto = false; v.x = v.px = num(a[12], 0, ANCHO); v.y = v.py = num(a[13], -50, ALTO + 50);
    v.vx = num(a[14], -VEL, VEL); v.vy = num(a[15], -VEL, VEL); v.c = num(a[16], 1, NUM_COLORES, 1) | 0;
  }
  return st;
}

export { MODOS };

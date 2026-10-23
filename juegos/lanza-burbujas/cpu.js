// Rivales CPU de Lanza Burbujas (spec 005, §6.3). JavaScript puro, como sim.js: mira el
// tablero, prueba ángulos con sim.trayectoria() y produce entradas (ángulo y botón A), igual
// que haría un jugador (constitución A5).
import { trayectoria, grupo, sueltas, GRUPO, COLS, LINEA, ANG_MAX, azar, RIVALES } from './sim.js';

const GRADO = Math.PI / 180;

export const RIVALES_CPU = [
  // espera: s entre disparos · error: grados de fallo · vel: giro en °/s · ruido: cuánto duda al elegir
  { nombre: 'BOLA', espera: 2.6, error: 5, vel: 60, ruido: 160, rebotes: false },
  { nombre: 'TIZÓN', espera: 2.2, error: 4, vel: 70, ruido: 120, rebotes: false },
  { nombre: 'NIEVE', espera: 1.9, error: 3, vel: 80, ruido: 90, rebotes: true },
  { nombre: 'CANELA', espera: 1.6, error: 2.2, vel: 90, ruido: 60, rebotes: true },
  { nombre: 'HUMO', espera: 1.35, error: 1.5, vel: 100, ruido: 40, rebotes: true },
  { nombre: 'KIWI', espera: 1.1, error: 1, vel: 115, ruido: 25, rebotes: true },
  { nombre: 'BIGOTES', espera: 0.9, error: 0.6, vel: 130, ruido: 12, rebotes: true },
  { nombre: 'REINA', espera: 0.7, error: 0.3, vel: 150, ruido: 5, rebotes: true },
];
if (RIVALES_CPU.length !== RIVALES) throw new Error('Faltan rivales CPU');

/** @param {number} rival 0..7 · @param {number} semilla */
export function crearCpu(rival, semilla = 7) {
  const cfg = RIVALES_CPU[Math.max(0, Math.min(RIVALES - 1, rival))];
  return { rival, cfg, rng: semilla | 0, objetivo: NaN, espera: cfg.espera };
}

const OUT = { i: -1, reb: 0, x: 0, y: 0, gx: 0, gy: 0 };
const COPIA = new Int16Array(COLS * 14);

/** Puntúa cada ángulo posible y devuelve el mejor (con su fallo a propósito). */
export function elegir(cpu, t) {
  const cfg = cpu.cfg, cs = t.celdas, col = t.actual;
  let mejor = -Infinity, mejorAng = 0;
  for (let g = -78; g <= 78; g += 1.5) {
    const ang = g * GRADO;
    trayectoria(t, ang, OUT);
    const i = OUT.i;
    if (i < 0 || OUT.reb > 2 || (OUT.reb > 0 && !cfg.rebotes)) continue;
    cs[i] = col;
    const n = grupo(cs, i);
    let s;
    if (n >= 3) {
      for (let k = 0; k < n; k++) { COPIA[k] = GRUPO[k]; cs[GRUPO[k]] = 0; }
      const caen = sueltas(cs);
      for (let k = 0; k < n; k++) cs[COPIA[k]] = col;
      s = 100 * n + 300 * caen;
    } else {
      const fila = ((i / COLS) | 0) + t.bajadas;
      s = 15 * (n - 1) - (fila >= LINEA - 2 ? 400 : fila * 2);
    }
    cs[i] = 0;
    s += azar(cpu) * cfg.ruido - OUT.reb * 5;
    if (s > mejor) { mejor = s; mejorAng = ang; }
  }
  const a = mejorAng + (azar(cpu) * 2 - 1) * cfg.error * GRADO;
  return Math.max(-ANG_MAX, Math.min(ANG_MAX, a));
}

/** Rellena `e` (sim.crearEntrada) con lo que hace la CPU este tick en el tablero b. */
export function pensar(cpu, st, b, dt, e) {
  const t = st.tab[b], cfg = cpu.cfg;
  e.left = e.right = false; e.fc = -1; e.fa = NaN;
  if (st.fase !== 'juego' || t.perdido) { e.a = false; e.ang = NaN; cpu.objetivo = NaN; cpu.espera = cfg.espera * 0.6; return e; }
  e.ang = t.ang;
  if (e.a) { e.a = false; return e; } // suelta el botón tras disparar
  if (t.vuelo.activo) return e;
  if (cpu.objetivo !== cpu.objetivo) {
    cpu.espera -= dt;
    if (cpu.espera > 0) return e;
    cpu.objetivo = elegir(cpu, t);
  }
  const dif = cpu.objetivo - t.ang, max = cfg.vel * GRADO * dt;
  if (Math.abs(dif) > max) { e.ang = t.ang + Math.sign(dif) * max; return e; }
  e.ang = cpu.objetivo; e.a = true;
  cpu.objetivo = NaN; cpu.espera = cfg.espera * (0.7 + 0.6 * azar(cpu));
  return e;
}

// Fases diseñadas de Revienta Burbujas (spec 004, bloque C): solo datos, sin lógica.
// 4 mundos de 5 fases; a partir de la 21 las genera sim.js con la semilla de la partida.
// Diseño propio (AR2). Campos:
//   mundo: 1-4 (fondo y nombre)   tiempo: s para limpiarla
//   burbujas: { s: tamaño 1-4, x, y, dir: -1|1, hex?: sin gravedad, obj?: suelta objeto }
//   bloques:  { x, y, w, h, duro?: no se rompe }  (por encima de y = 440 para no pisar a nadie)
// Con 2 jugadores, sim.js añade una burbuja más donde haya hueco (plan de 004, §4).

export const MUNDOS = ['PRADERA', 'DESIERTO', 'OCÉANO', 'VOLCÁN'];
export const FASES_POR_MUNDO = 5;

const b = (s, x, y, dir, extra) => ({ s, x, y, dir, ...extra });
const k = (x, y, w, duro = false, h = 14) => ({ x, y, w, h, duro });
const HEX = { hex: true }, OBJ = { obj: true }, HEXOBJ = { hex: true, obj: true };

export const FASES = [
  // ---- Mundo 1 · Pradera: lo básico, y al final los primeros bloques ----
  { mundo: 1, tiempo: 60, burbujas: [b(3, 200, 140, 1)], bloques: [] },
  { mundo: 1, tiempo: 70, burbujas: [b(4, 200, 150, 1)], bloques: [] },
  { mundo: 1, tiempo: 75, burbujas: [b(3, 100, 140, 1), b(3, 300, 140, -1)], bloques: [] },
  { mundo: 1, tiempo: 80, burbujas: [b(4, 120, 150, 1), b(2, 300, 120, -1, OBJ)], bloques: [] },
  { mundo: 1, tiempo: 90, burbujas: [b(4, 200, 150, -1), b(3, 80, 130, 1)], bloques: [k(40, 330, 60), k(300, 330, 60)] },

  // ---- Mundo 2 · Desierto: bloques duros y rompibles ----
  { mundo: 2, tiempo: 80, burbujas: [b(3, 100, 140, 1), b(3, 300, 140, -1)], bloques: [k(150, 300, 100), k(20, 380, 60, true), k(320, 380, 60, true)] },
  { mundo: 2, tiempo: 85, burbujas: [b(4, 200, 120, 1)], bloques: [k(60, 260, 80, true), k(260, 260, 80, true), k(160, 360, 80)] },
  { mundo: 2, tiempo: 90, burbujas: [b(4, 100, 130, 1), b(2, 300, 110, -1, OBJ)], bloques: [k(40, 300, 60), k(170, 300, 60), k(300, 300, 60)] },
  { mundo: 2, tiempo: 95, burbujas: [b(3, 80, 140, 1), b(3, 200, 140, -1), b(3, 320, 140, 1)], bloques: [k(170, 250, 60, true), k(60, 380, 50), k(290, 380, 50)] },
  { mundo: 2, tiempo: 100, burbujas: [b(4, 120, 140, 1), b(4, 280, 140, -1)], bloques: [k(180, 200, 40, true), k(20, 330, 70, true), k(310, 330, 70, true)] },

  // ---- Mundo 3 · Océano: burbujas hexagonales ----
  { mundo: 3, tiempo: 80, burbujas: [b(3, 120, 160, 1, HEX), b(3, 280, 140, -1)], bloques: [] },
  { mundo: 3, tiempo: 85, burbujas: [b(3, 100, 150, 1, HEX), b(3, 300, 150, -1, HEX)], bloques: [k(160, 320, 80)] },
  { mundo: 3, tiempo: 90, burbujas: [b(4, 200, 140, 1), b(2, 80, 200, 1, HEXOBJ), b(2, 320, 200, -1, HEX)], bloques: [k(40, 280, 60, true), k(300, 280, 60, true)] },
  { mundo: 3, tiempo: 90, burbujas: [b(4, 200, 180, -1, HEX)], bloques: [k(150, 330, 100, true), k(20, 240, 60), k(320, 240, 60)] },
  { mundo: 3, tiempo: 100, burbujas: [b(4, 100, 140, 1), b(3, 300, 170, -1, HEX), b(3, 200, 240, 1, HEX)], bloques: [k(60, 360, 60), k(280, 360, 60)] },

  // ---- Mundo 4 · Volcán: todo junto ----
  { mundo: 4, tiempo: 100, burbujas: [b(4, 100, 140, 1), b(4, 300, 140, -1)], bloques: [k(175, 260, 50, true), k(20, 380, 60), k(320, 380, 60)] },
  { mundo: 4, tiempo: 100, burbujas: [b(4, 200, 170, 1, HEX), b(3, 80, 130, -1), b(3, 320, 130, 1, OBJ)], bloques: [k(40, 300, 70, true), k(290, 300, 70, true)] },
  { mundo: 4, tiempo: 100, burbujas: [b(3, 70, 140, 1), b(3, 160, 140, -1), b(3, 240, 140, 1), b(3, 330, 140, -1, OBJ)], bloques: [k(60, 280, 50), k(180, 250, 40), k(290, 280, 50), k(170, 400, 60, true)] },
  { mundo: 4, tiempo: 100, burbujas: [b(4, 100, 130, 1), b(4, 300, 180, -1, HEX), b(2, 200, 220, 1, HEXOBJ)], bloques: [k(20, 250, 60, true), k(320, 250, 60, true), k(160, 340, 80)] },
  { mundo: 4, tiempo: 100, burbujas: [b(4, 80, 130, 1), b(4, 200, 110, -1, OBJ), b(4, 320, 130, 1)], bloques: [k(170, 300, 60, true), k(40, 380, 50), k(310, 380, 50)] },
];

/** Mundo de la fase n (1, 2, …; a partir del 5 son mundos de fases generadas). */
export function mundoDe(n) { return Math.ceil(Math.max(1, n) / FASES_POR_MUNDO); }
/** Fondo (0-3) de la fase n: los mundos generados repiten los 4 fondos. */
export function fondoDe(n) { return (mundoDe(n) - 1) % MUNDOS.length; }
/** ¿Es la primera fase de su mundo? (se anuncia con «MUNDO N») */
export function empiezaMundo(n) { return n % FASES_POR_MUNDO === 1; }

// Gatos de Lanza Burbujas en pixel art (spec 005, §6). Diseño propio a partir de las fotos de
// los gatos del usuario: J1 es el atigrado con pecho y patas blancas; J2, la gata tricolor.
// Los rivales CPU son el mismo dibujo con otros pelajes. Solo genera lienzos: no sabe nada de Phaser.

export const ANCHO_GATO = 24, ALTO_GATO = 22;

// Mapa del gato sentado de frente (24×22). o contorno · b pelo · w blanco · e ojo · k negro
// n nariz · i oreja por dentro · c collar · t cola · . transparente
const BASE = [
  '...o............o.......',
  '..obo..........obo......',
  '..obio........oibo......',
  '.obiiooooooooooiibo.....',
  '.obbbbbbbbbbbbbbbbo.....',
  'obbbbbbbbbbbbbbbbbbo....',
  'obbekebbbbbbbbekebbo....',
  'obbekebbbwwbbbekebbo....',
  'obbbbbbwwnnwwbbbbbbo....',
  '.obbbbwwkwwkwwbbbbo.....',
  '..obbbbwwwwwwbbbbo......',
  '...oocccccccccccoo......',
  '...obbwwwwwwwwbbbo..oo..',
  '..obbbwwwwwwwwbbbbo.otto',
  '..obbbwwwwwwwwbbbbo.ottO',
  '.obbbbwwwwwwwwbbbbbo.oto',
  '.obbbbbwwwwwwbbbbbbo.oto',
  '.obbbbbwwwwwwbbbbbbooto.',
  '.obbbbbbbbbbbbbbbbbttto.',
  '.obbbbbbbbbbbbbbbbbotoo.',
  '.obbwwwwobbowwwwbbbo....',
  '..oooooooooooooooo......',
];

// Variantes de cara y patas (filas que cambian respecto a BASE)
const FILAS = {
  parpadeo: { 6: 'obbbbbbbbbbbbbbbbbbo....', 7: 'obkkkkbbbwwbbkkkkbbo....' },
  feliz: { 6: 'obbbkbbbbbbbbbbkbbbo....', 7: 'obbkbkbbbwwbbbkbkbbo....', 9: '.obbbbwwkkkkwwbbbbo.....' },
  triste: { 6: 'obbbbbbbbbbbbbbbbbbo....', 7: 'obkkkbbbbwwbbbbkkkbo....', 8: 'obbabbbwwnnwwbbbbbbo....', 9: '.obbabwwwkkwwwbbbbo.....' },
  // pata derecha arriba, en la manivela
  manivela: { 18: '.obbbbbbbbbbbbbwwbbttto.', 19: '.obbbbbbbbbbbbwwwwbotoo.', 20: '.obbwwwwobbbbbbbbbbo....' },
};

/** Pelajes. `tipo`: atigrado · tricolor · solido · puntas · esmoquin */
export const GATOS = {
  j1: { nombre: 'J1', tipo: 'atigrado', pelo: '#9a8c7c', oscuro: '#3b332c', blanco: true, ojos: '#e8a838', collar: '#2ec4b6' },
  j2: { nombre: 'J2', tipo: 'tricolor', pelo: '#f6f2ea', oscuro: '#2a2422', mancha: '#d9822b', blanco: true, ojos: '#c8c43a', collar: '#ff8fc7' },
};
/** Rivales CPU (mismo orden que cpu.js). */
export const GATOS_RIVALES = [
  { tipo: 'solido', pelo: '#d8d4cc', blanco: true, ojos: '#6fa8ff', collar: '#ff6b4a' },            // BOLA: gris claro
  { tipo: 'esmoquin', pelo: '#26222a', blanco: true, ojos: '#9be05a', collar: '#ffcf3a' },          // TIZÓN
  { tipo: 'solido', pelo: '#f8f6f2', blanco: false, ojos: '#4d8dff', collar: '#a66bff' },           // NIEVE
  { tipo: 'atigrado', pelo: '#e08a3c', oscuro: '#9c4f17', blanco: true, ojos: '#9be05a', collar: '#4d8dff' }, // CANELA
  { tipo: 'solido', pelo: '#7d8494', blanco: false, ojos: '#ffcf3a', collar: '#ff8fc7' },           // HUMO
  { tipo: 'puntas', pelo: '#efe2c8', oscuro: '#5b4030', blanco: false, ojos: '#4dc3ff', collar: '#5ee67a' }, // KIWI: siamés
  { tipo: 'atigrado', pelo: '#b7b0a4', oscuro: '#55504a', blanco: false, ojos: '#e8a838', collar: '#3ee0e0' }, // BIGOTES
  { tipo: 'tricolor', pelo: '#f6f2ea', oscuro: '#2a2422', mancha: '#d9822b', blanco: true, ojos: '#e8c83a', collar: '#ffcf3a', corona: true }, // REINA
];

const CONTORNO = '#1a1022', NARIZ = '#f08aa0', OREJA = '#f2a6b8', LAGRIMA = '#6fd0ff';

/** Color del pelo en (x, y) según el pelaje. */
function pelo(g, x, y, ch) {
  const blanco = '#f6f2ea';
  if (ch === 'w' && g.blanco) return blanco;
  const cola = ch === 't';
  switch (g.tipo) {
    case 'atigrado': {
      if (cola) return y % 2 ? g.oscuro : g.pelo;
      if (y <= 5 && (x === 8 || x === 11 || (x === 9 && y === 4) || (x === 10 && y === 4))) return g.oscuro; // la «M» de la frente
      if (y === 8 && (x <= 3 || x >= 16)) return g.oscuro;  // rayas de las mejillas
      if (y >= 12 && (y + (x >> 1)) % 3 === 0 && (x <= 5 || x >= 14)) return g.oscuro;
      return g.pelo;
    }
    case 'tricolor': {
      if (cola) return y % 3 === 0 ? g.mancha : g.oscuro;
      if (y <= 7 && x <= 8 && !(x >= 2 && x <= 6 && y >= 6)) return g.oscuro; // oreja y ojo negros, como en la foto
      if (y <= 6 && x >= 11) return g.mancha;                       // oreja y frente naranjas
      if (y >= 13 && y <= 18 && x >= 14) return g.oscuro;           // mancha negra del lomo
      if (y >= 15 && y <= 19 && x <= 4) return g.mancha;            // mancha naranja
      if (y >= 12 && y <= 13 && x >= 12) return g.mancha;
      return g.pelo;
    }
    case 'puntas': {
      if (cola) return g.oscuro;
      if (y <= 3 || (y >= 7 && y <= 9 && x >= 6 && x <= 13) || y >= 20) return g.oscuro; // orejas, cara y patas
      return g.pelo;
    }
    default: // sólido y esmoquin
      return g.pelo;
  }
}

/**
 * Dibuja el gato en un lienzo nuevo de 24×22 (un píxel por cuadro).
 * @param {object} g pelaje (GATOS.j1, GATOS_RIVALES[i]…) · @param {'sentado'|'parpadeo'|'feliz'|'triste'|'manivela'} pose
 */
export function lienzoGato(g, pose = 'sentado', doc = globalThis.document) {
  const cv = doc.createElement('canvas');
  cv.width = ANCHO_GATO; cv.height = ALTO_GATO + (g.corona ? 0 : 0);
  const x = cv.getContext('2d');
  const cambios = FILAS[pose] || {};
  for (let fy = 0; fy < ALTO_GATO; fy++) {
    const fila = cambios[fy] || BASE[fy];
    for (let fx = 0; fx < ANCHO_GATO; fx++) {
      const ch = fila[fx];
      let c = null;
      if (ch === 'o' || ch === 'O' || ch === 'k') c = CONTORNO;
      else if (ch === 'b' || ch === 'w' || ch === 't') c = pelo(g, fx, fy, ch);
      else if (ch === 'e') c = g.ojos;
      else if (ch === 'n') c = NARIZ;
      else if (ch === 'i') c = OREJA;
      else if (ch === 'c') c = g.collar;
      else if (ch === 'a') c = LAGRIMA;
      if (!c) continue;
      x.fillStyle = c; x.fillRect(fx, fy, 1, 1);
    }
  }
  // medalla del collar
  x.fillStyle = '#ffcf3a'; x.fillRect(9, 12, 2, 1);
  if (g.corona) { x.fillStyle = '#ffcf3a'; x.fillRect(7, 2, 6, 2); x.fillRect(7, 0, 1, 2); x.fillRect(9, 0, 2, 2); x.fillRect(12, 0, 1, 2); }
  return cv;
}

export const POSES = ['sentado', 'parpadeo', 'feliz', 'triste', 'manivela'];

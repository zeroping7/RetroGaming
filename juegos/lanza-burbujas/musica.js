// Música de Lanza Burbujas (spec 009): composiciones propias, estilo chiptune. Formato en src/audio/musica.js.
// Compases de 8 corcheas. Cada voz se repite con su longitud.

/** Un acorde que dura un compás */
const cps = (...a) => a.map((c) => c + ' - - - - - - -').join(' | ');
/** Bajo: un patrón de 8 pasos por compás con la raíz de cada acorde ('R' = raíz grave, 'r' = una octava arriba, 'Q' = quinta) */
function bajo(patron, ...raices) {
  return raices.map((r) => {
    const [, n, o] = /^([A-G][#b]?)(\d)$/.exec(r), q = QUINTA[n];
    return patron.split(' ').map((t) => (t === 'R' ? r : t === 'r' ? n + (+o + 1) : t === 'Q' ? q[0] + (+o + q[1]) : t)).join(' ');
  }).join(' | ');
}
const QUINTA = { C: ['G', 0], D: ['A', 0], E: ['B', 0], F: ['C', 1], G: ['D', 1], A: ['E', 1], B: ['F#', 1], Bb: ['F', 1], 'F#': ['C#', 1], 'C#': ['G#', 0] };

/** Tema de cada mundo (MUNDOS de niveles.js) */
export const TEMAS = ['salon', 'jardin', 'tejados', 'cocina', 'desvan', 'luna'];

const duelo = {
  bpm: 150, voces: [
    { tipo: 'nota', onda: 'square', vol: 0.1, corto: 0.8, notas:
      'D5 . F5 . A5 . D6 . | D6 . C6 . Bb5 . A5 . | G5 . E5 . C5 . E5 . | A5 - - . C#5 . E5 . |' +
      'D5 . F5 . A5 . F5 . | Bb5 . A5 . F5 . D5 . | G5 . Bb5 . D6 . Bb5 . | A5 - - - C#6 - - -' },
    { tipo: 'nota', onda: 'sawtooth', vol: 0.08, corto: 0.6, notas: bajo('R R r R R R r R', 'D2', 'Bb1', 'C2', 'A1', 'D2', 'Bb1', 'G1', 'A1') },
    { tipo: 'arpegio', onda: 'square', vol: 0.03, sub: 2, intensa: true, notas: cps('Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A7') },
    { tipo: 'bateria', vol: 0.27, notas: 'k h s h k k s h' },
    { tipo: 'bateria', vol: 0.2, intensa: true, notas: 'h h h h h h h o' },
  ],
};

export const CANCIONES = {
  // Menú: juguetón, «pasos de gato» en staccato
  menu: {
    bpm: 120, voces: [
      { tipo: 'nota', onda: 'square', vol: 0.1, corto: 0.55, notas:
        'F5 . A5 . C6 . A5 . | D6 . C6 . A5 . F5 . | G5 . Bb5 . D6 . Bb5 . | C6 - - . A5 . G5 . |' +
        'F5 . A5 . C6 . F6 . | E6 . D6 . C6 . A5 . | Bb5 . G5 . E5 . G5 . | F5 - - - . . . .' },
      { tipo: 'nota', onda: 'triangle', vol: 0.3, corto: 0.5, notas: bajo('R . Q . R . Q .', 'F2', 'D2', 'Bb1', 'C2', 'F2', 'C2', 'C2', 'F2') },
      { tipo: 'arpegio', onda: 'square', vol: 0.03, notas: cps('F', 'Dm', 'Bb', 'C', 'F', 'C', 'C7', 'F') },
      { tipo: 'bateria', vol: 0.22, notas: 'k . s . k k s .' },
    ],
  },

  // El salón: tranquilo y hogareño
  salon: {
    bpm: 100, voces: [
      { tipo: 'nota', onda: 'triangle', vol: 0.26, notas:
        'E5 - - . G5 - E5 . | C5 - - - A4 - - . | F5 - - . A5 - G5 . | D5 - - - - - . . |' +
        'E5 - - . G5 - C6 . | B5 - A5 - E5 - - . | F5 - - . E5 - D5 . | C5 - - - - - . .' },
      { tipo: 'nota', onda: 'triangle', vol: 0.28, notas: bajo('R - - - Q - - -', 'C3', 'A2', 'F2', 'G2', 'C3', 'A2', 'D3', 'C3') },
      { tipo: 'arpegio', onda: 'square', vol: 0.025, sub: 2, notas: cps('C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'C') },
      { tipo: 'nota', onda: 'square', vol: 0.04, intensa: true, notas: cps('G5', 'E5', 'C6', 'B5', 'G5', 'E5', 'F5', 'E5') },
      { tipo: 'bateria', vol: 0.16, notas: 'k . h . s . h .' },
    ],
  },

  // El jardín: alegre, con «pájaros»
  jardin: {
    bpm: 126, voces: [
      { tipo: 'nota', onda: 'square', vol: 0.1, corto: 0.75, notas:
        'D5 . G5 . B5 . A5 G5 | E5 - - . G5 . B5 . | C6 . B5 . A5 . G5 . | A5 - - - - . D5 . |' +
        'D5 . G5 . B5 . D6 . | E6 . D6 . B5 . G5 . | C6 . A5 . F#5 . A5 . | G5 - - - - - . .' },
      { tipo: 'nota', onda: 'triangle', vol: 0.3, corto: 0.6, notas: bajo('R . Q . r . Q .', 'G2', 'E2', 'C2', 'D2', 'G2', 'E2', 'D2', 'G2') },
      { tipo: 'arpegio', onda: 'square', vol: 0.03, notas: cps('G', 'Em', 'C', 'D', 'G', 'Em', 'D', 'G') },
      { tipo: 'nota', onda: 'sine', vol: 0.06, corto: 0.5, notas: // pájaros
        '. . . . . . G6 A6 | . . . . . . . . | . . . . . . . . | . . . . D7 B6 D7 . | . . . . . . . . | B6 G6 . . . . . . | . . . . . . . . | . . . . . . . .' },
      { tipo: 'arpegio', onda: 'triangle', vol: 0.06, sub: 2, oct: 1, intensa: true, notas: cps('G', 'Em', 'C', 'D', 'G', 'Em', 'D', 'G') },
      { tipo: 'bateria', vol: 0.22, notas: 'k h s h k h s h' },
    ],
  },

  // Los tejados: nocturno y travieso, bajo andante
  tejados: {
    bpm: 112, voces: [
      { tipo: 'nota', onda: 'square', vol: 0.09, corto: 0.5, notas:
        'E5 . . G5 . . B5 . | A5 . . C6 . B5 A5 . | F#5 . . A5 . G5 F#5 . | E5 - - . . . B4 . |' +
        'E5 . G5 . B5 . E6 . | D6 . C6 . A5 . . . | B5 . A5 . G5 . F#5 . | E5 - - - . . . .' },
      { tipo: 'nota', onda: 'triangle', vol: 0.32, corto: 0.8, notas:
        'E2 - G2 - B2 - G2 - | A2 - C3 - E3 - C3 - | B1 - D#2 - F#2 - A2 - | E2 - B1 - E2 - G2 - |' +
        'E2 - G2 - B2 - G2 - | A2 - C3 - E3 - C3 - | B1 - D#2 - F#2 - A2 - | E2 - - - B1 - - -' },
      { tipo: 'arpegio', onda: 'square', vol: 0.025, intensa: true, sub: 2, notas: cps('Em', 'Am', 'B7', 'Em', 'Em', 'Am', 'B7', 'Em') },
      { tipo: 'bateria', vol: 0.2, notas: 'k . h h s . h .' },
    ],
  },

  // La cocina: rápido y burbujeante
  cocina: {
    bpm: 144, voces: [
      { tipo: 'nota', onda: 'square', vol: 0.09, corto: 0.7, notas:
        'F#5 . A5 . D6 . A5 . | B5 . G5 . B5 . D6 . | C#6 . A5 . E5 . A5 . | D6 - F#5 - A5 - - . |' +
        'B5 . D6 . F#6 . D6 . | G5 . B5 . D6 . B5 . | A5 . C#6 . E6 . C#6 . | D6 - - - . . . .' },
      { tipo: 'nota', onda: 'triangle', vol: 0.3, corto: 0.5, notas: bajo('R r R r R r R r', 'D2', 'G2', 'A2', 'D2', 'B1', 'G2', 'A2', 'D2') },
      { tipo: 'arpegio', onda: 'square', vol: 0.03, sub: 2, oct: 1, notas: cps('D', 'G', 'A', 'D', 'Bm', 'G', 'A', 'D') },
      { tipo: 'bateria', vol: 0.24, notas: 'k h s h k h s h' },
      { tipo: 'bateria', vol: 0.16, intensa: true, notas: '. h . h . h h h' },
    ],
  },

  // El desván: misterioso, «caja de música»
  desvan: {
    bpm: 92, voces: [
      { tipo: 'nota', onda: 'triangle', vol: 0.18, eco: true, corto: 0.6, notas:
        'A5 . C6 . E6 . C6 . | F5 . A5 . C6 . A5 . | G5 . C6 . E6 . C6 . | G#5 . B5 . E6 - - . |' +
        'A5 . C6 . E6 . A6 . | F6 . E6 . C6 . A5 . | B5 . G#5 . E5 . G#5 . | A5 - - - . . . .' },
      { tipo: 'nota', onda: 'triangle', vol: 0.28, notas: bajo('R - - - - - - -', 'A2', 'F2', 'C3', 'E2', 'A2', 'F2', 'E2', 'A2') },
      { tipo: 'arpegio', onda: 'square', vol: 0.02, intensa: true, notas: cps('Am', 'F', 'C', 'E', 'Am', 'F', 'E7', 'Am') },
      { tipo: 'bateria', vol: 0.14, notas: 'k . . . . . h .' },
    ],
  },

  // La luna: espacial y flotante (Si bemol lidio)
  luna: {
    bpm: 88, voces: [
      { tipo: 'nota', onda: 'sine', vol: 0.22, eco: true, notas:
        'F5 - - - D5 - - - | E5 - - - G5 - - - | F5 - - - D5 - Bb4 - | C5 - - - - - - - |' +
        'D5 - - - G5 - - - | E5 - - - C6 - - - | A5 - - - F5 - - - | Bb5 - - - - - - -' },
      { tipo: 'nota', onda: 'triangle', vol: 0.28, notas: bajo('R - - - Q - - -', 'Bb1', 'C2', 'Bb1', 'C2', 'G2', 'C2', 'F2', 'Bb1') },
      { tipo: 'arpegio', onda: 'sine', vol: 0.08, sub: 2, notas: cps('Bb', 'C', 'Bb', 'C', 'Gm', 'C', 'F', 'Bb') },
      { tipo: 'nota', onda: 'square', vol: 0.03, intensa: true, notas: cps('D6', 'E6', 'D6', 'E6', 'Bb5', 'C6', 'A5', 'D6') },
      { tipo: 'bateria', vol: 0.15, notas: 'k . . . . . . . | . . . . s . . .' },
    ],
  },

  // Duelo (VS) y final (contra la REINA: más rápido y con todas las voces)
  duelo,
  final: { ...duelo, bpm: 162 },
};

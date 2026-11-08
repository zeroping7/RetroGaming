// Música de Revienta Burbujas (spec 008): composiciones propias, estilo chiptune. Formato en src/audio/musica.js.
// Compases de 8 corcheas. Cada voz se repite con su longitud.

/** Repite un trozo de texto n veces */
const rep = (s, n) => Array(n).fill(s).join(' | ');
/** Un acorde que dura un compás */
const cps = (...a) => a.map((c) => c + ' - - - - - - -').join(' | ');

export const TEMAS = ['pradera', 'desierto', 'oceano', 'volcan']; // por fondoDe(fase)

export const CANCIONES = {
  menu: {
    bpm: 132, voces: [
      { tipo: 'nota', onda: 'square', vol: 0.11, notas:
        'E5 . G5 . C6 - G5 . | D5 . G5 . B5 - G5 . | C5 . E5 . A5 - G5 E5 | F5 - E5 - D5 - . . |' +
        'E5 . G5 . C6 - D6 . | B5 - G5 - D5 . G5 . | A5 . G5 . F5 . E5 D5 | D5 - B4 - C5 - - .' },
      { tipo: 'nota', onda: 'triangle', vol: 0.3, notas:
        'C3 . C3 . G2 . C3 . | G2 . G2 . D3 . G2 . | A2 . A2 . E3 . A2 . | F2 . F2 . C3 . F2 . |' +
        'C3 . C3 . G2 . C3 . | G2 . G2 . D3 . G2 . | F2 . F2 . C3 . F2 . | G2 . G2 . C3 . . .' },
      { tipo: 'arpegio', onda: 'square', vol: 0.035, sub: 2, notas: cps('C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G') },
      { tipo: 'bateria', vol: 0.25, notas: 'k h s h k k s h' },
    ],
  },

  // Pradera: saltarín, en Sol mayor
  pradera: {
    bpm: 140, voces: [
      { tipo: 'nota', onda: 'square', vol: 0.1, corto: 0.7, notas:
        'G5 . D5 . G5 . B5 . | C6 . B5 . A5 . G5 . | F#5 . A5 . D6 - C6 . | B5 - G5 - - . D5 . |' +
        'E5 . G5 . B5 . E6 . | D6 . C6 . B5 . A5 . | A5 . F#5 . A5 . C6 . | B5 - G5 - G5 - - .' },
      { tipo: 'nota', onda: 'triangle', vol: 0.3, corto: 0.6, notas:
        'G2 . D3 . G3 . D3 . | C3 . G3 . C3 . G2 . | D3 . A3 . D3 . A2 . | G2 . D3 . G3 . D3 . |' +
        'E2 . B2 . E3 . B2 . | C3 . G3 . C3 . G2 . | D3 . A3 . D3 . F#2 . | G2 . D3 . G2 . . .' },
      { tipo: 'arpegio', onda: 'square', vol: 0.03, notas: cps('G', 'C', 'D', 'G', 'Em', 'C', 'D', 'G') },
      { tipo: 'arpegio', onda: 'triangle', vol: 0.07, sub: 2, oct: 1, intensa: true, notas: cps('G', 'C', 'D', 'G', 'Em', 'C', 'D', 'G') },
      { tipo: 'bateria', vol: 0.25, notas: 'k h s h k h s h' },
      { tipo: 'bateria', vol: 0.2, intensa: true, notas: '. . . . . . . k | . . . . . . s s' },
    ],
  },

  // Desierto: modo frigio dominante en Mi, percusión seca
  desierto: {
    bpm: 120, voces: [
      { tipo: 'nota', onda: 'square', vol: 0.1, notas:
        'E5 F5 G#5 - A5 . G#5 F5 | E5 - - . . . B4 . | C5 B4 A4 B4 C5 . D5 C5 | B4 - - . G#4 A4 B4 . |' +
        'E5 F5 G#5 A5 B5 - C6 B5 | A5 G#5 F5 G#5 A5 - - . | G#5 F5 E5 F5 G#5 . F5 E5 | E5 - - - . . . .' },
      { tipo: 'nota', onda: 'triangle', vol: 0.32, notas: 'E2 . E2 B2 E2 . F2 E2 | E2 . E2 B2 D3 . C3 B2' },
      { tipo: 'arpegio', onda: 'square', vol: 0.03, notas: cps('E', 'F', 'Am', 'E', 'E', 'Dm', 'F', 'E') },
      { tipo: 'nota', onda: 'sawtooth', vol: 0.045, intensa: true, notas:
        'B4 - - - - - - - | C5 - - - - - - - | E5 - - - - - - - | G#4 - - - - - - - |' +
        'B4 - - - - - - - | A4 - - - - - - - | C5 - - - - - - - | B4 - - - - - - -' },
      { tipo: 'bateria', vol: 0.25, notas: 'k . h h s . k h' },
      { tipo: 'bateria', vol: 0.18, intensa: true, notas: '. h . h . h h h' },
    ],
  },

  // Océano: lento y ondulante, en Re menor, con eco
  oceano: {
    bpm: 96, voces: [
      { tipo: 'nota', onda: 'triangle', vol: 0.22, eco: true, notas:
        'A4 - - - D5 - E5 - | F5 - - - E5 - D5 - | C5 - - - A4 - C5 - | E5 - - - - - . . |' +
        'A4 - - - D5 - E5 - | F5 - - - G5 - F5 - | E5 - D5 - Bb4 - G4 - | A4 - - - - - . .' },
      { tipo: 'nota', onda: 'triangle', vol: 0.3, notas:
        'D2 - - - A2 - - - | Bb1 - - - F2 - - - | F2 - - - C3 - - - | C2 - - - G2 - - - |' +
        'D2 - - - A2 - - - | Bb1 - - - F2 - - - | G2 - - - D2 - - - | A1 - - - E2 - - -' },
      { tipo: 'arpegio', onda: 'sine', vol: 0.09, sub: 2, notas: cps('Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A') },
      { tipo: 'nota', onda: 'square', vol: 0.04, intensa: true, notas:
        'D6 - - - - - - - | D6 - - - - - - - | C6 - - - - - - - | C6 - - - - - - - |' +
        'D6 - - - - - - - | D6 - - - - - - - | Bb5 - - - - - - - | C#6 - - - - - - -' },
      { tipo: 'bateria', vol: 0.2, notas: 'k . . h . . h . | k . . h . k h .' },
      { tipo: 'bateria', vol: 0.18, intensa: true, notas: '. . s . . . s .' },
    ],
  },

  // Volcán: tenso, en La menor, bajo insistente
  volcan: {
    bpm: 150, voces: [
      { tipo: 'nota', onda: 'square', vol: 0.1, corto: 0.8, notas:
        'A4 . . A4 C5 . A4 . | E5 . D5 . C5 . B4 . | C5 . . C5 F5 . E5 . | D5 - - . B4 . G4 . |' +
        'A4 . . A4 C5 . E5 . | A5 . G5 . E5 . C5 . | B4 . G#4 . B4 . E5 . | E5 - - - G#4 - B4 -' },
      { tipo: 'nota', onda: 'sawtooth', vol: 0.09, corto: 0.6, notas:
        rep('A2 A2 A3 A2 A2 A2 G2 A2', 2) + ' | ' + 'F2 F2 F3 F2 F2 F2 E2 F2 | G2 G2 G3 G2 G2 G2 F2 G2 | ' +
        rep('A2 A2 A3 A2 A2 A2 G2 A2', 2) + ' | ' + rep('E2 E2 E3 E2 E2 E2 D2 E2', 2) },
      { tipo: 'arpegio', onda: 'square', vol: 0.025, sub: 2, intensa: true, notas: cps('Am', 'Am', 'F', 'G', 'Am', 'Am', 'E', 'E7') },
      { tipo: 'bateria', vol: 0.27, notas: 'k h s h k h s k' },
      { tipo: 'bateria', vol: 0.2, intensa: true, notas: 'h h h h h h h o' },
    ],
  },
};

// Sonidos de Lanza Burbujas (spec 005, §10; D-011): una receta por evento de sim.js.
// Algunas se eligen en la página según quién gana (ronda/partida) y para el que escucha.

const DO = 523, RE = 587, MI = 659, FA = 698, SOL = 784, LA = 880, DO2 = 1047;

export const RECETAS = {
  listo(s) { s.tono({ de: 660, dur: 0.07, vol: 0.22 }); s.tono({ de: 990, dur: 0.09, vol: 0.22, en: 0.12 }); },
  mundo(s) { s.notas([[DO, 0.1], [MI, 0.1], [SOL, 0.1], [DO2, 0.1], [SOL, 0.08], [DO2, 0.3]], { vol: 0.18 }); },
  disparo(s) { s.tono({ tipo: 'triangle', de: 300, a: 900, dur: 0.09, vol: 0.35 }); s.ruido({ dur: 0.05, de: 3000, a: 800, vol: 0.12 }); },
  rebote(s) { s.tono({ tipo: 'square', de: 1200, a: 900, dur: 0.04, vol: 0.1 }); },
  pega(s) { s.tono({ tipo: 'sine', de: 420, a: 300, dur: 0.06, vol: 0.3 }); },
  // color 1..8: cada uno suena un poco distinto
  explota(s, c = 1) {
    const f = 700 + (c % 8) * 90;
    s.ruido({ dur: 0.09, de: f * 5, a: f / 2, vol: 0.4 });
    s.tono({ tipo: 'sine', de: f, a: f * 1.6, dur: 0.07, vol: 0.22 });
  },
  // n burbujas que caen: cascada más larga cuanto más caen
  cascada(s, n = 1) {
    const k = Math.min(10, Math.max(1, n));
    for (let i = 0; i < k; i++) s.tono({ tipo: 'square', de: 500 + i * 70, a: 700 + i * 90, dur: 0.06, vol: 0.12, en: i * 0.05 });
    if (n >= 6) s.notas([[0, k * 0.05], [SOL, 0.06], [DO2, 0.06], [MI * 2, 0.16]], { vol: 0.18 });
  },
  tiembla(s) { for (let i = 0; i < 3; i++) s.ruido({ dur: 0.09, de: 400, a: 80, vol: 0.4, en: i * 0.12 }); },
  baja(s) { s.tono({ tipo: 'sawtooth', de: 140, a: 50, dur: 0.25, vol: 0.4 }); s.ruido({ dur: 0.2, de: 900, a: 60, vol: 0.5 }); },
  prisa(s, n = 5) { s.tono({ tipo: 'square', de: n <= 2 ? 1400 : 1000, dur: 0.05, vol: 0.14 }); },
  limpio(s) { s.notas([[SOL, 0.08], [DO2, 0.08], [MI * 2, 0.08], [SOL * 2, 0.24]], { vol: 0.22 }); },
  pierde(s) { s.tono({ tipo: 'square', de: 700, a: 90, dur: 0.7, vol: 0.26 }); },
  gana(s) { s.notas([[DO, 0.08], [MI, 0.08], [SOL, 0.08], [DO2, 0.2]], { vol: 0.22 }); },
  pierdeRonda(s) { s.notas([[SOL, 0.12], [MI, 0.12], [DO, 0.3]], { tipo: 'triangle', vol: 0.32 }); },
  victoria(s) { s.notas([[DO, 0.1], [DO, 0.1], [SOL, 0.1], [SOL, 0.1], [LA, 0.1], [LA, 0.1], [SOL, 0.3], [FA, 0.1], [MI, 0.1], [RE, 0.1], [DO, 0.3]], { vol: 0.18 }); },
  derrota(s) { s.notas([[440, 0.18], [349, 0.18], [294, 0.18], [220, 0.45]], { tipo: 'triangle', vol: 0.38 }); },
  envia(s) { s.tono({ tipo: 'square', de: 600, a: 1600, dur: 0.15, vol: 0.14 }); },
  basura(s) { s.tono({ tipo: 'square', de: 220, a: 160, dur: 0.08, vol: 0.18 }); s.ruido({ dur: 0.06, de: 1200, a: 300, vol: 0.2 }); },
  continua(s) { s.notas([[SOL, 0.06], [DO2, 0.06], [MI * 2, 0.14]], { vol: 0.22 }); },
  rival(s) { s.notas([[MI, 0.08], [MI, 0.08], [SOL, 0.16]], { vol: 0.2 }); },
  campeon(s) { s.notas([[DO, 0.1], [MI, 0.1], [SOL, 0.1], [DO2, 0.1], [MI * 2, 0.1], [SOL * 2, 0.4]], { vol: 0.2 }); },
  final(s) { s.notas([[SOL, 0.1], [LA, 0.1], [SOL, 0.1], [DO2, 0.1], [MI * 2, 0.1], [DO2, 0.1], [SOL * 2, 0.45]], { vol: 0.2 }); },
  aviso(s) { s.tono({ tipo: 'square', de: 1760, dur: 0.05, vol: 0.12 }); },
  vida(s) { s.notas([[MI, 0.07], [SOL, 0.07], [MI * 2, 0.07], [DO2, 0.07], [SOL * 2, 0.2]], { vol: 0.22 }); },
};

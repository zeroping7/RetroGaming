// Sonidos de Revienta Burbujas (spec 003): una receta por evento de sim.js (EVENTOS).
import { TIPOS } from './sim.js';

// Notas (Hz) para las melodías
const DO = 523, MI = 659, SOL = 784, DO2 = 1047, LA3 = 220, FA3 = 175, RE3 = 147;

export const RECETAS = {
  listo(s) {
    s.tono({ de: 660, dur: 0.07, vol: 0.25 });
    s.tono({ de: 990, dur: 0.09, vol: 0.25, en: 0.12 });
  },
  disparo(s) {
    s.tono({ tipo: 'square', de: 420, a: 1300, dur: 0.07, vol: 0.18 });
  },
  clavado(s) {
    s.tono({ tipo: 'triangle', de: 1800, a: 1200, dur: 0.12, vol: 0.35 });
    s.ruido({ dur: 0.05, de: 6000, a: 2000, vol: 0.2 });
  },
  // tamaño 1 (pequeña) a 4 (grande): cuanto más grande, más grave
  estallido(s, tam = 2) {
    const f = [0, 1500, 1000, 650, 420][tam] || 800;
    s.ruido({ dur: 0.08 + tam * 0.03, de: f * 4, a: f / 2, vol: 0.5 });
    s.tono({ tipo: 'sine', de: f, a: f / 3, dur: 0.09, vol: 0.3 });
  },
  aparece(s) {
    s.tono({ tipo: 'triangle', de: 1568, dur: 0.06, vol: 0.2 });
    s.tono({ tipo: 'triangle', de: 2093, dur: 0.08, vol: 0.2, en: 0.06 });
  },
  objeto(s, tipo) {
    // los potenciadores que tienen sonido propio (dinamita, reloj) suenan aparte
    if (TIPOS[tipo] === 'dinamita' || TIPOS[tipo] === 'reloj' || TIPOS[tipo] === 'vida') return;
    if (TIPOS[tipo] === 'fruta') { s.tono({ tipo: 'triangle', de: 880, a: 1760, dur: 0.12, vol: 0.3 }); return; }
    s.notas([[DO, 0.05], [MI, 0.05], [SOL, 0.05], [DO2, 0.1]], { vol: 0.22 });
  },
  dinamita(s) {
    s.ruido({ dur: 0.6, de: 3000, a: 60, vol: 0.9 });
    s.tono({ tipo: 'sawtooth', de: 120, a: 40, dur: 0.4, vol: 0.4 });
  },
  reloj(s) {
    for (let i = 0; i < 4; i++) s.tono({ tipo: 'square', de: i % 2 ? 1400 : 1000, dur: 0.03, vol: 0.2, en: i * 0.15 });
  },
  escudo(s) {
    s.tono({ tipo: 'triangle', de: 300, a: 80, dur: 0.25, vol: 0.5 });
    s.ruido({ dur: 0.12, de: 1500, a: 200, vol: 0.35 });
  },
  muerte(s) {
    s.tono({ tipo: 'square', de: 880, a: 110, dur: 0.6, vol: 0.28 });
  },
  limpio(s) {
    s.notas([[SOL, 0.08], [DO2, 0.08], [MI * 2, 0.08], [SOL * 2, 0.22]], { vol: 0.22 });
  },
  // cada burbuja más del combo suena un poco más aguda
  combo(s, n = 2) {
    const f = 600 * Math.pow(1.12, Math.min(n, 8));
    s.tono({ tipo: 'square', de: f, a: f * 1.5, dur: 0.08, vol: 0.16, en: 0.03 });
  },
  vida(s) {
    s.notas([[MI, 0.07], [SOL, 0.07], [MI * 2, 0.07], [DO2, 0.07], [SOL * 2, 0.2]], { vol: 0.22 });
  },
  tiempo(s) {
    s.notas([[400, 0.12], [300, 0.12], [200, 0.3]], { tipo: 'sawtooth', vol: 0.22 });
  },
  aviso(s) {
    s.tono({ tipo: 'square', de: 1760, dur: 0.05, vol: 0.12 });
  },
  rompe(s) {
    s.ruido({ dur: 0.18, de: 2500, a: 150, vol: 0.55 });
    s.tono({ tipo: 'square', de: 220, a: 90, dur: 0.12, vol: 0.2 });
  },
  // empieza un mundo (spec 004, bloque C): fanfarria corta
  mundo(s) {
    s.notas([[DO, 0.1], [SOL, 0.1], [DO2, 0.1], [SOL, 0.08], [DO2, 0.3]], { tipo: 'square', vol: 0.18 });
  },
  // se sigue jugando tras «¿CONTINUAR?» (bloque D)
  continua(s) {
    s.notas([[SOL, 0.06], [DO2, 0.06], [MI * 2, 0.14]], { vol: 0.22 });
  },
  fin(s) {
    s.notas([[LA3 * 2, 0.18], [FA3 * 2, 0.18], [RE3 * 2, 0.18], [LA3, 0.45]], { tipo: 'triangle', vol: 0.4 });
  },
};

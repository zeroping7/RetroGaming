// Sonido común a todos los juegos (spec 003 de revienta-burbujas, D-011).
// Todo se genera con Web Audio: sin archivos de audio ni licencias.
// Cada juego define sus «recetas» con tono(), ruido() y notas(), y las toca con tocar().

const CLAVE_SILENCIO = 'rg-silencio';  // compartido por todos los juegos
const VOLUMEN = 0.35;
const SEPARACION = 40;                 // ms mínimos entre dos veces el mismo sonido

/**
 * @param {Record<string, (s: Sinte, dato?: number) => void>} recetas
 * @returns {{ tocar(nombre: string, dato?: number): void, silencio: boolean, alternar(): boolean, activar(): void }}
 */
export function crearAudio(recetas) {
  let ctx = null, salida = null, ruidoBuf = null;
  let silencio = false;
  try { silencio = localStorage.getItem(CLAVE_SILENCIO) === '1'; } catch {}
  const ultimo = {};

  // Los navegadores no dejan sonar nada hasta que el usuario toca o pulsa una tecla
  function activar() {
    if (!ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      salida = ctx.createGain(); salida.gain.value = VOLUMEN; salida.connect(ctx.destination);
      // 1 s de ruido blanco reutilizable (explosiones, pops)
      ruidoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = ruidoBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }
  for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, activar, { capture: true, passive: true });

  /** @typedef {Object} Sinte  herramientas para las recetas, con `t` = ahora */
  const sinte = {
    get t() { return ctx.currentTime; },
    /** Tono con barrido de frecuencia. tipo: 'square' | 'triangle' | 'sawtooth' | 'sine' */
    tono({ tipo = 'square', de, a = de, dur = 0.1, vol = 0.5, en = 0 }) {
      const t0 = ctx.currentTime + en, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = tipo;
      o.frequency.setValueAtTime(de, t0);
      if (a !== de) o.frequency.exponentialRampToValueAtTime(Math.max(20, a), t0 + dur);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g); g.connect(salida);
      o.start(t0); o.stop(t0 + dur + 0.02);
    },
    /** Ruido filtrado (pop, explosión). de/a: frecuencia del filtro paso bajo */
    ruido({ dur = 0.15, de = 4000, a = 300, vol = 0.6, en = 0 }) {
      const t0 = ctx.currentTime + en, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = ruidoBuf;
      f.type = 'lowpass';
      f.frequency.setValueAtTime(de, t0);
      f.frequency.exponentialRampToValueAtTime(Math.max(40, a), t0 + dur);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(salida);
      src.start(t0); src.stop(t0 + dur + 0.02);
    },
    /** Melodía: lista de [frecuencia, duración en s]; frecuencia 0 = silencio */
    notas(lista, { tipo = 'square', vol = 0.35 } = {}) {
      let en = 0;
      for (const [f, d] of lista) { if (f) sinte.tono({ tipo, de: f, dur: d * 0.95, vol, en }); en += d; }
    },
  };

  return {
    tocar(nombre, dato) {
      if (silencio || !ctx || ctx.state !== 'running' || !recetas[nombre]) return;
      const ahora = performance.now();
      if (ahora - (ultimo[nombre] || 0) < SEPARACION) return;
      ultimo[nombre] = ahora;
      try { recetas[nombre](sinte, dato); } catch {}
    },
    get silencio() { return silencio; },
    alternar() {
      silencio = !silencio;
      try { localStorage.setItem(CLAVE_SILENCIO, silencio ? '1' : '0'); } catch {}
      if (!silencio) activar();
      return silencio;
    },
    activar,
  };
}

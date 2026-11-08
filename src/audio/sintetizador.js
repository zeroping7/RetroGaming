// Sonido común a todos los juegos (spec 003 de revienta-burbujas, D-011).
// Todo se genera con Web Audio: sin archivos de audio ni licencias.
// Cada juego define sus «recetas» con tono(), ruido() y notas(), y las toca con tocar().

const CLAVE_SONIDO = 'rg-sonido';      // 'todo' | 'efectos' | 'silencio', compartido por todos los juegos (spec 007)
const CLAVE_ANTIGUA = 'rg-silencio';   // la de antes: '1' = silencio
const MODOS = ['todo', 'efectos', 'silencio'];
export const ICONO_SONIDO = { todo: '🎵', efectos: '🔊', silencio: '🔇' };
export const NOMBRE_SONIDO = { todo: 'Música y efectos', efectos: 'Solo efectos', silencio: 'Silencio' };
const VOLUMEN = 0.35;
const VOLUMEN_MUSICA = 0.5;            // respecto a los efectos
const SEPARACION = 40;                 // ms mínimos entre dos veces el mismo sonido

/**
 * @param {Record<string, (s: Sinte, dato?: number) => void>} recetas
 * @returns {{ tocar(nombre: string, dato?: number): void, silencio: boolean, modo: string, musicaActiva: boolean,
 *   alternar(): string, activar(): void, ctx: AudioContext|null, musica: GainNode|null, ruido: AudioBuffer|null }}
 */
export function crearAudio(recetas) {
  let ctx = null, salida = null, musica = null, ruidoBuf = null;
  let modo = 'todo';
  try {
    const m = localStorage.getItem(CLAVE_SONIDO);
    if (MODOS.includes(m)) modo = m;
    else if (localStorage.getItem(CLAVE_ANTIGUA) === '1') modo = 'silencio';
  } catch {}
  const ultimo = {};

  // Los navegadores no dejan sonar nada hasta que el usuario toca o pulsa una tecla
  function activar() {
    if (!ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      salida = ctx.createGain(); salida.gain.value = VOLUMEN; salida.connect(ctx.destination);
      musica = ctx.createGain(); musica.gain.value = modo === 'todo' ? VOLUMEN_MUSICA : 0; musica.connect(salida);
      // 1 s de ruido blanco reutilizable (explosiones, pops)
      ruidoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = ruidoBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }
  for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, activar, { capture: true, passive: true });
  // Pestaña oculta o móvil bloqueado: todo calla (y la música no avanza); al volver, sigue
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else if (modo !== 'silencio') ctx.resume().catch(() => {});
  });

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
      if (modo === 'silencio' || !ctx || ctx.state !== 'running' || !recetas[nombre]) return;
      const ahora = performance.now();
      if (ahora - (ultimo[nombre] || 0) < SEPARACION) return;
      ultimo[nombre] = ahora;
      try { recetas[nombre](sinte, dato); } catch {}
    },
    get silencio() { return modo === 'silencio'; },
    get modo() { return modo; },
    get musicaActiva() { return modo === 'todo'; },
    /** Pasa al siguiente modo: todo → solo efectos → silencio → todo */
    alternar() {
      modo = MODOS[(MODOS.indexOf(modo) + 1) % MODOS.length];
      try { localStorage.setItem(CLAVE_SONIDO, modo); localStorage.removeItem(CLAVE_ANTIGUA); } catch {}
      if (musica) musica.gain.setTargetAtTime(modo === 'todo' ? VOLUMEN_MUSICA : 0, ctx.currentTime, 0.05);
      if (modo !== 'silencio') activar();
      return modo;
    },
    activar,
    get ctx() { return ctx; },
    /** Entrada del canal de música (src/audio/musica.js) */
    get musica() { return musica; },
    get ruido() { return ruidoBuf; },
  };
}

/** Pinta el botón de sonido con el modo actual. */
export function pintarBotonSonido(boton, audio) {
  boton.textContent = ICONO_SONIDO[audio.modo];
  boton.title = NOMBRE_SONIDO[audio.modo];
  boton.setAttribute('aria-label', 'Sonido: ' + NOMBRE_SONIDO[audio.modo]);
  boton.setAttribute('aria-pressed', String(audio.modo !== 'silencio'));
}

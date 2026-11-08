// Música de fondo (spec 007, D-015): secuenciador propio sobre el canal de música de sintetizador.js.
// Cada juego escribe sus canciones como texto (ver abajo) y llama a tocar(id, { tempo, intensidad })
// en cada fotograma; si ya suena esa canción, solo ajusta el tempo y la intensidad sin reiniciarla.
//
// Formato de una canción:
//   { bpm: 120, div: 2,                       // div: pasos por pulso (2 = corcheas)
//     voces: [
//       { tipo: 'nota', onda: 'square', vol: .2, notas: 'E5 . G5 - | A5 . . .' },
//       { tipo: 'arpegio', onda: 'square', vol: .06, sub: 2, notas: 'Am - - - | F - - -' },
//       { tipo: 'bateria', vol: .5, notas: 'k h s h' },
//       { ..., intensa: true },               // solo con intensidad 1 (último nivel del mundo)
//       { ..., eco: true },                   // repite cada nota más flojo 3 pasos después
//     ] }
//   Notas: C4, F#3, Bb5… · '.' silencio · '-' alarga lo anterior · '|' solo ayuda a leer.
//   Acordes (arpegio): Am, F, C7, Dm7, Gsus, Bdim, Fmaj7… (octava 4; `oct` en la voz para moverla).
//   Batería: k bombo · s caja · h charles · o charles abierto (se pueden juntar: 'kh').
// Cada voz se repite con su propia longitud: una batería de 8 pasos sirve para una melodía de 64.

const ADELANTO = 0.12;   // s de música que se dejan programados por adelantado
const CADA = 25;         // ms entre revisiones del secuenciador

const SEMITONO = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
/** 'C#4' → Hz */
export function frecuencia(nombre) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(nombre);
  if (!m) return 0;
  const st = SEMITONO[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) - 4) * 12;
  return 440 * Math.pow(2, st / 12);
}
const ACORDES = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6], sus: [0, 5, 7], aug: [0, 4, 8] };
function acorde(nombre, oct) {
  const m = /^([A-G][#b]?)(m7|maj7|m|7|dim|sus|aug)?$/.exec(nombre);
  if (!m) return null;
  const raiz = frecuencia(m[1] + (4 + oct));
  return ACORDES[m[2] || ''].map((s) => raiz * Math.pow(2, s / 12));
}

/** Texto → por paso: { f: Hz | Hz[] | 'khs…', d: pasos } o null */
function compilarVoz(v) {
  const tok = v.notas.split(/[\s|]+/).filter(Boolean);
  const oct = v.oct || 0, pasos = new Array(tok.length).fill(null);
  for (let i = 0; i < tok.length; i++) {
    const t = tok[i];
    if (t === '.' || t === '-') continue;
    let d = 1; while (tok[i + d] === '-') d++;
    if (v.tipo === 'bateria') pasos[i] = { f: t, d: 1 };
    else if (v.tipo === 'arpegio') { const a = acorde(t, oct); if (a) for (let k = 0; k < d; k++) pasos[i + k] = { f: a, d: 1, k }; }
    else { const f = frecuencia(t); if (f) pasos[i] = { f: f * Math.pow(2, oct), d }; }
  }
  return { ...v, pasos };
}
function compilar(c) { return { bpm: c.bpm, div: c.div || 2, voces: c.voces.map(compilarVoz) }; }

/**
 * @param {ReturnType<import('./sintetizador.js').crearAudio>} audio
 * @param {Record<string, object>} canciones
 */
export function crearMusica(audio, canciones) {
  const hechas = {};
  let id = null, cancion = null, bus = null, paso = 0, siguiente = 0, tempo = 1, intensidad = 0;

  function bajar(b) {
    const ctx = audio.ctx; if (!b || !ctx) return;
    b.gain.setTargetAtTime(0, ctx.currentTime, 0.06);
    setTimeout(() => { try { b.disconnect(); } catch {} }, 600);
  }

  function nota(f, t, dur, onda, vol) {
    const ctx = audio.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = onda; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(vol * 0.55, t + Math.min(0.12, dur * 0.5));
    g.gain.setValueAtTime(vol * 0.55, t + dur * 0.85);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
  }
  function ruido(t, dur, de, a, vol) {
    const ctx = audio.ctx, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = audio.ruido; f.type = 'bandpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(de, t); f.frequency.exponentialRampToValueAtTime(a, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  function golpe(c, t, vol) {
    const ctx = audio.ctx;
    if (c === 'k') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(vol * 1.4, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.18);
    } else if (c === 's') { ruido(t, 0.13, 3000, 1200, vol * 0.9); nota(190, t, 0.06, 'triangle', vol * 0.5); }
    else if (c === 'h') ruido(t, 0.035, 9000, 7000, vol * 0.45);
    else if (c === 'o') ruido(t, 0.16, 8000, 6000, vol * 0.35);
  }

  function programar() {
    const ctx = audio.ctx;
    if (!cancion || !ctx || ctx.state !== 'running' || !audio.musicaActiva || !bus) { siguiente = 0; return; }
    if (siguiente < ctx.currentTime) siguiente = ctx.currentTime + 0.05;
    while (siguiente < ctx.currentTime + ADELANTO) {
      const dp = 60 / (cancion.bpm * tempo * cancion.div);
      for (const v of cancion.voces) {
        if (v.intensa && intensidad < 1) continue;
        const e = v.pasos[paso % v.pasos.length];
        if (!e) continue;
        const vol = v.vol || 0.2;
        if (v.tipo === 'bateria') { for (const c of e.f) golpe(c, siguiente, vol); continue; }
        if (v.tipo === 'arpegio') {
          const sub = v.sub || 1, ds = dp / sub;
          for (let s = 0; s < sub; s++) nota(e.f[(e.k * sub + s) % e.f.length], siguiente + s * ds, ds * 0.9, v.onda || 'square', vol);
          continue;
        }
        const dur = e.d * dp * (v.corto || 0.92);
        nota(e.f, siguiente, dur, v.onda || 'square', vol);
        if (v.eco) nota(e.f, siguiente + dp * 3, dur, v.onda || 'square', vol * 0.3);
      }
      paso++; siguiente += dp;
    }
  }
  setInterval(programar, CADA);

  return {
    /** Toca la canción `nuevo` (null = silencio). Si ya suena, solo cambia tempo e intensidad. */
    tocar(nuevo, op) {
      tempo = (op && op.tempo) || 1; intensidad = (op && op.intensidad) || 0;
      if (nuevo === id) return;
      id = nuevo; bajar(bus); bus = null; cancion = null; paso = 0; siguiente = 0;
      if (!nuevo || !canciones[nuevo]) return;
      cancion = hechas[nuevo] || (hechas[nuevo] = compilar(canciones[nuevo]));
      if (audio.ctx && audio.musica) { bus = audio.ctx.createGain(); bus.gain.value = 1; bus.connect(audio.musica); }
      else id = null; // aún no hay audio (falta el primer toque): se reintenta en el siguiente fotograma
    },
    parar() { this.tocar(null); },
    get actual() { return id; },
  };
}

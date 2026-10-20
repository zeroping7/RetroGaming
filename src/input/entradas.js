// Entradas abstractas compartidas: teclado, mando y táctil se traducen a acciones
// (up, down, left, right, a, b, start). Contrato en docs/arquitectura.md §6.
//
// Dos formas de usarlo:
//  - Menús: `alPulsar(accion, jugador, info)` avisa de cada pulsación (y de las
//    repeticiones de las direcciones al mantenerlas). Devuelve true si la usas.
//  - Juegos: `entradas.estado(jugador)` en cada tick dice qué acciones están pulsadas.

export const ACCIONES = ['up', 'down', 'left', 'right', 'a', 'b', 'start'];

/** Teclas por defecto (códigos físicos de `KeyboardEvent.code`). Una entrada por jugador. */
export const TECLAS_1J = [{
  up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
  a: ['Space', 'KeyJ'], b: ['ShiftLeft', 'ShiftRight', 'KeyK'], start: ['Enter', 'NumpadEnter', 'Escape'],
}];
export const TECLAS_2J = [
  { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'],
    a: ['Space'], b: ['ShiftRight'], start: ['Enter', 'NumpadEnter', 'Escape'] },
  { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], a: ['KeyF'], b: ['KeyG'], start: [] },
];

// Mando con distribución estándar (Gamepad API): cruceta 12-15, A=0, B=1, Start=9.
const BOTONES = { up: [12], down: [13], left: [14], right: [15], a: [0], b: [1], start: [9] };
const UMBRAL_STICK = 0.5;
// Reutilizados en cada sondeo del mando para no crear objetos en el bucle (constitución R5).
const INFO_MANDO = Object.freeze({ origen: 'mando', codigo: null, repeticion: false });
const INFO_MANDO_REP = Object.freeze({ origen: 'mando', codigo: null, repeticion: true });
const REPETIR_PRIMERA = 350; // ms hasta la primera repetición al mantener una dirección
const REPETIR_CADA = 160;

const falsos = () => ({ up: false, down: false, left: false, right: false, a: false, b: false, start: false });
const ceros = () => ({ up: 0, down: 0, left: 0, right: 0, a: 0, b: 0, start: 0 });

function enCampoDeTexto(t) {
  return !!t && (t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT');
}

function mandoPulsa(g, acc) {
  for (const b of BOTONES[acc]) if (g.buttons[b]?.pressed) return true;
  const x = g.axes[0] || 0, y = g.axes[1] || 0;
  if (acc === 'left') return x < -UMBRAL_STICK;
  if (acc === 'right') return x > UMBRAL_STICK;
  if (acc === 'up') return y < -UMBRAL_STICK;
  if (acc === 'down') return y > UMBRAL_STICK;
  return false;
}

/**
 * @typedef {'tactil' | 'teclado' | 'mando'} Dispositivo
 * @typedef {{ origen: Dispositivo, codigo: string | null, repeticion: boolean }} InfoPulsacion
 * @param {{
 *   jugadores?: 1 | 2,                 // con 2, cada uno su parte del teclado y un mando
 *   teclas?: Record<string, string[]>[], // reparto propio (por defecto TECLAS_1J / TECLAS_2J)
 *   repetir?: string[],                // acciones que se repiten al mantenerlas
 *   alPulsar?: (accion: string, jugador: number, info: InfoPulsacion) => boolean | void,
 *   alCambiarDispositivo?: (d: Dispositivo) => void,
 * }} [opciones]
 */
export function crearEntradas({
  jugadores = 1,
  teclas,
  repetir = ['up', 'down', 'left', 'right'],
  alPulsar = null,
  alCambiarDispositivo = null,
} = {}) {
  const n = jugadores > 1 ? 2 : 1;
  const mapa = teclas || (n > 1 ? TECLAS_2J : TECLAS_1J);
  // Sin alPulsar (juegos), se evita la acción del navegador en todas las teclas usadas.
  const prevenirSiempre = !alPulsar;

  /** código de tecla → [jugador, acción] */
  const porCodigo = new Map();
  for (let j = 0; j < n; j++) {
    for (const acc of ACCIONES) for (const c of mapa[j]?.[acc] || []) porCodigo.set(c, [j, acc]);
  }

  // Estado por jugador y origen. Teclado y táctil cuentan teclas/dedos (varias pueden dar la misma acción).
  const teclado = [], tactil = [], mando = [], mandoAntes = [], siguienteRep = [], combinado = [], salida = [];
  for (let j = 0; j < n; j++) {
    teclado.push(ceros()); tactil.push(ceros()); siguienteRep.push(ceros());
    mando.push(falsos()); mandoAntes.push(falsos()); combinado.push(falsos()); salida.push(falsos());
  }
  const pulsadas = new Set(); // teclas mantenidas, para soltarlas si se pierde el foco

  let dispositivo = matchMedia('(pointer: coarse)').matches ? 'tactil' : 'teclado';
  function cambiarDispositivo(d) {
    if (d === dispositivo) return;
    dispositivo = d;
    alCambiarDispositivo?.(d);
  }

  // Recalcula el estado combinado del jugador y avisa de las acciones que acaban de pulsarse.
  function refrescar(j, info) {
    const c = combinado[j];
    let usada = false;
    for (const acc of ACCIONES) {
      const ahora = teclado[j][acc] > 0 || tactil[j][acc] > 0 || mando[j][acc];
      if (ahora && !c[acc] && info) {
        c[acc] = true;
        cambiarDispositivo(info.origen);
        if (alPulsar?.(acc, j, info) === true) usada = true;
      }
      c[acc] = ahora;
    }
    return usada;
  }

  /* ---------- teclado ---------- */
  function alBajarTecla(e) {
    if (enCampoDeTexto(e.target)) return;
    cambiarDispositivo('teclado');
    if (e.ctrlKey || e.metaKey || e.altKey) return; // atajos del navegador
    const m = porCodigo.get(e.code);
    if (!m) return;
    const [j, acc] = m;
    if (e.repeat) {
      if (!pulsadas.has(e.code)) return; // venía pulsada de antes de cargar la página
      const usada = repetir.includes(acc) &&
        alPulsar?.(acc, j, { origen: 'teclado', codigo: e.code, repeticion: true }) === true;
      if (usada || prevenirSiempre) e.preventDefault();
      return;
    }
    if (pulsadas.has(e.code)) return;
    pulsadas.add(e.code);
    teclado[j][acc]++;
    const usada = refrescar(j, { origen: 'teclado', codigo: e.code, repeticion: false });
    if (usada || prevenirSiempre) e.preventDefault();
  }
  function alSoltarTecla(e) {
    if (!pulsadas.delete(e.code)) return;
    const [j, acc] = porCodigo.get(e.code);
    teclado[j][acc]--;
    refrescar(j, null);
  }
  function soltarTodo() {
    for (const c of pulsadas) {
      const [j, acc] = porCodigo.get(c);
      teclado[j][acc]--;
    }
    pulsadas.clear();
    for (let j = 0; j < n; j++) refrescar(j, null);
  }
  const alOcultar = () => { if (document.hidden) soltarTodo(); };
  const alPuntero = (e) => cambiarDispositivo(e.pointerType === 'touch' ? 'tactil' : 'teclado');

  addEventListener('keydown', alBajarTecla);
  addEventListener('keyup', alSoltarTecla);
  addEventListener('blur', soltarTodo);
  document.addEventListener('visibilitychange', alOcultar);
  addEventListener('pointerdown', alPuntero, { passive: true });

  /* ---------- mando (Gamepad API) ---------- */
  // Botones que ya venían pulsados al ver un mando por primera vez (p. ej. el A con el que
  // se salió del juego anterior): no cuentan hasta que se sueltan.
  const bloqueados = new Map();
  let raf = 0, activo = true;

  function sondear(t) {
    raf = 0;
    if (!activo) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let j = 0; j < n; j++) for (const acc of ACCIONES) mando[j][acc] = false;
    let orden = 0, alguno = false;
    for (let i = 0; i < pads.length; i++) {
      const g = pads[i];
      if (!g || !g.connected) { bloqueados.delete(i); continue; }
      alguno = true;
      const j = n === 1 ? 0 : orden++; // con 2 jugadores, el primer mando es J1 y el segundo J2
      if (j >= n) continue;
      let bloq = bloqueados.get(i);
      if (!bloq) {
        bloq = new Set(ACCIONES.filter((acc) => mandoPulsa(g, acc)));
        bloqueados.set(i, bloq);
      }
      for (const acc of ACCIONES) {
        const p = mandoPulsa(g, acc);
        if (bloq.has(acc)) { if (!p) bloq.delete(acc); continue; }
        if (p) mando[j][acc] = true;
      }
    }
    for (let j = 0; j < n; j++) {
      refrescar(j, INFO_MANDO);
      // Repetición al mantener una dirección con el mando (el teclado ya repite solo).
      for (const acc of repetir) {
        if (!mando[j][acc]) continue;
        if (!mandoAntes[j][acc]) siguienteRep[j][acc] = t + REPETIR_PRIMERA;
        else if (t >= siguienteRep[j][acc]) {
          siguienteRep[j][acc] = t + REPETIR_CADA;
          alPulsar?.(acc, j, INFO_MANDO_REP);
        }
      }
      for (const acc of ACCIONES) mandoAntes[j][acc] = mando[j][acc];
    }
    if (alguno) raf = requestAnimationFrame(sondear); // sin mandos, se para hasta el próximo gamepadconnected
  }
  function arrancarSondeo() {
    if (!raf && activo && navigator.getGamepads) raf = requestAnimationFrame(sondear);
  }
  addEventListener('gamepadconnected', arrancarSondeo);
  try { if ([...(navigator.getGamepads?.() || [])].some(Boolean)) arrancarSondeo(); } catch {}

  /* ---------- táctil ---------- */
  /**
   * Convierte un elemento en botón táctil de una acción (para los controles en pantalla de los juegos).
   * El elemento debería tener `touch-action: none` en su CSS.
   */
  function botonTactil(el, acc, j = 0) {
    const dedos = new Set();
    const bajar = (e) => {
      e.preventDefault();
      if (dedos.has(e.pointerId)) return;
      dedos.add(e.pointerId);
      tactil[j][acc]++;
      refrescar(j, { origen: e.pointerType === 'touch' ? 'tactil' : 'teclado', codigo: null, repeticion: false });
    };
    const subir = (e) => {
      if (!dedos.delete(e.pointerId)) return;
      tactil[j][acc]--;
      refrescar(j, null);
    };
    el.addEventListener('pointerdown', bajar);
    for (const tipo of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(tipo, subir);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  return {
    /** Último tipo de control usado: 'tactil' | 'teclado' | 'mando'. */
    get dispositivo() { return dispositivo; },
    /** Acciones pulsadas ahora por el jugador (0 = J1, 1 = J2). Reutiliza el mismo objeto: no lo guardes. */
    estado(j = 0) {
      const s = salida[j], c = combinado[j];
      for (const acc of ACCIONES) s[acc] = c[acc];
      return s;
    },
    botonTactil,
    /** Quita todos los listeners (al salir de una escena o del juego). */
    destruir() {
      activo = false;
      if (raf) cancelAnimationFrame(raf);
      removeEventListener('keydown', alBajarTecla);
      removeEventListener('keyup', alSoltarTecla);
      removeEventListener('blur', soltarTodo);
      document.removeEventListener('visibilitychange', alOcultar);
      removeEventListener('pointerdown', alPuntero);
      removeEventListener('gamepadconnected', arrancarSondeo);
    },
  };
}

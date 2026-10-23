// Botón de pantalla completa común a los juegos (spec 005, HU-7).
// No todos los navegadores la tienen (Safari en iPhone no): si no, el botón se queda oculto.
// La tecla F hace lo mismo que el botón.

const ICONO_ENTRAR = 'M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5';
const ICONO_SALIR = 'M6 1v5H1M15 6h-5V1M10 15v-5h5M1 10h5v5';

/**
 * Convierte `boton` en el interruptor de pantalla completa.
 * @param {HTMLButtonElement} boton
 * @param {{ alCambiar?: (activa: boolean) => void }} [o] aviso al entrar o salir (p. ej. para reescalar)
 * @returns {{ disponible: boolean, activa(): boolean }}
 */
export function botonPantallaCompleta(boton, { alCambiar } = {}) {
  const raiz = document.documentElement;
  const pedir = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
  const salir = document.exitFullscreen || document.webkitExitFullscreen;
  const activa = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const disponible = !!(pedir && salir);
  boton.hidden = !disponible;
  if (!disponible) return { disponible, activa };

  boton.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style="display:block"><path fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  const icono = boton.querySelector('path');
  function pintar() {
    const si = activa();
    icono.setAttribute('d', si ? ICONO_SALIR : ICONO_ENTRAR);
    boton.setAttribute('aria-label', si ? 'Salir de pantalla completa' : 'Pantalla completa');
    boton.setAttribute('aria-pressed', String(si));
  }
  function alternar() {
    try {
      const r = activa() ? salir.call(document) : pedir.call(raiz, { navigationUI: 'hide' });
      if (r && r.catch) r.catch(() => {});
    } catch {}
  }
  boton.addEventListener('click', (e) => { e.stopPropagation(); boton.blur(); alternar(); });
  for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) {
    document.addEventListener(ev, () => { pintar(); if (alCambiar) alCambiar(activa()); });
  }
  addEventListener('keydown', (e) => {
    if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target && e.target.tagName === 'INPUT')) alternar();
  });
  pintar();
  return { disponible, activa };
}

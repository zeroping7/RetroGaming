// Orientación de cada juego (HU-10, plan de 000 §7, D-007).
// Cada juego declara `orientacion` en juegos/registro.js. Si el móvil está girado al revés,
// una capa "Gira el móvil" tapa la pantalla. En PC (ratón) no se muestra nunca: allí la
// ventana horizontal es lo normal.

import { JUEGOS } from '../../juegos/registro.js';

/**
 * @param {string} idJuego id del registro
 * @param {{ alCambiar?: (correcta: boolean) => void }} [o] aviso al cambiar (para pausar, T020)
 * @returns {{ correcta(): boolean, destruir(): void }}
 */
export function vigilarOrientacion(idJuego, { alCambiar } = {}) {
  const quiere = JUEGOS.find((j) => j.id === idJuego)?.orientacion || 'libre';
  const tactil = matchMedia('(pointer: coarse)');
  const horizontal = matchMedia('(orientation: landscape)');

  const capa = document.createElement('div');
  capa.setAttribute('role', 'alert');
  capa.hidden = true;
  capa.innerHTML = '<div class="gira-movil"></div><p>GIRA EL MÓVIL</p>';
  const estilo = document.createElement('style');
  estilo.textContent = `
    .capa-orientacion{position:fixed;inset:0;z-index:1000;display:flex;flex-direction:column;align-items:center;
      justify-content:center;gap:22px;background:#0d0b1f;color:#f4f1ff;font-family:"Press Start 2P",ui-monospace,monospace}
    .capa-orientacion[hidden]{display:none}
    .capa-orientacion p{font-size:12px;margin:0;letter-spacing:.1em}
    .gira-movil{width:44px;height:76px;border:4px solid #ffcf3a;border-radius:9px;
      animation:gira-movil 1.6s ease-in-out infinite;transform:rotate(${quiere === 'vertical' ? 90 : 0}deg)}
    @keyframes gira-movil{0%,25%{transform:rotate(${quiere === 'vertical' ? 90 : 0}deg)}
      60%,100%{transform:rotate(${quiere === 'vertical' ? 0 : 90}deg)}}
    @media (prefers-reduced-motion:reduce){.gira-movil{animation:none}}`;
  capa.className = 'capa-orientacion';
  document.head.appendChild(estilo);
  document.body.appendChild(capa);

  let correcta = true;
  function comprobar() {
    const ok = quiere === 'libre' || !tactil.matches || (quiere === 'horizontal') === horizontal.matches;
    capa.hidden = ok;
    if (ok !== correcta) { correcta = ok; if (alCambiar) alCambiar(ok); }
  }
  horizontal.addEventListener('change', comprobar);
  tactil.addEventListener('change', comprobar);
  comprobar();

  return {
    correcta: () => correcta,
    destruir() {
      horizontal.removeEventListener('change', comprobar);
      tactil.removeEventListener('change', comprobar);
      capa.remove(); estilo.remove();
    },
  };
}

// Pantalla de pausa común (HU-7 de 000-plataforma, plan §8).
// Solo es la capa visual con «Continuar» y «Salir»; cada juego decide cuándo pausar
// y, en online, cómo avisar al otro jugador.

/**
 * @param {{ alContinuar: () => void, alSalir: () => void }} o
 * @returns {{ mostrar(titulo: string, detalle?: string, puedeContinuar?: boolean): void, ocultar(): void, readonly visible: boolean }}
 */
export function crearPausa({ alContinuar, alSalir }) {
  const estilo = document.createElement('style');
  estilo.textContent = `
    .capa-pausa{position:fixed;inset:0;z-index:900;display:flex;align-items:center;justify-content:center;
      background:rgba(13,11,31,.78);font-family:"Press Start 2P",ui-monospace,monospace;color:#f4f1ff}
    .capa-pausa[hidden]{display:none}
    .capa-pausa .panel{display:flex;flex-direction:column;align-items:center;gap:14px;padding:24px 20px;
      background:#1a1640;border:3px solid #ffcf3a;border-radius:12px;max-width:min(320px,90vw)}
    .capa-pausa h2{margin:0;font-size:18px;color:#ffcf3a;letter-spacing:.1em}
    .capa-pausa p{margin:0;font-size:9px;line-height:1.7;color:#a59fd6;text-align:center}
    .capa-pausa button{font:inherit;font-size:11px;padding:14px 18px;border:0;border-radius:10px;cursor:pointer;width:220px;max-width:100%}
    .capa-pausa .seguir{background:#2ec4b6;color:#03201d}
    .capa-pausa .salir{background:#0d0b1f;color:#a59fd6;border:2px solid #3a2f86}
    .capa-pausa button:focus-visible{outline:3px solid #ffcf3a;outline-offset:2px}`;
  document.head.appendChild(estilo);

  const capa = document.createElement('div');
  capa.className = 'capa-pausa';
  capa.hidden = true;
  capa.setAttribute('role', 'dialog');
  capa.setAttribute('aria-modal', 'true');
  capa.innerHTML = '<div class="panel"><h2></h2><p></p><button class="seguir">CONTINUAR</button><button class="salir">SALIR</button></div>';
  document.body.appendChild(capa);
  const [titulo, detalle] = [capa.querySelector('h2'), capa.querySelector('p')];
  const [seguir, salir] = [capa.querySelector('.seguir'), capa.querySelector('.salir')];
  // que los toques en la capa no lleguen al juego (disparos, botones táctiles)
  for (const ev of ['pointerdown', 'touchstart']) capa.addEventListener(ev, (e) => e.stopPropagation());
  seguir.onclick = () => alContinuar();
  salir.onclick = () => alSalir();

  return {
    mostrar(t, d = '', puedeContinuar = true) {
      titulo.textContent = t;
      detalle.textContent = d;
      detalle.hidden = !d;
      seguir.hidden = !puedeContinuar;
      const nueva = capa.hidden;
      capa.hidden = false;
      if (nueva) (puedeContinuar ? seguir : salir).focus({ preventScroll: true });
    },
    ocultar() {
      if (capa.contains(document.activeElement)) document.activeElement.blur();
      capa.hidden = true;
    },
    get visible() { return !capa.hidden; },
  };
}

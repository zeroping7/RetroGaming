# Tareas: Música y ambientes (piezas comunes)

> **Plan:** `specs/plataforma/007-musica-y-ambientes/plan.md`
> Orden global: 007 → 008 (Revienta) → 009 (Lanza).

- [x] T001 — Modos de sonido y canal de música
  - Archivos: `src/audio/sintetizador.js`, `index.html` de los dos juegos
  - Hecho cuando: el botón cambia entre 🔊 todo, 🎵̸ solo efectos y 🔇 silencio; se recuerda entre juegos y al recargar; se respeta la clave antigua `rg-silencio`.
  - Probar en el móvil: cambiar de modo, recargar y entrar en el otro juego.
- [x] T002 — Secuenciador `musica.js` + canción de prueba
  - Archivos: `src/audio/musica.js`, `docs/decisiones.md` (D-015), `sw.js`
  - Hecho cuando: suena en bucle sin cortes; tempo e intensidad cambian sin reiniciar; se para con la pestaña oculta.
  - Probar en el móvil: en el menú de Revienta Burbujas suena un tema provisional.
- [x] T003 — Partículas de ambiente `particulas.js`
  - Archivos: `src/arte/particulas.js`, `sw.js`
  - Hecho cuando: hay emisores configurables (subir, caer, flotar y cruzar) con arrays fijos, listos para los dos juegos.
  - Probar en el móvil: se verá en T011 de 008.

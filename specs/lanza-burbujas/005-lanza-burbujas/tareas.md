# Tareas: Lanza Burbujas

> **Plan:** `specs/lanza-burbujas/005-lanza-burbujas/plan.md`
> El usuario pidió el juego completo de una vez: Claude hace todas las tareas seguidas y las prueba en un navegador antes de publicarlas.

## Fase 0 — Esqueleto
- [x] T001 — Carpeta del juego, alta en el menú, portada e icono
  - Archivos: `juegos/lanza-burbujas/index.html`, `portada.svg`, `icono.png`, `juegos/registro.js`, `sw.js`
  - Hecho cuando: el cartucho aparece en el menú; al entrar se ve el menú del juego y "◀ MENÚ RETROGAMING" vuelve
- [x] T002 — `sim.js` + `tests.html`
  - Hecho cuando: `tests.html` muestra todas las pruebas en verde

## Fase 1 — 1 jugador
- [x] T010 — Rejilla, cañón, disparo con rebote y pegado
- [x] T011 — Grupos de 3, caídas y puntos
- [x] T012 — Techo, prisa y derrota
- [x] T013 — 30 niveles en 6 mundos, limpiar y pasar de nivel
- [x] T014 — «¿Continuar?», récords e iniciales
- [x] T015 — Controles táctiles, teclado y mando; pausa

## Fase 2 — Versus
- [x] T020 — Dos tableros, basura y rondas al mejor de 3
- [x] T021 — Rivales CPU (8) y pantalla de campeón
- [x] T022 — `codificar` / `decodificar` + pruebas
- [x] T023 — Crear partida, unirse con código y enlace
- [x] T024 — Predicción del cañón y del disparo del invitado
- [x] T025 — Revancha, corte de conexión y vuelta
- [x] T026 — `?debug=1` y `?lag=150&loss=5`

## Fase 3 — Pulido
- [x] T030 — Gatos en pixel art, fondos de los mundos y efectos
- [x] T031 — Sonido
- [x] T032 — Revisión de rendimiento y tráfico (R1, R2)

## Cómo probar en el móvil
1. Abre https://zeroping7.github.io/RetroGaming/ en horizontal y elige **Lanza Burbujas**.
2. **NIVELES:** limpia el nivel 1; deja que el techo baje y pierde para ver «¿continuar?».
3. **VS CPU:** juega contra el rival 1; haz caer burbujas y mira cómo le llega la basura.
4. **Online:** «CREAR PARTIDA» en un móvil, comparte el enlace y entra desde el otro.
5. Atajos de prueba: `?nivel=26`, `?rival=8`, `?debug=1`, `?lag=150&loss=5`.

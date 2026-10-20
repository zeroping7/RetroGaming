# Tareas: Plataforma

> **Plan:** `specs/000-plataforma/plan.md`

## Fase 0 — Menú (hecho en v0.2.0)
- [x] T001 — Mover Revienta Burbujas a `juegos/revienta-burbujas/` con botón de volver
- [x] T002 — Registro de juegos y portada del cartucho
- [x] T003 — Menú tipo consola: estante, ranura, ficha, JUGAR
- [x] T004 — Táctil, teclado y mando en el menú; ayuda según el control usado
- [x] T005 — App instalable como "RetroGaming" (manifest, iconos, `sw.js`)

## Fase 1 — Piezas compartidas
- [ ] T010 — `src/input/`: acciones abstractas (teclado, mando, táctil) como módulo
  - Hecho cuando: el menú principal lo usa en lugar de su código propio
- [ ] T011 — `src/net/`: sala MQTT compartida extraída de Revienta Burbujas
  - Hecho cuando: Revienta Burbujas funciona online igual que antes usando el módulo
- [ ] T012 — `?debug=1` y `?lag=&loss=` en `src/net/` (Q1, Q2)
- [ ] T013 — Navegación con mando en el menú de Revienta Burbujas (C3)

## Fase 2 — Según respuestas de la spec
- [ ] T020 — Pausa común (HU-7)
- [ ] T021 — Aviso de código de otro juego (HU-5)
- [ ] T022 — Enlace para compartir la partida (si se aprueba)

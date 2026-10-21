# Tareas: Plataforma

> **Plan:** `specs/000-plataforma/plan.md`

## Fase 0 — Menú (hecho en v0.2.0)
- [x] T001 — Mover Revienta Burbujas a `juegos/revienta-burbujas/` con botón de volver
- [x] T002 — Registro de juegos y portada del cartucho
- [x] T003 — Menú tipo consola: estante, ranura, ficha, JUGAR
- [x] T004 — Táctil, teclado y mando en el menú; ayuda según el control usado
- [x] T005 — App instalable como "RetroGaming" (manifest, iconos, `sw.js`)

## Fase 1 — Piezas compartidas
- [x] T010 — `src/input/`: acciones abstractas (teclado, mando, táctil) como módulo
  - Hecho cuando: el menú principal lo usa en lugar de su código propio *(v0.3.0)*
- [x] T011 — `src/net/sala.js`: sala MQTT compartida extraída de Revienta Burbujas *(v0.3.4)*
  - Hecho cuando: Revienta Burbujas funciona online igual que antes usando el módulo; anfitrión e invitado ven el retardo en ms
  - Probar en el móvil: crear partida en un móvil, unirse desde otro y jugar un nivel
- [x] T014 — WebRTC directo con respaldo MQTT (plan §4, D-009) *(v0.4.0)*
  - Hecho cuando: en la misma WiFi el HUD muestra `DIRECTA` y el retardo baja claramente respecto a MQTT; si se fuerza el fallo, sigue por MQTT
  - Probar en el móvil: partida entre los dos móviles en casa, comparar los ms con los de MQTT
- [ ] T012 — `?debug=1` y `?lag=&loss=` en `src/net/` (Q1, Q2)
- [ ] T013 — Navegación con mando en el menú de Revienta Burbujas (C3)

## Fase 2 — Según respuestas de la spec
- [ ] T020 — Pausa común (HU-7)
- [ ] T021 — Aviso de código de otro juego (HU-5)
- [ ] T022 — Enlace para compartir la partida (HU-9, plan §6; tras T011)
  - Hecho cuando: el invitado entra en una partida de Revienta Burbujas tocando el enlace, sin escribir el código.
- [ ] T023 — Orientación por juego (HU-10, plan §7)
  - Hecho cuando: en la app instalada el menú gira a horizontal y Revienta Burbujas en horizontal muestra "Gira el móvil".

# Tareas: <Nombre>

> **Plan:** `specs/<juego>/NNN-<id>/plan.md`
> Reglas: cada tarea cabe en una sesión con Claude, deja todo funcionando y se prueba desde el móvil.
> Orden fijo: primero 1 jugador jugable en greybox, después 2 jugadores y online, al final pulido.

Formato de cada tarea:
```
- [ ] TNNN — Título
  - Archivos:
  - Hecho cuando:
  - Probar en el móvil:
```

## Fase 0 — Esqueleto
- [ ] T001 — Carpeta del juego, alta en el menú y portada provisional
  - Archivos: `juegos/<id>/index.html`, `juegos/<id>/portada.svg`, `juegos/registro.js`, `sw.js`
  - Hecho cuando: el cartucho aparece en el menú; al entrar se ve el menú del juego y "◀ Menú RetroGaming" vuelve
  - Probar en el móvil: abrir la web, deslizar hasta el cartucho, entrar y volver
- [ ] T002 — `sim.js` mínimo + `tests.html`
  - Hecho cuando: `tests.html` muestra todas las pruebas en verde

## Fase 1 — 1 jugador jugable (greybox)
- [ ] T010 — Movimiento del jugador
- [ ] T011 — Colisiones con el escenario
- [ ] T012 — Entidad principal (enemigo / obstáculo / pieza)
- [ ] T013 — Victoria y derrota
- [ ] T014 — HUD y récord
- [ ] T015 — Controles táctiles y mando verificados

## Fase 2 — 2 jugadores y online
- [ ] T020 — Segundo jugador en el mismo dispositivo
- [ ] T021 — `codificar` / `decodificar` de la instantánea + pruebas
- [ ] T022 — Crear partida y unirse con código
- [ ] T023 — Invitado dibuja suavizando (nivel B)
- [ ] T024 — Predicción local del invitado (nivel C, si aplica)
- [ ] T025 — Momentos clave que no se pierden (muerte, fin de nivel)
- [ ] T026 — Corte de conexión y vuelta
- [ ] T027 — Prueba con `?lag=150&loss=5`: sigue siendo jugable

## Fase 3 — Pulido
- [ ] T030 — Arte definitivo y portada final
- [ ] T031 — Sonido
- [ ] T032 — Ajuste de dificultad
- [ ] T033 — Revisión de rendimiento con `?debug=1` (R1, R2)

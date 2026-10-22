# Tareas: Armas y objetos de Revienta Burbujas

> **Plan:** `specs/revienta-burbujas/002-armas/plan.md`
> Reglas: cada tarea cabe en una sesión con Claude, deja todo funcionando (también el online) y se prueba desde el móvil.
> Cada tarea que añade algo visible lo incluye en la instantánea online y en la predicción del invitado, y pone al día la documentación que toque (D-006, spec 001, `docs/arquitectura.md`).

## Fase 0 — Separar sin cambiar nada
- [x] T001 — `sim.js`, `render.js` y `tests.html` *(v0.5.0)*
  - Archivos: `juegos/revienta-burbujas/index.html`, `sim.js`, `render.js`, `tests.html`, `sw.js`
  - Hecho cuando: el juego se ve y se juega exactamente igual (1J, 2J y online) y `tests.html` sale en verde (partir burbujas, puntos, vidas, codificar/decodificar)
  - Probar en el móvil: una partida de 1 jugador, una de 2 en el mismo móvil y una online; abrir `juegos/revienta-burbujas/tests.html`
- [x] T002 — Paso fijo de 60 ticks/s (A2) *(v0.5.1)*
  - Hecho cuando: la velocidad del juego es la misma en cualquier móvil, aunque vaya a pocos FPS
  - Probar en el móvil: jugar un nivel; debe sentirse igual que antes

## Fase 1 — Objetos y armas
- [x] T010 — Objetos que caen *(v0.6.0)*
  - Hecho cuando: 1 de cada 8 burbujas deja un objeto (máx. 2); cae, espera 10 s en el suelo (parpadea los 2 últimos) y desaparece; al recogerlo da +100 (su efecto llega en las tareas siguientes)
  - Probar en el móvil: jugar hasta que caiga uno; cogerlo y dejar otro sin coger
- [x] T011 — Arpón doble, espera entre disparos y perder el arma al morir *(v0.6.1)*
  - Hecho cuando: con el doble hay hasta 2 arpones a la vez; al morir se vuelve al normal; online el invitado ve sus dos arpones al instante
- [x] T012 — Arpón fijo *(v0.7.0)*
  - Hecho cuando: al llegar al techo se queda clavado 3 s (o hasta tocar una burbuja) y revienta lo que lo toque; online, también al instante para el invitado
- [x] T013 — Arpón triple *(v0.7.0)*
  - Hecho cuando: cada disparo saca 3 líneas separadas 24 px y no se dispara otra vez hasta que no queda ninguna; online, también al instante para el invitado
- [x] T014 — Velocidad y escudo *(v0.7.0)*
  - Hecho cuando: con velocidad el arpón sube más rápido 10 s; el escudo aguanta un golpe y luego da 1 s de parpadeo sin daño
- [x] T015 — Dinamita y reloj *(v0.7.0)*
  - Hecho cuando: la dinamita deja todas las burbujas en tamaño pequeño; el reloj las congela 5 s, siguen haciendo daño y un disparo las sigue rompiendo
- [x] T016 — HUD *(v0.7.0)*
  - Hecho cuando: se ve el arma de cada jugador y la cuenta del reloj cuando está activo

## Fase 2 — Afinar
> T012–T016 se hicieron juntas a petición del usuario; se prueban todas y después se ajustan valores aquí.
> Modo de prueba: `juegos/revienta-burbujas/?objetos=todos` (o `?objetos=fijo,reloj`) hace que caiga siempre un objeto, de esos tipos y por turnos.
- [ ] T020 — Ajustes tras probar (velocidades, tiempos, probabilidades, aspecto)

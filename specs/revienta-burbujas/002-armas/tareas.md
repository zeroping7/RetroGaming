# Tareas: Armas y objetos de Revienta Burbujas

> **Plan:** `specs/revienta-burbujas/002-armas/plan.md`
> Reglas: cada tarea cabe en una sesión con Claude, deja todo funcionando (también el online) y se prueba desde el móvil.
> Cada tarea que añade algo visible lo incluye en la instantánea online, para que el invitado lo vea desde el primer día.

## Fase 0 — Separar sin cambiar nada
- [ ] T001 — `sim.js`, `render.js` y `tests.html`
  - Archivos: `juegos/revienta-burbujas/index.html`, `sim.js`, `render.js`, `tests.html`, `sw.js`
  - Hecho cuando: el juego se ve y se juega exactamente igual (1J, 2J y online) y `tests.html` sale en verde (partir burbujas, puntos, vidas, codificar/decodificar)
  - Probar en el móvil: una partida de 1 jugador, una de 2 en el mismo móvil y una online; abrir `juegos/revienta-burbujas/tests.html`
- [ ] T002 — Paso fijo de 60 ticks/s (A2)
  - Hecho cuando: la velocidad del juego es la misma en cualquier móvil, aunque vaya a pocos FPS
  - Probar en el móvil: jugar un nivel; debe sentirse igual que antes

## Fase 1 — Objetos y armas
- [ ] T010 — Objetos que caen
  - Hecho cuando: 1 de cada 8 burbujas deja un objeto (máx. 2); cae, espera 10 s en el suelo (parpadea los 2 últimos) y desaparece; al recogerlo da +100 (su efecto llega en las tareas siguientes)
  - Probar en el móvil: jugar hasta que caiga uno; cogerlo y dejar otro sin coger
- [ ] T011 — Arpón doble, espera entre disparos y perder el arma al morir
  - Hecho cuando: con el doble hay hasta 2 arpones a la vez; al morir se vuelve al normal
- [ ] T012 — Arpón fijo
  - Hecho cuando: al llegar al techo se queda clavado 3 s (o hasta tocar una burbuja) y revienta lo que lo toque
- [ ] T013 — Arpón triple
  - Hecho cuando: cada disparo saca 3 líneas separadas 24 px y no se dispara otra vez hasta que no queda ninguna
- [ ] T014 — Velocidad y escudo
  - Hecho cuando: con velocidad el arpón sube más rápido 10 s; el escudo aguanta un golpe y luego da 1 s de parpadeo sin daño
- [ ] T015 — Dinamita y reloj
  - Hecho cuando: la dinamita deja todas las burbujas en tamaño pequeño; el reloj las congela 5 s, siguen haciendo daño y un disparo las sigue rompiendo
- [ ] T016 — HUD
  - Hecho cuando: se ve el arma de cada jugador y la cuenta del reloj cuando está activo

## Fase 2 — Dos jugadores y online
- [ ] T020 — Predicción del invitado con todas las armas
  - Hecho cuando: online, el invitado dispara al instante con su arma (doble, fijo, triple) sin saltos raros, y los dos veis los mismos objetos
  - Probar en el móvil: partida online, coger cada arma con el invitado
- [ ] T021 — Cierre
  - Hecho cuando: D-006 actualizada (A1, A2 y Q3 cumplidas), spec 001 con sus preguntas abiertas cerradas y `docs/arquitectura.md` al día

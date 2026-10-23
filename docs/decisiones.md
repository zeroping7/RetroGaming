# Registro de decisiones

Una entrada por decisión. Nunca se borran; si cambian, se añade una nueva que la sustituye.

```
## D-NNN — Título
- Fecha:
- Estado: Aceptada | Sustituida por D-NNN
- Contexto: por qué hubo que decidir
- Decisión:
- Alternativas descartadas:
- Consecuencias:
```

---

## D-001 — Phaser 3.90 sin build para juegos nuevos
- Fecha: 2026-10-20
- Estado: Aceptada
- Contexto: desarrollo íntegro desde el móvil; no hay terminal para compilar.
- Decisión: Phaser 3.90.0 por CDN + módulos ES nativos.
- Alternativas descartadas: Phaser 4 (estable desde abril de 2026, pero con menos ejemplos y renderizador recién reescrito); TypeScript + Vite (requiere build); Three.js (3D, más pesado en móvil).
- Consecuencias: sin tipos; usar JSDoc en `sim.js` para documentar el estado.

## D-002 — WebRTC directo con PeerJS
- Fecha: 2026-10-20
- Estado: Sustituida por D-004
- Decisión inicial: conexión directa entre navegadores con PeerJS.
- Motivo del cambio: la primera versión de Revienta Burbujas la usó y no conectaba entre móviles (commit `938d2f8`).

## D-003 — Router por hash con un único Phaser.Game
- Fecha: 2026-10-20
- Estado: Sustituida por D-005

## D-004 — Online por relé MQTT con varios servidores públicos
- Fecha: 2026-10-20
- Estado: Aceptada
- Contexto: GitHub Pages es estático; la conexión directa falló con datos móviles.
- Decisión: MQTT.js 5.10.1 por WebSocket seguro (puerto 443 cuando se puede) contra shiftr.io, HiveMQ y EMQX a la vez; anfitrión autoritativo; duplicados descartados por secuencia.
- Alternativas descartadas: PeerJS/WebRTC (no conecta entre redes móviles sin TURN); Firebase/Supabase (cuenta, claves y límites).
- Consecuencias: algo más de retardo que una conexión directa, compensado con predicción (nivel C). Los servidores públicos no garantizan nada y los temas son públicos: validar todo lo que llega. Si algún día hace falta menos retardo, probar WebRTC con TURN.

## D-005 — Cada juego es una página independiente
- Fecha: 2026-10-20
- Estado: Aceptada
- Contexto: Revienta Burbujas ya era una página completa con canvas propio; los juegos futuros pueden usar Phaser o no.
- Decisión: menú en `index.html`; cada juego en `juegos/<id>/index.html`; el menú navega a él y el juego vuelve con `../../`.
- Alternativas descartadas: una sola página con router por hash (obliga a todos los juegos a compartir motor y a limpiar memoria a mano).
- Consecuencias: el código común (entradas, red) se comparte con módulos de `src/`, no con variables globales.

## D-006 — Excepciones de Revienta Burbujas
- Fecha: 2026-10-20 · Actualizada: 2026-10-21 (T001 de 002)
- Estado: Aceptada
- Contexto: el juego es anterior a la constitución y funciona.
- Decisión: sigue con canvas 2D sin Phaser.
- Ya resuelto: los menús se navegan con mando (C3, T013 de 000, v0.12.0); la red está en `src/net/` (T011 y T014 de 000) y la lógica en `sim.js`, el dibujo en `render.js` y las pruebas en `tests.html` (A1 y Q3, T001 de 002) y el paso fijo de 60 ticks/s (A2, T002 de 002).
- Consecuencias: los juegos nuevos no pueden usar esta excepción.

## D-007 — Cada juego elige su orientación
- Fecha: 2026-10-21
- Estado: Aceptada
- Contexto: la app instalada estaba fijada en vertical, pero plataformas y carreras se juegan mejor en horizontal.
- Decisión: el manifest deja de fijar la orientación; cada juego la declara en su spec y en `juegos/registro.js`, y muestra "Gira el móvil" si no coincide.
- Alternativas descartadas: todo vertical (juegos de acción estrechos); todo horizontal (obliga a girar siempre, también en puzzles); `screen.orientation.lock()` (solo en pantalla completa y no en iOS).
- Consecuencias: cada juego debe comprobar la orientación al cargar y al girar (plan de 000, §7).

## D-008 — Enlace para unirse con `?sala=`
- Fecha: 2026-10-21
- Estado: Aceptada
- Contexto: escribir el código es incómodo; se decide poder compartir un enlace.
- Decisión: `juegos/<id>/?sala=CODIGO`, compartido con `navigator.share` (o copiado al portapapeles). El código sigue existiendo.
- Alternativas descartadas: código en el hash `#` (menos claro); enlace al menú principal (un paso más para el invitado).
- Consecuencias: la lógica vive en `src/net/`, así que llega después de T011.

## D-009 — WebRTC directo con STUN público para el online
- Fecha: 2026-10-21
- Estado: Aceptada
- Contexto: el online por MQTT (D-004) tiene lag: los mensajes van a servidores públicos lejanos y viajan por TCP, así que un paquete perdido frena a todos los siguientes. WebRTC falló antes (D-002) porque PeerJS dependía de su propio servidor y no había TURN.
- Decisión: datos de juego por WebRTC DataChannel no fiable y sin orden (como UDP), con STUN público y gratuito (Google y Cloudflare), sin cuenta ni servidor. MQTT queda para encontrarse con el código (señalización) y como respaldo si WebRTC no conecta. Prioridad: que vaya perfecto en la misma WiFi.
- Alternativas descartadas por ahora: TURN de Cloudflare (1000 GB gratis al mes, pero pide tarjeta; el Worker ya está preparado en `servidor/turn/worker.js` para cuando haya muchos jugadores); Metered (plan gratis de 500 MB al mes); ExpressTURN (credenciales fijas visibles en el repo).
- Consecuencias: con datos móviles a veces no habrá conexión directa y se jugará por MQTT como ahora. Los servidores ICE salen de una única función en `src/net/`, así que añadir TURN más adelante no toca los juegos. No incumple P2 mientras no se use el Worker.

## D-010 — Specs agrupadas por juego
- Fecha: 2026-10-21
- Estado: Aceptada
- Contexto: con varios juegos y ampliaciones, una lista plana de `specs/NNN-*` mezclaría las de unos y otros.
- Decisión: `specs/<id-juego>/NNN-nombre/` (y `specs/plataforma/` para lo común). Cada ampliación de un juego es una spec nueva dentro de su carpeta; la spec original describe el juego tal como se hizo. La numeración NNN sigue siendo global.
- Alternativas descartadas: ampliar la spec original (mezcla lo hecho con lo pendiente en una sola carpeta de tareas); numeración por juego (dos "T011 de 001" posibles).
- Consecuencias: el código ya estaba en `juegos/<id>/`; ahora las specs siguen el mismo orden.

## D-011 — Sonido generado con Web Audio
- Fecha: 2026-10-22
- Estado: Aceptada
- Contexto: Revienta Burbujas necesitaba efectos de sonido (spec 003) y el proyecto no usa build ni assets con licencia dudosa (AR2).
- Decisión: todos los sonidos se sintetizan en el navegador con Web Audio (`src/audio/sintetizador.js`, común a los juegos). Cada juego define sus recetas; `sim.js` solo anota eventos (`st.eventos`) y la página los hace sonar. Silencio común guardado en `rg-silencio`.
- Alternativas descartadas: archivos de audio (pesan, hay que cachearlos y vigilar licencias); librerías como Howler o jsfxr (dependencia más para algo pequeño).
- Consecuencias: sonido retro «de chip», sin música por ahora. En online los eventos viajan en la instantánea (campo `e`).

## D-012 — Récord con «continuar»: el mejor tramo de la partida
- Fecha: 2026-10-23
- Estado: Aceptada
- Contexto: continuar pone los puntos a 0 (spec 004, HU-9). Si el récord se apuntara con los puntos al acabar, seguir jugando haría perder la puntuación buena.
- Decisión: `sim.js` guarda en `st.mejor` lo mejor que se llegó a tener antes de cada «¿continuar?» (puntos y fase), y eso es lo que se ofrece para la tabla al final. Va en la instantánea (`mp`, `mf`) para que el invitado guarde el suyo.
- Alternativas descartadas: pedir las iniciales en cada «¿continuar?» (corta el ritmo y llena la tabla de la misma partida); sumar todos los tramos (premiaría continuar sin límite).
- Consecuencias: una partida da como mucho una entrada en la tabla.

## D-013 — Lanza Burbujas: Phaser solo dibuja; menús en HTML
- Fecha: 2026-10-23
- Estado: Aceptada
- Contexto: primer juego nuevo después de la constitución (P3: Phaser 3.90 para juegos nuevos). Los menús de Revienta Burbujas ya están hechos en HTML y se navegan con mando (C3).
- Decisión: Phaser dibuja la partida (`render.js`), sin su sistema de entradas ni de sonido: las acciones salen de `src/input/entradas.js`, el sonido de `src/audio/` y los menús, la pausa y los récords son HTML con el mismo estilo que Revienta Burbujas. El juego se dibuja a 1280×720 con la cámara ×2 sobre coordenadas 640×360, y los textos a doble tamaño con escala 0,5, para que se vean nítidos al escalar con WebGL y con canvas. `?canvas=1` fuerza el renderizador canvas (móviles con problemas de gráficos y pruebas automáticas). El paso fijo usa el tiempo real entre fotogramas, no el de Phaser (que lo suaviza y, en un móvil lento, haría ir el juego a cámara lenta).
- Alternativas descartadas: escenas y menús de Phaser (habría que rehacer la navegación con mando y la pausa común); canvas 2D sin Phaser como Revienta Burbujas (lo impide P3 sin excepción).
- Consecuencias: Phaser (1,2 MB) solo se descarga al entrar en el juego (R4). Sin teñido en canvas: lo que se pierde, además de gris, se dibuja medio transparente.

## D-014 — `?debug=1` y `?lag=&loss=` (constitución Q1 y Q2)
- Fecha: 2026-10-23
- Estado: Aceptada
- Contexto: Q1 y Q2 estaban en la constitución pero ningún juego los tenía.
- Decisión: el retardo y la pérdida simulados viven en `src/net/sala.js` (sirven a todos los juegos y el retardo medido los incluye); la sala cuenta los bytes enviados y recibidos. Cada juego pinta su `?debug=1`; Lanza Burbujas es el primero (FPS, tick, rol, ms, KB/s y vía).
- Alternativas descartadas: simularlo en cada juego envolviendo la sala (el retardo medido no lo vería).
- Consecuencias: Revienta Burbujas ya puede usar `?lag=&loss=`; le falta su `?debug=1`.

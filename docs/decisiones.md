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
- Fecha: 2026-10-20
- Estado: Aceptada
- Contexto: el juego es anterior a la constitución y funciona.
- Decisión: se mantiene en un solo `index.html` con canvas 2D (sin Phaser), lógica y dibujo juntos (incumple A1, A2 y Q3) y menú sin navegación por mando (incumple C3).
- Consecuencias: cuando haya que cambiarlo a fondo, se extraen sus entradas y su red a `src/input/` y `src/net/` (tareas en `specs/000-plataforma/tareas.md`).

## D-007 — Cada juego elige su orientación
- Fecha: 2026-10-21
- Estado: Aceptada
- Contexto: la app instalada estaba fijada en vertical, pero plataformas y carreras se juegan mejor en horizontal.
- Decisión: el manifest deja de fijar la orientación; cada juego la declara en su spec y en `juegos/registro.js`, y muestra "Gira el móvil" si no coincide.
- Alternativas descartadas: todo vertical (juegos de acción estrechos); todo horizontal (obliga a girar siempre, también en puzzles); `screen.orientation.lock()` (solo en pantalla completa y no en iOS).
- Consecuencias: cada juego debe comprobar la orientación al cargar y al girar (plan de 000, §7).

## D-008 — Enlace para unirse con `?sala=`
- Fecha: 2026-10-21
- Estado: Propuesta (se acepta al aprobar el plan de 000, §6)
- Contexto: escribir el código es incómodo; se decide poder compartir un enlace.
- Decisión: `juegos/<id>/?sala=CODIGO`, compartido con `navigator.share` (o copiado al portapapeles). El código sigue existiendo.
- Alternativas descartadas: código en el hash `#` (menos claro); enlace al menú principal (un paso más para el invitado).
- Consecuencias: la lógica vive en `src/net/`, así que llega después de T011.

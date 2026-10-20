# Constitución del proyecto

Reglas no negociables. Cualquier spec o plan que las incumpla debe justificarlo en `docs/decisiones.md`.
*Revienta Burbujas es anterior a esta constitución; sus excepciones están en D-006.*

## 1. Plataforma
- **P1 — Sin build.** HTML + CSS + JavaScript (módulos ES). Nada de npm, bundlers ni compilación. Lo que está en el repo es lo que se sirve.
- **P2 — GitHub Pages.** Sitio estático servido desde la rama `main` (raíz). Sin backend propio.
- **P3 — Librerías por CDN con versión fijada.** Nunca `@latest`.
  - Phaser `3.90.0` (juegos nuevos) → `https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js`
  - MQTT.js `5.10.1` (online) → `https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js`
- **P4 — Navegadores objetivo:** Chrome Android (prioridad 1), Chrome/Firefox/Edge escritorio, Safari iOS (mejor esfuerzo).
- **P5 — App instalable.** `sw.js` y `manifest.webmanifest` cubren todo el sitio; cada juego nuevo añade sus archivos a `FILES`.

## 2. Arquitectura de juego
- **A1 — Simulación separada del dibujo.** La lógica de cada juego (`sim.js`) es JavaScript puro: recibe estado + entradas y devuelve el nuevo estado. No toca Phaser, el canvas ni el DOM.
- **A2 — Paso fijo.** La simulación avanza a 60 ticks/s fijos, independientemente de los FPS del dispositivo.
- **A3 — Un jugador = anfitrión sin invitado.** El modo 1 jugador usa el mismo código que el anfitrión del online.
- **A4 — Anfitrión autoritativo.** El anfitrión ejecuta la simulación; el invitado envía entradas y dibuja lo que recibe (más su predicción local).
- **A5 — Entradas abstractas.** La simulación nunca lee teclas, toques o botones: lee acciones (`up`, `down`, `left`, `right`, `a`, `b`, `start`).
- **A6 — Un juego, una carpeta.** Cada juego es una página independiente en `juegos/<id>/`, aparece en el menú vía `juegos/registro.js` y tiene un botón para volver a él.

## 3. Rendimiento ("fluido" medible)
- **R1** — 60 FPS estables en un Android de gama media; nunca por debajo de 50 durante más de 1 s.
- **R2** — Tráfico online ≤ 20 KB/s por dirección.
- **R3** — Online jugable con 150 ms de ida y vuelta y 5 % de pérdida.
- **R4** — Menú interactivo en < 3 s con 4G. Cada juego carga lo suyo al entrar.
- **R5** — Sin crear objetos en el bucle caliente (reutilizar arrays/objetos) para evitar tirones del recolector de basura.

## 4. Controles
- **C1** — Todo juego se puede jugar completo con táctil, teclado y mando (Gamepad API).
- **C2** — Los controles táctiles solo se ven en pantallas táctiles.
- **C3** — Los menús (el principal y los de cada juego) también se navegan con teclado y mando.

## 5. Calidad y depuración
- **Q1** — `?debug=1` muestra FPS, tick, retardo, KB/s y rol (anfitrión/invitado).
- **Q2** — `?lag=100&loss=5` simula retardo (ms) y pérdida (%) para probar el online sin mala conexión real.
- **Q3** — Cada `sim.js` tiene una página `tests.html` que se abre en el navegador y ejecuta pruebas básicas (sin frameworks).
- **Q4** — El pie del menú muestra la versión (`src/version.js`).

## 6. Arte y assets
- **AR1** — Primero greybox (formas y colores planos); el arte llega en la fase de pulido.
- **AR2** — Solo assets propios o con licencia CC0 / compatible, anotada en `docs/creditos.md`.
- **AR3** — Paleta y tipografías comunes: fondo `#0d0b1f`, panel `#1a1640`, J1 `#2ec4b6`, J2 `#ff8fc7`, acento `#ffcf3a`; "Press Start 2P" para títulos y botones, "VT323" para textos largos.

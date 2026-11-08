# Plan técnico: Música y ambientes (piezas comunes)

> **Spec:** `specs/plataforma/007-musica-y-ambientes/spec.md` · **Estado:** En revisión · **Fecha:** 2026-11-08
> El contenido de cada juego (canciones y dibujos) está en los planes de 008 y 009.

## 1. Cumplimiento de la constitución
- [x] A1 `sim.js` no cambia: la música y el fondo se deciden en la página a partir del estado (mundo, fase, tiempo), igual que los efectos (D-011).
- [x] P5 Archivos nuevos añadidos a `FILES` y `CACHE` subido.
- [x] R1/R5 Notas y partículas en arrays creados al principio y reutilizados. Nada de `new` por frame.
- [x] C1/C3 El botón de sonido sigue siendo el mismo (táctil, teclado `M` y mando).
- Excepciones: ninguna. Nueva decisión **D-015** (música por secuenciador propio).

## 2. Archivos
| Archivo | Responsabilidad |
|---|---|
| `src/audio/sintetizador.js` | Añade 3 modos de sonido (`todo` · `efectos` · `silencio`, clave `rg-sonido`; lee la antigua `rg-silencio`), un canal de música con su propio volumen y la pausa al ocultar la pestaña. |
| `src/audio/musica.js` (nuevo) | Secuenciador: toca una canción en bucle, cambia de canción con un fundido corto, ajusta tempo e intensidad sin reiniciar. |
| `src/arte/particulas.js` (nuevo) | Partículas de ambiente sin dibujo: posición, velocidad, vida y vaivén en arrays fijos. Cada juego las pinta a su manera (canvas en Revienta y Phaser en Lanza). |
| `docs/decisiones.md` | D-015. |

## 3. Cómo funciona la música
**Secuenciador con margen («lookahead»):** cada 25 ms un temporizador mira qué notas caen en los próximos 0,1 s y las deja programadas en Web Audio con su hora exacta. Así suena a tiempo aunque el juego dé un tirón. Se parece a meter trabajo en un `Handler` con `postAtTime`: no depende de cuándo te despiertes.

Formato de una canción (texto compacto, fácil de escribir y revisar):
```js
{ bpm: 120, pasos: 16,                 // pasos por compás (semicorcheas)
  voces: {
    melodia: { onda: 'square',   vol: .22, notas: 'E5 . G5 . A5 - - . | ...' },
    bajo:    { onda: 'triangle', vol: .35, notas: 'A2 . . . E2 . . . | ...' },
    acordes: { onda: 'square',   vol: .08, arpegio: true, notas: 'Am . . . F . . . | ...' },
    bateria: { notas: 'k . h . s . h . | ...' },     // k bombo · s caja · h charles (ruido)
  },
  intensa: ['bateria2', 'contra'],     // voces extra que solo suenan con intensidad 1
}
```
- `.` silencio, `-` alarga la nota anterior y `|` separa compases (solo para leer).
- API: `musica.tocar(id, { tempo = 1, intensidad = 0 })` (si ya suena ese `id`, solo ajusta tempo e intensidad), `musica.jingle(id)` (melodía corta que pausa el tema y luego lo retoma o no) y `musica.parar()`.
- Volumen de la música, más bajo que los efectos (≈ 0,5 de su nivel). Con el modo `efectos` o `silencio`, el secuenciador no programa nada.
- `visibilitychange` → `ctx.suspend()` / `resume()`: la música se para con la pestaña oculta.

## 4. Ambientes
- Las capas fijas siguen dibujándose **una vez** a un lienzo al cambiar de mundo, como ya se hace. Ahora con más detalle y en 2-3 planos: uno lejano y uno cercano.
- Encima, una capa animada con: partículas de `particulas.js` (máximo ~40 por mundo), elementos que se desplazan en bucle (nubes, peces) y pulsos de brillo (lava, lámpara).
- Regla de legibilidad: fondo con saturación y brillo por debajo de las burbujas. Las partículas, pequeñas y con poca opacidad (≤ 0,35).

## 5. Online
Nada viaja por la red: cada móvil elige la música y anima el fondo con el estado que ya recibe. Protocolo sin cambios.

## 6. Riesgos
| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Música repetitiva y cansina | Media | Temas de 8-16 compases con parte A/B; modo `efectos` para quien no la quiera. |
| Tirones en móviles flojos | Baja | Lienzos cacheados, partículas limitadas y medido con `?debug=1`. |
| iOS no deja sonar audio | Media | Se usa el mismo `activar()` al primer toque que ya funciona con los efectos. |

## 7. Pruebas
- **Manual:** cambiar entre los 3 modos y recargar (se recuerda), ocultar y volver a la pestaña, y comprobar que la música no se corta al cambiar de fase.
- **Rendimiento:** `?debug=1` en Lanza Burbujas, 60 fps con fondo animado.

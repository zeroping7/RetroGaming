# Plan técnico: <Nombre>

> **Spec:** `specs/NNN-<id>/spec.md` · **Estado:** Borrador | Aprobado · **Fecha:**
> Describe CÓMO. Cada decisión debe poder trazarse a una parte de la spec.

## 1. Cumplimiento de la constitución
- [ ] A1 La lógica está en `sim.js` puro (sin Phaser, canvas ni DOM)
- [ ] A3 1 jugador usa el mismo camino que el anfitrión
- [ ] A5 La simulación solo lee acciones abstractas
- [ ] A6 Carpeta `juegos/<id>/`, alta en `juegos/registro.js`, botón "◀ Menú RetroGaming"
- [ ] P5 Archivos añadidos a `FILES` en `sw.js` y `CACHE` subido
- [ ] R1/R5 Sin crear objetos en el bucle caliente
- [ ] C1/C3 Juego y menú usables con táctil, teclado y mando
- [ ] Q3 `tests.html` cubre las reglas principales
- Excepciones (con enlace a `docs/decisiones.md`):

## 2. Archivos
| Archivo | Responsabilidad |
|---|---|
| `juegos/<id>/index.html` | página, menú del juego, carga de scripts |
| `juegos/<id>/sim.js` | reglas del juego |
| `juegos/<id>/render.js` | dibujo (Phaser o canvas) |
| `juegos/<id>/tests.html` | pruebas de `sim.js` |
| `juegos/<id>/portada.svg` | etiqueta del cartucho |

## 3. Modelo de estado
```js
/** @typedef {Object} Estado
 *  @property {number} tick
 *  @property {Jugador[]} jugadores
 *  @property {...} ...
 */
```
- **Funciones de `sim.js`:** `crear(semilla, ajustes)`, `paso(estado, entradas[])`, `codificar(estado)`, `decodificar(datos)`
- **Aleatoriedad:** generador con semilla (nunca `Math.random()` dentro de la simulación).

## 4. Física y colisiones
<!-- Cajas (AABB), tiles, velocidades en px/s, gravedad... Valores iniciales en tabla para poder ajustarlos. -->
| Parámetro | Valor inicial |
|---|---|
| | |

## 5. Online
- **Nivel:** A / B / C
- **Contenido de la instantánea** (campos y bytes estimados):
- **Momentos clave y cómo se garantiza que llegan:** <!-- p. ej. repetirlos en varias instantáneas -->
- **Corrección en predicción (nivel C):** <!-- salto directo si el error > X px; suavizado si es menor -->
- **Tráfico estimado:** ___ KB/s (≤ 20 KB/s, R2)

## 6. Pantallas / escenas
| Pantalla | Qué muestra | Viene de / va a |
|---|---|---|
| Menú del juego | 1J / 2J / crear / unirse / volver | → Juego, → menú RetroGaming |
| Juego | | |
| Fin | | → menú del juego / reintentar |

## 7. Assets
| Asset | Formato | Origen / licencia | Fase |
|---|---|---|---|
| | | greybox | 1 |

## 8. Riesgos
| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| | | |

## 9. Pruebas
- **`tests.html`:** <!-- reglas a verificar -->
- **Manual en móvil:** <!-- pasos -->
- **Online:** 2 móviles (o 2 pestañas en PC) + `?lag=150&loss=5`

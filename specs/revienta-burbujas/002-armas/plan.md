# Plan técnico: Armas y objetos de Revienta Burbujas

> **Spec:** `specs/revienta-burbujas/002-armas/spec.md` · **Estado:** Borrador · **Fecha:** 2026-10-21
> Describe CÓMO. Primero se separa el código actual sin cambiar nada del juego; después se añaden armas y objetos encima.

## 1. Cumplimiento de la constitución
- [ ] A1 La lógica pasa a `sim.js` puro (sin canvas ni DOM): hoy está mezclada en `index.html` (D-006)
- [ ] A2 Paso fijo de 60 ticks/s: hoy avanza con el tiempo de cada fotograma
- [x] A3 1 jugador usa el mismo camino que el anfitrión (ya es así)
- [ ] A5 `sim.js` lee acciones abstractas `{ left, right, a }`; `index.html` traduce teclado, táctil y mando
- [x] A6 Carpeta propia y botón de volver (ya es así)
- [ ] P5 `sim.js` y `render.js` en `FILES` de `sw.js` y `CACHE` subido
- [ ] R1/R5 Arpones y objetos se reutilizan en arrays fijos por jugador, sin crear objetos en cada tick
- [ ] Q3 `tests.html` con las reglas de §9
- Excepciones que siguen (D-006): canvas 2D sin Phaser y menús del juego sin mando (C3, tarea T013 de 000). Al terminar, D-006 se actualiza: A1, A2 y Q3 dejan de ser excepción.

## 2. Archivos
| Archivo | Responsabilidad |
|---|---|
| `juegos/revienta-burbujas/index.html` | página, menús, controles, red, bucle con paso fijo |
| `juegos/revienta-burbujas/sim.js` | reglas: burbujas, jugadores, armas, objetos, puntos, niveles; `codificar`/`decodificar` |
| `juegos/revienta-burbujas/render.js` | dibujo en canvas de todo lo anterior y del HUD |
| `juegos/revienta-burbujas/tests.html` | pruebas de `sim.js` en el navegador, sin frameworks |

`index.html` carga `sim.js` y `render.js` como módulos (`<script type="module">`), igual que ya hace con `src/net/`.

## 3. Modelo de estado
```js
/** @typedef {Object} Estado
 *  @property {1|2} n                 jugadores
 *  @property {'ready'|'play'|'dead'|'clear'|'over'} fase
 *  @property {number} t             segundos que quedan de la fase (ready, dead, clear, over)
 *  @property {number} nivel, puntos, vidas
 *  @property {number} golpeado      índice del jugador tocado, -1 si ninguno
 *  @property {number} semilla       estado del generador aleatorio (ver abajo)
 *  @property {number} congelado     segundos de reloj que quedan (0 = nada)
 *  @property {Burbuja[]} burbujas   { s: 1-4, x, y, vx, vy }
 *  @property {Jugador[]} jugadores
 *  @property {Objeto[]} objetos     máx. 2
 *  @property {Estallido[]} estallidos  anillos visuales { x, y, s, t }
 *
 *  @typedef {Object} Jugador
 *  @property {number} x
 *  @property {'normal'|'doble'|'fijo'|'triple'} arma
 *  @property {Arpon[]} arpones      máx. 3 { x, top, clavado }  (clavado: segundos que le quedan en el techo)
 *  @property {number} espera        segundos hasta poder volver a disparar
 *  @property {boolean} escudo
 *  @property {number} invulnerable  segundos (tras romperse el escudo)
 *  @property {number} rapido        segundos de velocidad que quedan
 *
 *  @typedef {Object} Objeto
 *  @property {'doble'|'fijo'|'triple'|'velocidad'|'escudo'|'dinamita'|'reloj'} tipo
 *  @property {number} x, y, vy
 *  @property {number} enSuelo       segundos desde que tocó el suelo (desaparece a los 10)
 */
```
- **Funciones de `sim.js`:** `crear(n, semilla)`, `paso(estado, entradas)` (avanza 1/60 s), `moverBurbujas(lista, dt)` (también la usa la predicción del invitado), `codificar(estado)`, `decodificar(datos)`.
- **Entradas por jugador:** `{ left, right, a }`. Para el invitado online, el anfitrión añade `x` (su última posición conocida, ya adelantada) y `sim.js` acerca el jugador a ella suavemente, como hoy.
- **Aleatoriedad:** generador con semilla guardado en el estado (nunca `Math.random()` dentro de `sim.js`), así las pruebas son repetibles.

## 4. Reglas y valores
| Parámetro | Valor inicial |
|---|---|
| Velocidad del arpón | 520 px/s (con **velocidad**: 900 px/s durante 10 s) |
| Arpones a la vez | normal 1 · doble 2 · fijo 1 · triple 3 (se dispara de nuevo cuando no queda ninguno) |
| Separación del triple | 24 px (centro y a cada lado, dentro de la pantalla) |
| Espera entre disparos | 0,2 s, para que el doble no gaste los dos de golpe al mantener pulsado |
| Arpón fijo | al llegar al techo se queda clavado 3 s o hasta tocar una burbuja |
| Probabilidad de objeto | 1 de cada 8 burbujas reventadas, si hay menos de 2 objetos |
| Reparto de objetos | doble 25 · fijo 20 · triple 20 · velocidad 15 · escudo 12 · dinamita 4 · reloj 4 (de 100) |
| Caída del objeto | gravedad 600 px/s²; en el suelo 10 s, parpadea los últimos 2 s |
| Recoger | caja del jugador contra caja del objeto (16×16 px); +100 puntos |
| Escudo | aguanta un golpe; luego 1 s invulnerable parpadeando |
| Dinamita | cada burbuja se parte hasta el tamaño 1 (máx. 40 en pantalla) |
| Reloj | burbujas quietas 5 s (siguen haciendo daño); el HUD muestra la cuenta |
| Al morir | el jugador tocado vuelve al arpón normal y pierde escudo y velocidad; se borran los objetos del suelo |
| Al pasar de nivel | se conservan las armas; se acaban velocidad y reloj |

## 5. Online
- **Nivel:** C (predicción), como hoy.
- **Instantánea:** se añade por jugador arma (1 número), escudo/invulnerable, y hasta 3 arpones (x, top, clavado); objetos (tipo, x, y, enSuelo); congelado. Unos 60 bytes más.
- **Tráfico estimado:** ~10 KB/s del anfitrión, unos 1,5 KB/s más que hoy (≤ 20 KB/s, R2).
- **Predicción del invitado:** dispara al instante con el arma que indica la última instantánea, usando las mismas reglas de `sim.js`. Sus arpones locales se mantienen hasta que el anfitrión los confirma, como ya pasa con el disparo actual. Objetos, escudo y armas los decide siempre el anfitrión.
- **Versión del protocolo:** sube a 4 (cambian los mensajes).

## 6. Pantallas
Sin pantallas nuevas. En el HUD se añaden un icono pequeño con el arma de cada jugador y la cuenta del reloj cuando está activo.

## 7. Aspecto (formas planas, P9)
| Elemento | Cómo se dibuja |
|---|---|
| Arpón normal / doble / triple | como hoy: cuerda discontinua y punta en triángulo, del color del jugador |
| Arpón fijo | línea continua de 5 px con brillo blanco en el centro; parpadea el último medio segundo |
| Objetos | cuadrado redondeado de 16 px con un símbolo: `2`, `▮`, `3`, flecha, aro, cruz y reloj, cada uno de un color |
| Escudo | aro del color del jugador alrededor de él |

## 8. Riesgos
| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Al separar en `sim.js` se rompe algo que hoy funciona (sobre todo el online) | media | La primera tarea solo mueve código sin cambiar nada; se comprueba con pruebas y con una partida online antes de seguir |
| El paso fijo cambia la sensación del juego | baja | Mismas velocidades en px/s; solo cambia cómo se reparte el tiempo |
| La predicción de varios arpones del invitado da saltos | media | Misma estrategia que el disparo actual; probar con `?lag=` cuando exista (T012 de 000) o con datos móviles |

## 9. Pruebas
- **`tests.html`:** partir una burbuja; límite de arpones por arma; fijo clavado 3 s; triple con 3 líneas; escudo que absorbe un golpe; objeto que desaparece a los 10 s en el suelo; probabilidad repetible con semilla; dinamita; reloj; perder el arma al morir; `codificar` y `decodificar` de ida y vuelta.
- **Manual en móvil:** jugar hasta que caigan objetos y probar cada uno.
- **Online:** dos móviles; los dos ven los mismos objetos y cada uno su arma.

# Plan técnico: Lanza Burbujas

> **Spec:** `specs/lanza-burbujas/005-lanza-burbujas/spec.md` · **Estado:** Aprobado · **Fecha:** 2026-10-23
> Aprobado con la spec: el usuario pidió el juego completo de principio a fin sin parar entre pasos.

## 1. Cumplimiento de la constitución
- [x] A1 La lógica está en `sim.js` puro (sin Phaser, canvas ni DOM); la CPU en `cpu.js`, también pura
- [x] A2 Paso fijo de 60 ticks/s; el dibujo va a los FPS del móvil
- [x] A3 1 jugador usa el mismo camino que el anfitrión (VS CPU = anfitrión con la CPU de invitado)
- [x] A4 Anfitrión autoritativo; el invitado envía su ángulo y un contador de disparos
- [x] A5 La simulación solo lee acciones (`left`, `right`, `a`); la CPU también produce acciones
- [x] A6 Carpeta `juegos/lanza-burbujas/`, alta en `juegos/registro.js`, botón "◀ MENÚ RETROGAMING"
- [x] P3 Phaser `3.90.0` y MQTT.js `5.10.1` por CDN con versión fijada
- [x] P5 Archivos añadidos a `FILES` en `sw.js` y `CACHE` subido
- [x] R5 Rejilla en `Int8Array`, objetos de vuelo y de entradas reutilizados; el dibujo usa grupos de imágenes fijos
- [x] C1/C2/C3 Juego y menús con táctil, teclado y mando; botones táctiles solo en pantallas táctiles
- [x] Q1/Q2 `?debug=1` y `?lag=&loss=` implementados en la página del juego (D-014)
- [x] Q3 `tests.html` cubre las reglas principales
- Excepciones: ninguna. Decisiones nuevas: D-013 (Phaser solo dibuja), D-014 (Q1/Q2 en la página).

## 2. Archivos
| Archivo | Responsabilidad |
|---|---|
| `juegos/lanza-burbujas/index.html` | página: menús en HTML (mismo estilo que Revienta Burbujas), controles, red, bucle de paso fijo |
| `juegos/lanza-burbujas/sim.js` | reglas: rejilla, disparo, rebotes, grupos, caídas, techo, prisa, basura, fases, instantáneas |
| `juegos/lanza-burbujas/niveles.js` | 30 niveles diseñados en 6 mundos, colores y símbolos |
| `juegos/lanza-burbujas/cpu.js` | rivales CPU: eligen ángulo simulando trayectorias con `sim.js` |
| `juegos/lanza-burbujas/render.js` | escena de Phaser que dibuja el estado (nunca lo cambia) y los efectos |
| `juegos/lanza-burbujas/gatos.js` | gatos en pixel art (J1 atigrado, J2 tricolor, 8 rivales) |
| `juegos/lanza-burbujas/sonidos.js` | recetas de sonido (D-011) |
| `juegos/lanza-burbujas/records.js` | top 10 en `lb-records` (misma lógica que Revienta Burbujas) |
| `juegos/lanza-burbujas/tests.html` | pruebas de `sim.js`, `niveles.js`, `cpu.js` y `records.js` |
| `juegos/lanza-burbujas/portada.svg`, `icono.png` | cartucho y favicon |

## 3. Modelo de estado
```js
/** @typedef {Object} Tablero
 *  @property {Int8Array} celdas  FILAS×8, 0 = vacío, 1..8 = color. Fila par: 8 huecos; impar: 7, desplazada media burbuja
 *  @property {number} bajadas    filas que ha bajado el techo
 *  @property {number} ang        ángulo del cañón en radianes (0 = arriba, negativo = izquierda)
 *  @property {number} actual, siguiente   colores
 *  @property {{activo:boolean,x:number,y:number,vx:number,vy:number,c:number}} vuelo
 *  @property {number} disparos   disparos hechos (el invitado confirma así su predicción)
 *  @property {number} fc         último contador de disparo atendido (online)
 *  @property {number} desdeBajada, prisa, basura, rng, giroT
 *  @property {boolean} perdido
 *
 *  @typedef {Object} Estado
 *  @property {'niveles'|'cpu'|'online'} modo
 *  @property {string} fase  'listo'|'juego'|'limpio'|'perdido'|'continuar'|'over'|'final'|'ronda'|'partida'|'rival'|'campeon'
 *  @property {number} t     segundos en la fase · tick
 *  @property {Tablero[]} tab   1 (niveles) o 2 (versus)
 *  @property {number} nivel, puntos, rival, ronda, techoT
 *  @property {[number, number]} marcador
 *  @property {{p:number,f:number}} mejor      D-012
 *  @property {number[]} eventos               pares [código, dato] para sonido y efectos
 */
```
- **Funciones:** `crear(modo, opciones)`, `paso(st, entradas, dt)`, `codificar(st)`, `decodificar(datos)`, y las piezas que usan la CPU y el invitado: `girar`, `disparar`, `moverVuelo`, `trayectoria`, `vecinos`, `centro`.
- **Aleatoriedad:** generador con semilla (mulberry32) en el estado; cada tablero tiene el suyo. En versus los dos empiezan cada ronda con la misma semilla y el mismo dibujo.
- **Eventos de burbuja:** dato = `tablero·10000 + celda·10 + color`, así el dibujo sabe dónde poner el estallido o la caída.

## 4. Física y reglas
| Parámetro | Valor |
|---|---|
| Diámetro de burbuja | 20 px (radio 10), fila = 17,32 px |
| Tablero | 160 × 262 px; 8 columnas; se pierde con una burbuja en la fila 12 (contando bajadas) |
| Velocidad de disparo | 560 px/s, en 3 subpasos por tick |
| Choque | distancia entre centros < 16 px (0,8 × diámetro), o tocar el techo |
| Cañón | ±80°; toque = 1,2°; mantener: 70°/s y 140°/s tras 0,6 s |
| Prisa | 10 s; cuenta atrás los últimos 5 s |
| Techo (niveles) | cada N disparos (N por mundo: 8, 8, 7, 6, 6, 5); tiembla los 2 últimos |
| Techo (versus) | cada 20 s; tiembla los 3 últimos |
| Puntos | 10 por burbuja que explota; caída de n: 10·2ⁿ (máx. 1.310.720) |
| Bonus de tiempo | ≤ 5 s: 50.000; baja en línea hasta 0 a los 60 s |
| Basura | 1 por burbuja que cae; llega tras el siguiente disparo del rival (máx. 18 de golpe), sube recta desde una columna al azar |

- **Pegar:** el hueco vacío más cercano a la burbuja entre los de alrededor del choque que estén en la fila 0 o toquen otra burbuja.
- **Explotar:** relleno por vecinos del mismo color desde la burbuja pegada; si son 3 o más, se quitan.
- **Caer:** relleno desde la fila 0; lo que no se alcanza cae.
- **Colores:** `actual` y `siguiente` se rehacen si su color ya no está en el tablero.

## 5. Online
- **Nivel:** C para el cañón propio; B para el resto (el invitado adelanta el vuelo de la burbuja del anfitrión según el retardo).
- **Invitado → anfitrión** (cada 50 ms si gira, 500 ms quieto, y al disparar): `{a: ángulo·1000, fc: contador de disparos, fa: ángulo del último disparo, f: botón A, pn/pv: pausa}`. Como `fc` va en todos los mensajes, un disparo nunca se pierde.
- **Anfitrión → invitado** (20/s): fase, tiempos, marcador, nivel/rival y por tablero `[celdas (texto de 112 cifras), bajadas, ángulo, actual, siguiente, disparos, fc, prisa, basura, desdeBajada, perdido, vuelo]`. Unos 500 B → **≈10 KB/s** (R2).
- **Momentos clave:** van en el estado completo de cada instantánea (fase, celdas, marcador), así que perder una no importa. Los efectos y sonidos viajan como eventos y sí pueden perderse.
- **Predicción del invitado:** su cañón gira al instante; al disparar ve salir la burbuja y la mueve él mismo hasta que el anfitrión confirma (`fc`). Si llega a chocar antes, se queda quieta hasta la confirmación.
- Temas MQTT: `lanza-burbujas/v1/<CÓDIGO>/in` y `/st`.

## 6. Pantallas
| Pantalla | Qué muestra | Viene de / va a |
|---|---|---|
| Menú del juego | 1 JUGADOR, VS CPU, CREAR PARTIDA, UNIRSE CON CÓDIGO, RÉCORDS, ◀ MENÚ RETROGAMING | → partida, → menú principal |
| Listo | «NIVEL n», mundo nuevo o «RONDA n» | → juego |
| Juego | 1 tablero centrado (×1,25) o 2 lado a lado (×1,15) | → limpio / perdido / ronda |
| ¿Continuar? | cuenta atrás de 10 s | → listo (puntos a 0) / fin |
| Fin / campeón | resultado; iniciales si entra en el top 10 | → récords → menú |
| Fin de partida versus | marcador, REVANCHA (A) / MENÚ | → nueva partida / menú |

## 7. Assets
| Asset | Formato | Origen / licencia | Fase |
|---|---|---|---|
| Burbujas (8 colores con símbolo) | dibujadas con canvas al cargar | propio | 1 |
| Gatos (J1, J2, 8 rivales) | pixel art en código, a partir de las fotos del usuario | propio | 1 |
| Fondos de los 6 mundos | dibujados con canvas | propio | 1 |
| Sonidos | Web Audio | propio (D-011) | 1 |
| Portada e icono | SVG / PNG | propio | 1 |

## 8. Riesgos
| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Phaser pesa 1,2 MB | segura | solo se carga al entrar en el juego (R4); el service worker lo guarda |
| Texto borroso al escalar | media | el juego se dibuja a 1280×720 con cámara ×2 |
| Pegado raro en esquinas | media | pruebas de pegado en `tests.html` |
| Basura y disparo a la vez en online | baja | el anfitrión decide todo; el invitado solo predice su vuelo |

## 9. Pruebas
- **`tests.html`:** vecinos, pegado, grupos de 3, caídas y bonus, rebote, techo y temblor, prisa, colores presentes, pérdida, limpiar nivel, basura, rondas al mejor de 3, continuar, 30 niveles válidos, CPU que encuentra el disparo bueno, instantánea ida y vuelta, récords.
- **Manual en móvil:** jugar el nivel 1 completo, perder y continuar, VS CPU una ronda, versus con dos móviles.
- **Online:** 2 móviles (o 2 pestañas en PC) + `?lag=150&loss=5`.
- **Parámetros de prueba:** `?nivel=N` empieza en ese nivel; `?rival=N` en ese rival CPU.

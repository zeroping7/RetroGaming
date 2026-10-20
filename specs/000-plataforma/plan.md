# Plan técnico: Plataforma

> **Spec:** `specs/000-plataforma/spec.md` · **Estado:** Aprobado · **Fecha:** 2026-10-20

## 1. Cumplimiento de la constitución
- [x] P1 Sin build: `index.html` + `css/lanzador.css` + módulos ES en `src/`
- [x] P5 `sw.js` y `manifest.webmanifest` renombrados a RetroGaming y con todos los archivos
- [x] A6 Juegos como páginas en `juegos/<id>/`, listados en `juegos/registro.js`
- [x] C1/C3 Menú principal con táctil, teclado y mando
- [x] Q4 Versión en el pie (`src/version.js`)
- Excepciones: menús de Revienta Burbujas sin mando (D-006)

## 2. Archivos
| Archivo | Responsabilidad |
|---|---|
| `index.html` | estructura del menú |
| `css/lanzador.css` | estante, cartuchos, consola, ficha, horizontal y movimiento reducido |
| `src/lanzador.js` | construir cartuchos desde el registro, selección, entrada, lanzar |
| `juegos/registro.js` | datos de cada juego (`docs/arquitectura.md` §3) |
| `src/version.js` | versión visible |
| `src/input/` *(pendiente)* | acciones abstractas compartidas (teclado, mando, táctil) |
| `src/net/` *(pendiente)* | sala MQTT compartida extraída de Revienta Burbujas |

## 3. Menú principal
- Estante horizontal con `scroll-snap`; el cartucho más cercano al centro es el seleccionado.
- Al moverse con teclado o mando se desplaza suavemente y, mientras dura, el scroll no cambia la selección.
- Mando: sondeo con `requestAnimationFrame` solo tras `gamepadconnected`; repetición a los 350 ms y luego cada 160 ms; un botón que ya venía pulsado se ignora.
- Al lanzar: clase `lanzando` (cartucho a la ranura + fundido) y navegación a los 480 ms; `pageshow` lo deshace al volver.

## 4. Módulo de red compartido (pendiente)
Extraer de Revienta Burbujas: conexión a varios servidores, secuencias, medida de retardo y validación. API prevista:
```js
const sala = await crearSala({ juego: 'id', anfitrion: true });   // → sala.codigo
sala.enviar('in' | 'st', datos);  sala.alRecibir((tema, datos) => {});  sala.cerrar();
```
Con `?lag=` y `?loss=` aplicados dentro de `enviar`.

## 5. Pruebas
- Manual en móvil: deslizar, tocar, entrar, volver atrás, girar a horizontal.
- PC: flechas, Enter, mando USB.

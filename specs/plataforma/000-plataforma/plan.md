# Plan técnico: Plataforma

> **Spec:** `specs/plataforma/000-plataforma/spec.md` · **Estado:** Aprobado · **Fecha:** 2026-10-20 · **Actualizado:** 2026-10-21

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
| `src/input/entradas.js` | acciones abstractas compartidas (teclado, mando, táctil); API en `docs/arquitectura.md` §6 |
| `src/net/sala.js` | sala online compartida: código, señalización MQTT, WebRTC y respaldo |
| `src/net/ice.js` | `servidoresIce()`: STUN públicos hoy; TURN del Worker en el futuro |

## 3. Menú principal
- Estante horizontal con `scroll-snap`; el cartucho más cercano al centro es el seleccionado.
- Al moverse con teclado o mando se desplaza suavemente y, mientras dura, el scroll no cambia la selección.
- Teclado y mando vía `src/input/entradas.js` (desde v0.3.0): `left`/`right` eligen, `a` o `start` (salvo Esc) entran.
- Al lanzar: clase `lanzando` (cartucho a la ranura + fundido) y navegación a los 480 ms; `pageshow` lo deshace al volver.

## 4. Módulo de red compartido
Extraer de Revienta Burbujas: conexión a varios servidores MQTT, código, secuencias, medida de retardo y validación. API (igual para cualquier transporte):
```js
const sala = await crearSala({ juego: 'id', anfitrion: true });   // → sala.codigo
sala.enviar('in' | 'st', datos);  sala.alRecibir((tema, datos) => {});  sala.cerrar();
sala.via;      // 'directa' (WebRTC) | 'mqtt'
sala.retardo;  // ida y vuelta medido, en ms
```
- **WebRTC (D-009):** al unirse, el invitado crea la conexión y un DataChannel `{ ordered: false, maxRetransmits: 2 }` (2 reintentos rápidos para no perder, por ejemplo, un disparo); la oferta, la respuesta y los candidatos ICE viajan por MQTT en el tema `<juego>/v3/<codigo>/rtc`.
- **Respaldo:** si el canal no abre en 6 s (hasta 3 intentos), o se cierra, todo sigue por MQTT sin cortar la partida. MQTT sigue conectado durante la partida para poder volver a él.
- `servidoresIce()` devuelve `stun:stun.l.google.com:19302` y `stun:stun.cloudflare.com:3478`.
- `?lag=` y `?loss=` se aplican dentro de `enviar`, para los dos transportes.
- El HUD online muestra la vía (`DIRECTA` / `MQTT`) y el retardo.

## 5. Pruebas
- Manual en móvil: deslizar, tocar, entrar, volver atrás, girar a horizontal.
- PC: flechas, Enter, mando USB.

## 6. Enlace para compartir (HU-9)
- Formato: `https://zeroping7.github.io/RetroGaming/juegos/<id>/?sala=ABCD`.
- `src/net/` añade `enlaceDePartida(idJuego, codigo)` y `codigoDeUrl()` (valida el alfabeto de `docs/arquitectura.md` §4), para que valga en todos los juegos.
- Botón "Compartir" junto al código: `navigator.share({ title, text, url })`; si no existe o falla, `navigator.clipboard.writeText(url)` y aviso "Enlace copiado".
- Al cargar un juego con `?sala=` válido se salta su menú y entra como invitado con ese código. Después se quita de la URL con `history.replaceState`, para que recargar no vuelva a unirse.
- Depende de T011 (Revienta Burbujas ya usando `src/net/`).

## 7. Orientación (HU-10)
- Quitar `"orientation"` de `manifest.webmanifest`. El menú ya se adapta a horizontal (`css/lanzador.css`).
- Nuevo campo `orientacion: 'vertical' | 'horizontal' | 'libre'` en `juegos/registro.js` (contrato en `docs/arquitectura.md` §3). Revienta Burbujas: `'vertical'`.
- Si el móvil no está en la orientación del juego, una capa "Gira el móvil" tapa la pantalla (y pausa, cuando exista T020). Se detecta con `matchMedia('(orientation: …)')`.
- No se usa `screen.orientation.lock()`: solo funciona en pantalla completa y no existe en iOS.
- En la app ya instalada, Chrome tarda en aplicar el manifest nuevo; desinstalar y reinstalar lo fuerza.

## 8. Pausa (HU-7)
- `src/pantalla/pausa.js`: `crearPausa({ alContinuar, alSalir })` → capa con «CONTINUAR» y «SALIR» (`mostrar(titulo, detalle, puedeContinuar)`, `ocultar()`). Solo es visual; cada juego decide cuándo pausar.
- Se abre con el botón ⏸, `Esc` o `P`, `Start` del mando (y `A` continúa), al ocultarse la página (`visibilitychange`) y cuando `vigilarOrientacion` avisa de que el móvil está mal girado.
- La simulación no avanza en pausa (el bucle de paso fijo no llama a `paso`) y el dibujo no interpola.
- **Online:** la decide el anfitrión y la manda en cada instantánea (`pz`: 0 no, 1 J1, 2 J2, 3 sin conexión). El invitado la pide con un contador creciente (`pn`) y el valor deseado (`pv`) en sus mensajes, así llega aunque se pierda alguno. Cualquiera de los dos puede seguir.
- Si el invitado deja de oírse 4 s con la partida empezada, el anfitrión la guarda en pausa 3 («Esperando a tu compañero…»); cuando vuelve, queda en pausa de J2 hasta que alguien pulse «Continuar».

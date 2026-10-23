# Arquitectura

## 1. Estructura de carpetas
```
index.html               # menú principal (estante de cartuchos)
css/lanzador.css
src/
  lanzador.js            # lógica del menú: selección, táctil, teclado, mando
  version.js             # export const VERSION = 'x.y.z'
  input/entradas.js      # controles compartidos: teclado, mando y táctil → acciones (§6)
  net/sala.js            # sala online compartida: código, directa/MQTT, secuencias y retardo (§5)
  net/ice.js             # servidores STUN (y TURN en el futuro) para la conexión directa
  pantalla/orientacion.js # vigilarOrientacion(id): capa "Gira el móvil" según el registro (§7)
  audio/sintetizador.js  # crearAudio(recetas): sonidos con Web Audio y silencio común (D-011)
  pantalla/pausa.js      # crearPausa(): capa de pausa común (plan de 000, §8)
juegos/
  registro.js            # lista de juegos del menú (§3)
  <id>/
    index.html           # el juego: página independiente
    portada.svg          # etiqueta del cartucho, sin texto
    icono.png            # favicon del juego (opcional)
    sim.js render.js tests.html   # estructura para juegos nuevos (constitución A1, Q3)
    fases.js records.js           # (Revienta Burbujas) fases diseñadas y tabla de récords
sw.js  manifest.webmanifest  icon-192.png  icon-512.png   # app instalable de todo el sitio
docs/  CLAUDE.md
specs/
  _plantillas/
  plataforma/NNN-*/        # lo común: menú, entradas, red
  <id-juego>/NNN-*/        # specs de cada juego, en la carpeta con su mismo id
```

## 2. Navegación
- El menú y cada juego son **páginas separadas**. Entrar en un juego es navegar a `juegos/<id>/`; al salir del juego el navegador libera toda su memoria.
- Cada juego tiene un botón **"◀ Menú RetroGaming"** (y `Esc` en su menú) que vuelve a `../../`.
- Menú principal: estante horizontal con *scroll-snap*; el cartucho centrado es el seleccionado.
  - Táctil: deslizar para elegir, tocar el cartucho centrado o "JUGAR" para entrar.
  - Teclado: `←/→` o `A/D` para elegir, `Enter`/`Espacio` para entrar.
  - Mando: cruceta o stick para elegir, `A` o `Start` para entrar.
- Al entrar, el cartucho baja a la ranura (300 ms) y la pantalla funde a negro. Con "reducir movimiento" se entra al instante.

## 3. Registro de juegos (`juegos/registro.js`)
```js
{
  id: 'revienta-burbujas',          // = nombre de la carpeta
  titulo: 'Revienta Burbujas',
  descripcion: 'Una frase de qué se hace.',
  ruta: 'juegos/revienta-burbujas/',
  portada: 'juegos/revienta-burbujas/portada.svg',  // ~240×260, sin texto
  etiqueta: '#ff6fae',              // color del marco de la etiqueta
  jugadores: { min: 1, max: 2 },
  online: true,                     // crear partida / unirse con código
  mismoDispositivo: true,           // 2 jugadores en el mismo móvil o PC
  claveRecord: 'rb-best',           // opcional: clave de localStorage con el récord
  orientacion: 'vertical',          // 'vertical' | 'horizontal' | 'libre' (D-007)
}
```
El menú rellena con ranuras "Próximamente" hasta tener al menos 3 cartuchos.

## 4. Menú de cada juego
Opciones según el registro: **1 jugador**, **2 jugadores** (mismo dispositivo), **Crear partida** y **Unirse con código**.
- **Código de partida**: 4 caracteres del alfabeto `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (sin 0/O ni 1/I/L).
- El anfitrión ve el código en grande y espera; cuando llega el invitado, la partida empieza sola.
- El invitado escribe el código; si en 15 s no hay respuesta: "No hay ninguna partida con ese código".
- **Enlace (D-008):** mientras espera, el anfitrión ve "COMPARTIR ENLACE" (`navigator.share`, o copiar si no existe). `juegos/<id>/?sala=CODIGO` entra directo como invitado; `enlaceDePartida()` y `codigoDeUrl()` están en `src/net/sala.js`.
- **Con mando y teclado (C3):** arriba/abajo eligen opción (se marca con un borde amarillo), A la pulsa y B vuelve atrás. También en la pausa común. Revienta Burbujas lo hace con `crearEntradas({ alPulsar })` de `src/input/entradas.js`.
- Revienta Burbujas añade **Récords** (top 10 en `localStorage` `rb-records`, ver spec 004).
- Si se deja de recibir durante 4 s, ambos pasan a "Esperando…" hasta que vuelve la conexión; si la partida ya había empezado, el anfitrión la guarda en pausa (plan de 000, §8).

## 5. Online en tiempo real
**Transporte:**
- **Directa (D-009):** WebRTC DataChannel sin orden y con 2 reintentos, de móvil a móvil. En la misma WiFi no sale de casa. STUN público en `src/net/ice.js`.
- **MQTT (D-004):** WebSocket seguro contra **varios servidores públicos a la vez** (shiftr.io, HiveMQ y EMQX). Todo se envía por todos; se acepta lo primero que llegue y se descartan duplicados por secuencia. Siempre conectado: sirve para encontrarse, para la señalización de WebRTC (tema `/rtc`) y como respaldo.
- El invitado propone la directa al entrar (hasta 3 intentos de 6 s). Mientras no abre, o si se cae, se juega por MQTT. El HUD muestra `DIRECTA` o el estado de los servidores, y los ms.

**Módulo:** todo lo genérico vive en `src/net/sala.js` (API en el plan de 000, §4). Los juegos lo cargan con `import('../../src/net/sala.js')`; la sala carga MQTT.js sola.

**Temas MQTT:** `<id-juego>/v<versión-protocolo>/<CÓDIGO>/in` (invitado → anfitrión) y `/st` (anfitrión → invitado). Revienta Burbujas usa la versión 9 (mejoras arcade, spec 004: continuar y récords).

**Mensajes**
- Invitado → anfitrión: `{n, l, r, f, ...}` — secuencia + estado de los botones. Se envía al cambiar algo y, además, cada 50 ms si se mueve o cada 500 ms si está quieto.
- Anfitrión → invitado: instantánea del estado 25 veces/s con números redondeados y arrays planos.
- La sala añade a cada mensaje `n` (secuencia) y `_t`, `_e`, `_a` (retardo); los juegos no usan esos nombres.
- Retardo: cada lado manda su hora (`_t`) y el otro la devuelve (`_e`) junto con cuánto tardó en contestar (`_a`). Así **los dos** miden la ida y vuelta (`sala.retardo`, en ms) y la ven en el HUD.
- Todo lo recibido se valida (tipos, rangos, longitud) antes de usarse: los temas son públicos.

**Niveles de red** (cada juego elige uno en su spec):
- **A — Por eventos**: solo mensajes cuando pasa algo. Puzzles/tablero por turnos.
- **B — Interpolación**: el invitado dibuja suavizando entre instantáneas; su personaje responde con el retardo de ida y vuelta.
- **C — Predicción**: además, el invitado mueve su personaje al instante, adelanta la instantánea según el retardo medido y corrige suavemente las diferencias. Obligatorio para acción (plataformas, top-down, carreras). Revienta Burbujas usa este nivel.

## 6. Entradas (`src/input/entradas.js`)
| Acción | Teclado (1 jugador) | Mando | Táctil |
|---|---|---|---|
| up/down/left/right | Flechas / WASD | Cruceta / stick izq. | Botones o joystick en pantalla |
| a | Espacio / J | A | Botón A |
| b | Shift / K | B | Botón B |
| start | Enter / Esc | Start | Botón ☰ |

Con 2 jugadores en el mismo dispositivo: J1 flechas + Espacio (a) + Shift dcho. (b); J2 WASD + F (a) + G (b). Cada mando a un jugador, por orden de conexión. Un juego puede pasar su propio reparto en `teclas` (p. ej. Revienta Burbujas: J2 dispara con W).

```js
import { crearEntradas } from '../../src/input/entradas.js';
const entradas = crearEntradas({
  jugadores: 1,                       // 1 o 2
  alPulsar(accion, jugador, info) {   // menús: cada pulsación y repeticiones de las direcciones
    // info = { origen: 'teclado'|'mando'|'tactil', codigo: 'Escape'|..., repeticion }
    return true;                      // true = usada (se evita la acción del navegador)
  },
  alCambiarDispositivo(d) {},         // para cambiar la ayuda en pantalla
});
entradas.estado(0).left;              // juegos: en cada tick, qué está pulsado (0 = J1, 1 = J2)
entradas.botonTactil(el, 'a', 0);     // controles en pantalla (CSS: touch-action: none)
entradas.destruir();
```
- Teclas por código físico (`KeyboardEvent.code`); se ignoran dentro de campos de texto y con Ctrl/Alt/Cmd.
- Un botón del mando que ya venía pulsado al cargar la página no cuenta hasta soltarlo.
- Las direcciones se repiten al mantenerlas: el teclado con su repetición propia; el mando a los 350 ms y luego cada 160 ms.

## 7. App instalable y caché
- `sw.js`: primero red (con `cache: 'no-cache'`, para que una versión recién publicada se vea al recargar) y, sin conexión, lo guardado. Al cambiar la lista `FILES`, subir `CACHE`.
- `manifest.webmanifest`: "RetroGaming", pantalla completa, sin orientación fija (D-007). Al instalarla abre el menú.
- **Orientación:** cada juego llama a `vigilarOrientacion('<id>')` de `src/pantalla/orientacion.js`. En móvil, si no coincide con la del registro, tapa la pantalla con "Gira el móvil". En PC no hace nada.

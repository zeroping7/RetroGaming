# Plan técnico: Música y ambientes de Lanza Burbujas

> **Spec:** `specs/lanza-burbujas/009-musica-y-ambientes/spec.md` · **Estado:** En revisión · **Fecha:** 2026-11-08
> Usa `src/audio/musica.js` y `src/arte/particulas.js` (plan de 007).

## 1. Constitución
- [x] `sim.js` sin cambios. La página decide la música con `st.modo`, `st.mundo`, `st.nivel`, `st.rival` y el evento `prisa`.
- [x] R5: partículas como un grupo fijo de imágenes de Phaser creadas una vez; solo se mueven.

## 2. Archivos
| Archivo | Cambio |
|---|---|
| `juegos/lanza-burbujas/musica.js` (nuevo) | Canciones: `menu`, `salon`, `jardin`, `tejados`, `cocina`, `desvan`, `luna`, `duelo` (variante `final` para la REINA) y los jingles `nivel`, `gana` y `pierde`. |
| `juegos/lanza-burbujas/index.html` | Elige el tema según el modo y el mundo, `tempo 1.25` mientras dure la prisa e `intensidad 1` en el nivel 5 del mundo. Botón de sonido con 3 modos. |
| `juegos/lanza-burbujas/render.js` | `pintarFondo` con más detalle. Capa animada con partículas y elementos propios por mundo, detrás del tablero. |

## 3. Música (todo original)
| Tema | Carácter | Base |
|---|---|---|
| Menú | juguetón | Fa mayor, 120 bpm, «pasos de gato» en staccato |
| Salón | tranquilo | Do mayor, 100 bpm, bajo suave |
| Jardín | alegre, con «pájaros» | Sol mayor, 126 bpm, trinos agudos |
| Tejados | nocturno y travieso | Mi menor, 112 bpm, bajo andante (walking) |
| Cocina | rápido y burbujeante | Re mayor, 144 bpm, arpegios rápidos |
| Desván | misterioso | La menor, 92 bpm, «caja de música» en triángulo agudo |
| Luna | espacial | Si♭ lidio, 88 bpm, notas largas y eco |
| Duelo / final | competitivo / épico | Re menor, 150 bpm / 160 bpm con voz extra |

## 4. Ambientes
| Mundo | Fijo | Animado |
|---|---|---|
| Salón | cortinas, sofá y lámpara | luz de lámpara que late suave y motas de polvo |
| Jardín | valla, flores y árbol | mariposas y hojas que caen |
| Tejados | chimeneas y luna | estrellas que titilan, ventanas que se encienden y apagan, humo de chimenea |
| Cocina | azulejos, estantes y olla | vapor que sube de la olla y luz cálida |
| Desván | vigas, cajas y telarañas | polvo flotando en un rayo de luz |
| Luna | Tierra, cráteres y estrellas | estrellas fugaces y Tierra que gira despacio (brillo) |

Todo detrás del tablero; el tablero mantiene su panel oscuro, así que la legibilidad no cambia.

## 5. Online
Sin cambios en la red.

## 6. Pruebas
- Recorrer los mundos con el selector de niveles y comprobar el tema y el fondo.
- Modo VS y contra la CPU (REINA), y la prisa: el tema acelera.
- `?debug=1`: 60 fps con el fondo animado.

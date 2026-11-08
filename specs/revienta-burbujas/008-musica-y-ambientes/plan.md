# Plan técnico: Música y ambientes de Revienta Burbujas

> **Spec:** `specs/revienta-burbujas/008-musica-y-ambientes/spec.md` · **Estado:** En revisión · **Fecha:** 2026-11-08
> Usa `src/audio/musica.js` y `src/arte/particulas.js` (plan de 007).

## 1. Constitución
- [x] `sim.js` sin cambios. La página decide la música con `st.lvl`, `st.state` y `st.tiempo`.
- [x] R5: fondos cacheados por mundo y partículas en arrays fijos.

## 2. Archivos
| Archivo | Cambio |
|---|---|
| `juegos/revienta-burbujas/musica.js` (nuevo) | Canciones: `menu`, `pradera`, `desierto`, `oceano`, `volcan` y los jingles `fase` y `fin`. |
| `juegos/revienta-burbujas/index.html` | Elige el tema según el estado (menú → `menu`, juego → tema del mundo de `fondoDe(lvl)`), con `tempo 1.25` si `tiempo ≤ 15` e `intensidad 1` en la 5.ª fase. Botón de sonido con 3 modos. |
| `juegos/revienta-burbujas/render.js` | `pintarFondo` con más detalle y en planos. Nueva `ambiente(x, i, t)` animada. Suelo y bloques con colores por mundo. |

## 3. Música (todo original)
| Tema | Carácter | Base |
|---|---|---|
| Menú | alegre, corto | Do mayor, 132 bpm |
| Pradera | saltarín | Sol mayor, 140 bpm, bajo a saltos |
| Desierto | «árabe» | modo frigio dominante (Mi), 120 bpm, percusión seca |
| Océano | lento y ondulante | Re menor, 96 bpm, arpegios en triángulo con eco (2.ª voz retrasada) |
| Volcán | tenso | La menor, 150 bpm, bajo en corcheas insistente |

## 4. Ambientes
| Mundo | Fijo (lienzo) | Animado |
|---|---|---|
| Pradera | colinas en 2 planos, sol poniente y flores | nubes que cruzan despacio, flores que se mecen y luciérnagas |
| Desierto | mesetas, dunas y cactus | calima (franjas del horizonte que ondulan) y arena que vuela |
| Océano | fondo marino, algas y rocas | rayos de luz que laten, peces lejanos y burbujitas que suben (apagadas) |
| Volcán | volcán, montañas y ríos de lava | brillo de lava que palpita y brasas que suben |

Suelo y bloques: color por mundo (hierba, arena, coral y roca volcánica). Los bloques duros siguen distinguiéndose de los rompibles.

## 5. Online
El invitado elige la música y el fondo con su copia del estado. Nada nuevo en la red.

## 6. Pruebas
- Jugar la fase 1 de cada mundo con `?fase=N` (si no existe, se añade para pruebas) y comprobar el tema y el fondo.
- Dejar que el tiempo baje de 15 s y comprobar que acelera.
- Revisar la legibilidad: las burbujas pequeñas se distinguen del fondo en los 4 mundos.

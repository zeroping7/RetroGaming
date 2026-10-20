# RetroGaming

Consola de juegos retro en el navegador. Elige un cartucho y juega solo, con alguien en el mismo dispositivo u online con un código de 4 letras.

**Jugar:** https://zeroping7.github.io/RetroGaming/ — se puede instalar como app (menú del navegador → Instalar / Añadir a pantalla de inicio).

## Juegos
| Juego | Jugadores | Online |
|---|---|---|
| [Revienta Burbujas](juegos/revienta-burbujas/) | 1–2 | sí |

## Cómo se desarrolla
Con Spec Driven Development y Claude, todo desde el móvil:
1. **"spec de <juego>"** → `specs/NNN-<id>/spec.md` (qué y por qué)
2. **"plan de NNN"** → `plan.md` (cómo)
3. **"tareas de NNN"** → `tareas.md` (pasos pequeños)
4. **"implementa TNNN"** → código, una tarea cada vez

Reglas en [`docs/constitucion.md`](docs/constitucion.md), estructura en [`docs/arquitectura.md`](docs/arquitectura.md) y decisiones en [`docs/decisiones.md`](docs/decisiones.md). Instrucciones para Claude en [`CLAUDE.md`](CLAUDE.md).

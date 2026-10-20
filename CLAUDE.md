# Instrucciones para Claude

**RetroGaming**: colección de juegos web tipo consola retro, para 1 jugador, 2 en el mismo dispositivo u online con código. Se publica en GitHub Pages desde `main`: https://zeroping7.github.io/RetroGaming/

## Antes de cualquier tarea
1. Lee `docs/constitucion.md` (reglas no negociables).
2. Lee `docs/arquitectura.md` y `docs/decisiones.md`.
3. Lee la spec, el plan y las tareas de la carpeta `specs/NNN-*` en la que se trabaja.

## Sobre el usuario
- Programador Android con poca experiencia en videojuegos: cuando aparezca un concepto de gamedev por primera vez (tick, interpolación, predicción...), explícalo en 1-2 frases, con un paralelismo Android si ayuda.
- Explicaciones breves y concisas.
- Trabaja **solo desde el móvil**: no le pidas comandos de terminal, Node ni herramientas locales. Todo se prueba abriendo la web de GitHub Pages.

## Flujo Spec Driven Development
Cada juego o funcionalidad vive en `specs/NNN-nombre/` con tres archivos:

| Paso | Archivo | Contenido | Quién aprueba |
|---|---|---|---|
| 1. Especificar | `spec.md` | QUÉ y POR QUÉ (sin detalles técnicos) | Usuario |
| 2. Planificar | `plan.md` | CÓMO (archivos, estado, red, escenas) | Usuario |
| 3. Desglosar | `tareas.md` | Tareas pequeñas, ordenadas y verificables | Usuario |
| 4. Implementar | código | Una tarea cada vez | Usuario la prueba |

Órdenes que usará el usuario:
- **"spec de X"** → copia `specs/_plantillas/spec-juego.md` (o `spec-feature.md`) a `specs/NNN-x/spec.md` (NNN = siguiente número libre), rellena lo que sepas y haz las preguntas de "Preguntas abiertas". No escribas código.
- **"plan de NNN"** → solo si la spec está *Aprobada*. Usa `specs/_plantillas/plan.md`.
- **"tareas de NNN"** → solo si el plan está *Aprobado*. Usa `specs/_plantillas/tareas.md`.
- **"implementa TNNN"** → implementa SOLO esa tarea, marca su casilla y termina diciendo cómo probarla en el móvil.

## Reglas de trabajo
- Nunca escribas código de un juego sin spec y plan aprobados (salvo que el usuario pida explícitamente un "prototipo").
- Si al implementar descubres que la spec o el plan están mal, para, propón el cambio y actualiza el documento antes de seguir.
- Cada tarea termina con todo funcionando en `main` (es lo que se publica).
- En cada cambio: sube `src/version.js` (el pie del menú la muestra) y, si añades o renombras archivos, actualiza `FILES` y `CACHE` en `sw.js`.
- Un juego nuevo se da de alta en `juegos/registro.js` y necesita una `portada.svg` sin texto.
- Toda decisión técnica relevante se apunta en `docs/decisiones.md`.

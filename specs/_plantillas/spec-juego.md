# Spec: <Nombre del juego>

> **ID:** NNN-<id> · **Estado:** Borrador | En revisión | Aprobada | Implementada · **Fecha:**
> Esta spec describe QUÉ y POR QUÉ. Nada de código, archivos ni librerías.

## 1. Resumen
<!-- 2-3 frases. ¿Qué es y por qué es divertido? -->

## 2. Objetivo
- **Victoria:**
- **Derrota:**
- **Duración de una partida:** <!-- p. ej. 5-10 min -->

## 3. Modos
| | 1 jugador | 2 en el mismo dispositivo | Online (2) |
|---|---|---|---|
| ¿Existe? | sí | sí / no | sí / no |
| Qué hace cada jugador | | | |
| Vidas / salud | | ¿compartidas? | ¿compartidas? |
| Si uno cae | — | ¿reaparece? ¿espera? | |
| Dificultad | | ¿escala con 2? | |

## 4. Bucle de juego
<!-- Lo que el jugador repite cada pocos segundos. Ej: correr → saltar → recoger → esquivar. -->

## 5. Controles
| Acción del juego | Acción abstracta | Notas |
|---|---|---|
| Moverse | left / right | |
| Saltar | a | ¿salto más alto si se mantiene? |
| | b | |
| Pausa | start | |

## 6. Entidades
| Entidad | Comportamiento | Interacción con jugadores |
|---|---|---|
| Jugador 1 / 2 | | |
| Enemigo X | | |
| Objeto Y | | |

## 7. Niveles y progresión
<!-- Nº de niveles en v1, cómo se pasa de uno a otro, ¿se guarda récord o progreso? -->

## 8. Pantalla y cámara
- **Orientación:** vertical / horizontal
- **Resolución lógica:** <!-- p. ej. 400×560 vertical, 480×270 horizontal -->
- **Cámara con 2 jugadores:** compartida (sigue a ambos) / pantalla dividida / fija
- **HUD:** <!-- qué se muestra siempre -->

## 9. Online
- **Nivel de red:** A (eventos) / B (interpolación) / C (predicción) — ver `docs/arquitectura.md` §5
- **Qué debe verse idéntico en ambos móviles:** <!-- posiciones, puntuación... -->
- **Qué puede diferir sin importar:** <!-- partículas, efectos -->
- **Momentos clave que nunca se pueden perder:** <!-- muerte, nivel completado... -->

## 10. Arte y sonido
- **Estilo:** <!-- pixel art, formas planas... (paleta común en constitución AR3) -->
- **Portada del cartucho:** <!-- qué escena muestra (sin texto) -->
- **Música y efectos:**

## 11. Historias de usuario
<!-- Como <jugador>, quiero <acción> para <beneficio>. Criterios en Dado / Cuando / Entonces. -->

**HU-1 —**
- [ ] Dado … cuando … entonces …

**HU-2 —**
- [ ] Dado … cuando … entonces …

## 12. Fuera de alcance (v1)
-

## 13. Preguntas abiertas
- [ ]

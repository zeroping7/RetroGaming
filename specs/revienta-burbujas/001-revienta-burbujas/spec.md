# Spec: Revienta Burbujas

> **ID:** 001-revienta-burbujas · **Estado:** Implementada (documentada después de hacerla) · **Fecha:** 2026-10-20

## 1. Resumen
Arcade de disparo vertical: cada jugador lanza un arpón hacia arriba para partir burbujas que rebotan. Las grandes se dividen en dos más pequeñas hasta desaparecer.

## 2. Objetivo
- **Victoria:** limpiar todas las burbujas del nivel (+500 puntos) y pasar al siguiente. Niveles sin fin.
- **Derrota:** quedarse sin vidas al ser tocado por una burbuja.
- **Duración de una partida:** de 2 a 10 minutos.

## 3. Modos
| | 1 jugador | 2 en el mismo dispositivo | Online (2) |
|---|---|---|---|
| ¿Existe? | sí | sí | sí |
| Qué hace cada jugador | dispara | ambos disparan | ambos disparan |
| Vidas | 3 | 5 compartidas | 5 compartidas |
| Si uno es tocado | se reinicia el nivel | se reinicia el nivel para los dos | igual |
| Dificultad | | +1 burbuja por nivel | igual que 2 locales |

## 4. Bucle de juego
Moverse → colocarse bajo una burbuja → disparar → esquivar los trozos.

## 5. Controles
| Acción | Teclado | Mando | Táctil |
|---|---|---|---|
| Moverse | `← →` (J2: `A D`) | cruceta / stick | ◀ ▶ |
| Disparar | `Espacio` (J2: `W`) | A (cualquier botón frontal) | DISPARO |

Un disparo a la vez por jugador.

## 6. Entidades
| Entidad | Comportamiento | Interacción |
|---|---|---|
| Jugador 1 / 2 | se mueve por el suelo | muere si le toca una burbuja |
| Burbuja (4 tamaños) | rebota con gravedad; cada tamaño bota a su altura | el arpón la parte en dos del tamaño inferior; la más pequeña desaparece |
| Arpón | sube desde el jugador hasta el techo | revienta la primera burbuja que toca |

Puntos por burbuja, de pequeña a grande: 100, 60, 40, 20.

## 7. Niveles y progresión
Cada dos niveles hay una burbuja más (hasta 4, +1 con dos jugadores) y desde el nivel 2 empiezan en el tamaño máximo. El récord se guarda en el dispositivo y se ve en el menú de RetroGaming.

## 8. Pantalla
- **Orientación:** vertical, 400×560 lógicos.
- **Cámara:** fija.
- **HUD:** puntos, nivel, vidas y récord (o código y servidores online).

## 9. Online
- **Nivel de red:** C (predicción). El invitado mueve su personaje y su disparo al instante; las burbujas se adelantan según el retardo medido y se corrigen suavemente.
- **Idéntico en ambos:** burbujas, puntos, vidas, nivel.
- **Puede diferir un instante:** posición exacta del otro jugador, anillos de explosión.

## 10. Arte y sonido
- Formas planas en canvas, paleta común (constitución AR3).
- Portada: dos jugadores disparando a burbujas de los 4 tamaños.
- Sin sonido.

## 11. Historias de usuario
**HU-1 — Partida rápida.**
- [x] Dado el menú del juego, cuando pulso "1 JUGADOR", entonces empieza el nivel 1 con 3 vidas.

**HU-2 — Cooperativo en el mismo móvil.**
- [x] Dado "2 JUGADORES", entonces aparecen los botones táctiles del J2 y compartimos 5 vidas.

**HU-3 — Cooperativo online.**
- [x] Dado que creo partida y mi compañero escribe el código, entonces la partida empieza y ambos vemos lo mismo.

## 12. Fuera de alcance
- Sonido, objetos especiales, tipos de arma.

## 13. Preguntas abiertas
- [x] ¿Añadir sonido y objetos (arpón doble, escudo)? → Objetos y armas: **sí**, en la spec 002. Sonido: **sí**, en la spec 003.
- [x] ¿Migrarlo a la estructura `sim.js` + Phaser cuando toque cambiarlo a fondo? (D-006) → `sim.js`, `render.js` y `tests.html` **sí** (T001 de 002); Phaser **no**.

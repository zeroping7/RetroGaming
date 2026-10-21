# Spec de funcionalidad: Armas y objetos de Revienta Burbujas

> **ID:** 002-rb-armas · **Estado:** Borrador · **Fecha:** 2026-10-21
> Amplía el juego `specs/001-revienta-burbujas/`. Inspirado en los arcades de burbujas de los 90 (mecánicas, no sus gráficos ni nombres: constitución AR2).
> El juego de puzzle/tablero previsto como siguiente pasa a ser la spec 003.

## 1. Problema
Hoy solo hay un arpón y nada cambia de un nivel a otro salvo el número de burbujas. Falta variedad y algo que recoger.

## 2. Objetivo
Al reventar burbujas a veces cae un objeto. Recogerlo cambia el arma o da una ayuda temporal, así que cada nivel se juega distinto y hay decisiones (¿voy a por el objeto o esquivo?).

## 3. Armas
Solo se lleva un arma a la vez. Todas parten las burbujas igual que hoy (la grande en dos del tamaño inferior).

| Arma | Cómo se ve | Qué hace |
|---|---|---|
| **Arpón** (la de siempre) | punta definida + cuerda fina hasta el jugador | uno a la vez; sube hasta una burbuja o el techo |
| **Arpón doble** | igual, pero pueden coexistir dos | hasta 2 en pantalla a la vez, cada uno independiente |
| **Arpón fijo** | cuerda más gruesa y brillante, tensa | al llegar al techo se queda clavado unos segundos como barrera; revienta lo que la toque |
| **Arpón triple** | tres líneas paralelas bien separadas | un disparo lanza tres arpones a la vez, cada uno con su colisión |

## 4. Potenciadores (no son armas)
| Objeto | Efecto |
|---|---|
| **Velocidad** | el arpón sube más rápido durante un tiempo |
| **Escudo** | un aro alrededor del jugador que aguanta un golpe |
| **Dinamita** (limpieza) | todas las burbujas pasan al tamaño más pequeño |
| **Reloj** (limpieza) | las burbujas se congelan unos segundos |

Los objetos son iconos pequeños que caen desde donde estalló la burbuja, se quedan en el suelo un rato y se recogen tocándolos. El efecto es inmediato.

## 5. Historias de usuario
**HU-1 — Encontrar objetos.** Como jugador, quiero que a veces caiga un objeto al reventar una burbuja para tener ayudas.
- [ ] Dado que reviento una burbuja, cuando toca, entonces cae un objeto que puedo ver y reconocer.
- [ ] Dado un objeto en el suelo, cuando paso por encima, entonces se aplica su efecto y desaparece.
- [ ] Dado un objeto que nadie recoge, cuando pasa un tiempo, entonces parpadea y desaparece.

**HU-2 — Cambiar de arma.** Como jugador, quiero recoger armas distintas para cubrir más pantalla.
- [ ] Dado el arpón doble, cuando disparo dos veces seguidas, entonces veo dos arpones a la vez.
- [ ] Dado el arpón fijo, cuando llega al techo, entonces se queda clavado unos segundos y revienta lo que lo toque.
- [ ] Dado el arpón triple, cuando disparo, entonces salen tres líneas separadas.
- [ ] Dado que recojo un arma, entonces sustituye a la que llevaba.

**HU-3 — Ayudas temporales.**
- [ ] Dado el escudo, cuando me toca una burbuja, entonces pierdo el escudo pero no la vida.
- [ ] Dado la dinamita, entonces todas las burbujas pasan a ser pequeñas.
- [ ] Dado el reloj, entonces las burbujas se paran unos segundos y lo indica el HUD.

**HU-4 — Con dos jugadores.**
- [ ] Dado el modo 2 jugadores (local u online), cuando uno recoge un arma, entonces solo cambia la suya.
- [ ] Dado el modo online, entonces los dos vemos los mismos objetos y quién los recoge.

## 6. Requisitos no funcionales
- R1: sigue a 60 FPS con 3 arpones por jugador y varios objetos en pantalla.
- R2: el tráfico online sigue por debajo de 20 KB/s (objetos y armas entran en la instantánea).
- El disparo del invitado sigue siendo instantáneo en su pantalla (predicción, nivel C).
- C1: todo se juega igual con táctil, teclado y mando; no hacen falta botones nuevos.

## 7. Fuera de alcance
- Sonido (irá en otra spec).
- Armas fuera del estilo del arpón (pistola, láser…).
- Gráficos o nombres del juego original.

## 8. Preguntas abiertas
Cada una lleva mi propuesta; con "sí" vale.
- [ ] **P1 — Probabilidad de que caiga un objeto.** Propuesta: 1 de cada 8 burbujas reventadas, máximo 2 objetos en pantalla.
- [ ] **P2 — ¿Se pierde el arma al morir?** Propuesta: sí, vuelves al arpón normal (como en el arcade).
- [ ] **P3 — ¿Las armas duran para siempre o un tiempo?** Propuesta: para siempre hasta morir o recoger otra; los potenciadores sí son temporales (velocidad 10 s, reloj 5 s).
- [ ] **P4 — Arpón fijo.** Propuesta: se queda clavado 3 s o hasta que lo toca una burbuja; solo uno a la vez.
- [ ] **P5 — Arpón triple.** Propuesta: tres líneas paralelas separadas 24 píxeles (centro y a cada lado), un disparo a la vez.
- [ ] **P6 — Escudo.** Propuesta: aguanta un golpe y no caduca; al romperse, 1 s de invulnerabilidad parpadeando.
- [ ] **P7 — ¿Dinamita y reloj, o ninguno?** Propuesta: los dos, pero más raros que el resto.
- [ ] **P8 — Puntos.** Propuesta: recoger un objeto da 100 puntos.
- [ ] **P9 — Pixel art.** La constitución (AR1) pide primero formas planas y el arte en la fase de pulido. Propuesta: armas y objetos primero en formas simples pero ya reconocibles; el pixel art de todo el juego (jugadores, burbujas, objetos), dibujado por código, en una tarea final de pulido de esta misma spec.
- [ ] **P10 — Estructura del código (D-006).** Es un cambio a fondo del juego. Propuesta: aprovecharlo para separar la lógica en `sim.js` con su `tests.html` (constitución A1 y Q3), sin pasar a Phaser.

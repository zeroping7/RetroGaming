# Spec de funcionalidad: Armas y objetos de Revienta Burbujas

> **ID:** 002-armas · **Estado:** Implementada (v0.7.0) · **Fecha:** 2026-10-21
> Amplía el juego `specs/revienta-burbujas/001-revienta-burbujas/`. Inspirado en los arcades de burbujas de los 90 (mecánicas, no sus gráficos ni nombres: constitución AR2).
> El juego de puzzle/tablero previsto como siguiente pasa a ser la spec 004 (la 003 es el sonido).

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

Los objetos son iconos pequeños que caen desde donde estalló la burbuja, al tocar el suelo esperan **10 segundos** (parpadeando al final) y, si nadie los coge, desaparecen. Se recogen tocándolos. El efecto es inmediato.

## 5. Historias de usuario
**HU-1 — Encontrar objetos.** Como jugador, quiero que a veces caiga un objeto al reventar una burbuja para tener ayudas.
- [x] Dado que reviento una burbuja, cuando toca, entonces cae un objeto que puedo ver y reconocer.
- [x] Dado un objeto en el suelo, cuando paso por encima, entonces se aplica su efecto y desaparece.
- [x] Dado un objeto en el suelo que nadie recoge, cuando pasan 10 s, entonces desaparece (parpadea los últimos 2 s).

**HU-2 — Cambiar de arma.** Como jugador, quiero recoger armas distintas para cubrir más pantalla.
- [x] Dado el arpón doble, cuando disparo dos veces seguidas, entonces veo dos arpones a la vez.
- [x] Dado el arpón fijo, cuando llega al techo, entonces se queda clavado unos segundos y revienta lo que lo toque.
- [x] Dado el arpón triple, cuando disparo, entonces salen tres líneas separadas.
- [x] Dado que recojo un arma, entonces sustituye a la que llevaba.

**HU-3 — Ayudas temporales.**
- [x] Dado el escudo, cuando me toca una burbuja, entonces pierdo el escudo pero no la vida.
- [x] Dado la dinamita, entonces todas las burbujas pasan a ser pequeñas.
- [x] Dado el reloj, entonces las burbujas se paran unos segundos y lo indica el HUD.
- [x] Dado el reloj activo, cuando un arpón toca una burbuja congelada, entonces se rompe igual que siempre.

**HU-4 — Con dos jugadores.**
- [x] Dado el modo 2 jugadores (local u online), cuando uno recoge un arma, entonces solo cambia la suya.
- [x] Dado el modo online, entonces los dos vemos los mismos objetos y quién los recoge.

## 6. Requisitos no funcionales
- R1: sigue a 60 FPS con 3 arpones por jugador y varios objetos en pantalla.
- R2: el tráfico online sigue por debajo de 20 KB/s (objetos y armas entran en la instantánea).
- El disparo del invitado sigue siendo instantáneo en su pantalla (predicción, nivel C).
- C1: todo se juega igual con táctil, teclado y mando; no hacen falta botones nuevos.

## 7. Fuera de alcance
- Sonido (irá en otra spec).
- Armas fuera del estilo del arpón (pistola, láser…).
- Gráficos o nombres del juego original.
- Pixel art: el juego mantiene sus formas planas (P9).

## 8. Preguntas abiertas
- [x] P1 — Cae un objeto en 1 de cada 8 burbujas reventadas, máximo 2 en pantalla.
- [x] P2 — El arma se pierde al morir: se vuelve al arpón normal.
- [x] P3 — Las armas duran hasta morir o recoger otra; los potenciadores son temporales (velocidad 10 s, reloj 5 s).
- [x] P4 — El arpón fijo se queda clavado 3 s o hasta que lo toca una burbuja; uno a la vez.
- [x] P5 — El arpón triple lanza tres líneas paralelas separadas 24 píxeles; un disparo a la vez.
- [x] P6 — El escudo aguanta un golpe y no caduca; al romperse, 1 s de invulnerabilidad parpadeando.
- [x] P7 — Dinamita y reloj, los dos, más raros que el resto.
- [x] P8 — Recoger un objeto da 100 puntos.
- [x] P9 — Sin pixel art: armas y objetos con el mismo estilo de formas planas del juego (constitución AR3).
- [x] P10 — Se separa la lógica en `sim.js` con su `tests.html` (A1, Q3), sin pasar a Phaser.

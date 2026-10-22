# Spec de funcionalidad: Sonido de Revienta Burbujas

> **ID:** 003-sonido · **Estado:** Implementada (v0.8.0) · **Fecha:** 2026-10-22
> Aprobada por el usuario al pedir «implementa todos los sonidos». Cierra la pregunta abierta de sonido de la spec 001.
> El juego de puzzle/tablero previsto pasa a ser la spec 005.

## 1. Problema
El juego no tiene sonido: disparar, reventar o recoger un objeto no se «siente».

## 2. Objetivo
Efectos de sonido retro para todo lo que pasa en la partida, en 1 y 2 jugadores y online, con un botón para silenciarlos.

## 3. Sonidos
| Momento | Sonido |
|---|---|
| Empieza el nivel | dos pitidos cortos |
| Disparo (normal, doble, triple) | «piu» corto que sube |
| Arpón fijo se clava en el techo | golpe metálico |
| Burbuja revienta | «pop»; más grave cuanto más grande |
| Cae un objeto | campanilla corta |
| Recoger objeto | arpegio que sube |
| Dinamita | explosión |
| Reloj | tic-tac |
| Escudo roto | golpe sordo |
| Pierdes una vida | silbido que baja |
| Nivel limpio | melodía corta alegre |
| Fin de partida | melodía corta triste |

## 4. Historias de usuario
**HU-1 — Oír la partida.**
- [x] Dado cualquier momento de la tabla, entonces suena su efecto.
- [x] Dado el modo online, entonces los dos oímos los sonidos de la partida; mi propio disparo suena al instante.

**HU-2 — Silenciar.**
- [x] Dado el botón de sonido (o la tecla M), cuando lo pulso, entonces se silencia o vuelve el sonido, y se recuerda para la próxima vez.

## 5. Requisitos no funcionales
- Sin archivos de audio: todo generado con código (Web Audio), sin licencias que anotar (AR2).
- Nada de sonido hasta el primer toque o tecla (los navegadores lo exigen).
- Sin acumular ruido: si suenan muchos estallidos a la vez (dinamita), se limitan.

## 6. Fuera de alcance
- Música de fondo.
- Sonidos en el menú principal de RetroGaming.

## 7. Preguntas abiertas
- [x] ¿Volumen ajustable? → No, solo activar/silenciar.

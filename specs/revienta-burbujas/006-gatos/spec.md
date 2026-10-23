# Spec de funcionalidad: Gatos en Revienta Burbujas

> **ID:** 006-gatos · **Estado:** Implementada (v0.14.0) · **Fecha:** 2026-10-23
> Pedida por el usuario: los dos jugadores pasan a ser los gatos de Lanza Burbujas (spec 005).

## 1. Problema
Los jugadores eran figuras provisionales (greybox, AR1). Los gatos del usuario ya existen en Lanza Burbujas.

## 2. Objetivo
Que J1 sea el gato atigrado y J2 la gata tricolor, con el mismo dibujo en los dos juegos.

## 3. Historias de usuario
**HU-1 — Jugar con los gatos.**
- [x] Dado cualquier modo, entonces J1 es el gato atigrado (collar turquesa) y J2 la gata tricolor (collar rosa).
- [x] Dado que disparo, entonces mi gato pone cara contenta; si me toca una burbuja, cara triste. A ratos parpadea.
- [x] Dado que ando, entonces el gato mira hacia donde voy.

## 4. Requisitos no funcionales
- El dibujo vive en un solo sitio, `src/arte/gatos.js`, común a los juegos (antes estaba en `juegos/lanza-burbujas/`).
- No cambian las reglas ni la caja de choque del jugador (26×34): online sigue igual (protocolo v9).

## 5. Fuera de alcance
- Elegir otro gato o los rivales de Lanza Burbujas.

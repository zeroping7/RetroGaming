# Plan técnico: Sonido de Revienta Burbujas

> **Spec:** `specs/revienta-burbujas/003-sonido/spec.md` · **Estado:** Aprobado · **Fecha:** 2026-10-22

## 1. Cumplimiento de la constitución
- [x] A1 `sim.js` no toca el audio: solo anota **eventos** (`st.eventos`) y la página los convierte en sonido
- [x] P1/P3 Web Audio del navegador, sin librerías ni archivos
- [x] P5 Archivos nuevos en `FILES` de `sw.js`

## 2. Archivos
| Archivo | Responsabilidad |
|---|---|
| `src/audio/sintetizador.js` | común a todos los juegos: contexto de audio, silencio guardado (`rg-silencio`), tonos, ruido y notas |
| `juegos/revienta-burbujas/sonidos.js` | las «recetas» de cada sonido del juego |
| `juegos/revienta-burbujas/sim.js` | `st.eventos`: lista de `[código, dato]` de lo que ha pasado en el tick |
| `juegos/revienta-burbujas/index.html` | tras cada tick suena lo de `st.eventos`; botón ♪ y tecla M |

## 3. Eventos
`EVENTOS = ['listo', 'disparo', 'clavado', 'estallido', 'aparece', 'objeto', 'dinamita', 'reloj', 'escudo', 'muerte', 'limpio', 'fin']`.
El dato es el jugador (disparo, clavado, escudo, muerte), el tamaño (estallido) o el tipo (objeto).

## 4. Online
- El anfitrión junta los eventos desde la última instantánea y los manda en el campo `e` (pares planos).
- El invitado los suena al recibir la instantánea, salvo su propio disparo y clavado, que ya sonaron al instante con su predicción.
- Si se pierde una instantánea se pierde ese sonido: aceptable.

## 5. Mezcla
- Volumen general 0,35; cada sonido como mucho una vez cada 40 ms (los estallidos de la dinamita no se amontonan).
- El audio se activa con el primer toque o tecla.

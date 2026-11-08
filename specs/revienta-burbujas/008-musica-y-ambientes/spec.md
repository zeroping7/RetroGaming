# Spec de funcionalidad: Música y ambientes de Revienta Burbujas

> **ID:** 008-musica-y-ambientes · **Estado:** Implementada (v0.15.0) · **Fecha:** 2026-11-08
> Usa las piezas comunes de 007.

## 1. Problema
Los 4 mundos (PRADERA, DESIERTO, OCÉANO y VOLCÁN) solo se distinguen por el color y no hay música.

## 2. Objetivo
Cada mundo con su tema musical y su ambiente propio.

## 3. Historias de usuario
**HU-1 — Temas por mundo.**
- [x] Menú: un tema alegre y corto.
- [x] Pradera: alegre y saltarín. Desierto: escala «árabe», con percusión seca. Océano: lento y ondulante, con eco. Volcán: grave y tenso, con bajo insistente.
- [x] Dado que quedan 15 s o menos, entonces el tema va más rápido.
- [x] Dado que es la fase 5 de un mundo, entonces suena una variante más intensa (más percusión y una voz más).
- [x] Dado que supero una fase, entonces suena la fanfarria de victoria; si pierdo todas las vidas, la de fin de partida.

**HU-2 — Ambientes.**
- [x] Pradera: colinas, nubes que pasan y flores que se mecen.
- [x] Desierto: dunas, sol grande, cactus y la calima ondulando.
- [x] Océano: rayos de luz, algas, peces lejanos y burbujitas que suben (más pequeñas y apagadas que las de juego).
- [x] Volcán: montañas con lava que brilla, brasas que suben y un cielo rojizo que palpita.
- [x] El suelo y los bloques cambian de textura y color en cada mundo.

## 4. Requisitos no funcionales
- Igual que 007. Las colisiones, las fases y el protocolo no cambian.

## 5. Fuera de alcance
- Mundos nuevos o cambios en las fases.

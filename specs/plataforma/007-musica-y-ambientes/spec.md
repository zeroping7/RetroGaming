# Spec de funcionalidad: Música y ambientes (piezas comunes)

> **ID:** 007-musica-y-ambientes · **Estado:** Aprobada · **Fecha:** 2026-11-08
> Pedida por el usuario: mejorar la experiencia «a tope» con una canción por nivel y ambientes más distintos en los dos juegos. El contenido de cada juego va en 008 (Revienta Burbujas) y 009 (Lanza Burbujas).

## 1. Problema
Los juegos no tienen música de fondo, solo efectos. Los mundos apenas se diferencian: cambia el degradado del cielo y el nombre.

## 2. Objetivo
Cada mundo **se oye y se ve distinto**. Al cambiar de mundo, el jugador nota que ha llegado a un sitio nuevo.

## 3. Historias de usuario
**HU-1 — Música de fondo.**
- [ ] Dado que juego, entonces suena en bucle el tema del mundo, sin cortes al volver a empezar.
- [ ] Dado que cambio de fase dentro del mismo mundo, entonces el tema sigue sin reiniciarse.
- [ ] Dado que queda poco tiempo o llega el último nivel del mundo, entonces el tema se acelera o se intensifica.
- [ ] Dado que gano, pierdo o vuelvo al menú, entonces suena una melodía corta o el tema del menú.

**HU-2 — Controlar el volumen.**
- [ ] Dado el botón de sonido, entonces puedo elegir entre todo, solo efectos o silencio. Se recuerda en los dos juegos.
- [ ] Dado que la pestaña pasa a segundo plano o pauso, entonces la música se para; al volver, sigue.

**HU-3 — Ambientes con capas.**
- [ ] Dado un mundo, entonces el fondo tiene 2-3 capas con elementos propios y alguna animación suave: nubes, brasas, peces, estrellas...
- [ ] Dado que juego, entonces el fondo nunca tapa ni confunde las burbujas: es más oscuro y menos saturado que ellas.

## 4. Requisitos no funcionales
- Todo es **propio y generado con código**, como ya se hace con los efectos (AR2, D-011): composiciones originales en estilo chiptune, sin archivos de audio ni imágenes descargadas.
- Rendimiento (constitución §3): sigue a 60 fps en un móvil de gama media. Los fondos se dibujan una vez a lienzos y solo se mueven; la música se programa por adelantado con Web Audio, no en cada frame.
- En online, la música y el fondo son locales: no cambian el protocolo de red.

## 5. Fuera de alcance
- Una canción distinta para cada nivel (serían 50): una por mundo, con variaciones. Las fases generadas a partir de la 21 de Revienta Burbujas reutilizan los temas.
- Editor de música, deslizador de volumen fino.

## 6. Preguntas abiertas
- [x] ¿Una canción por nivel o por mundo? → Por mundo con variaciones (el usuario lo deja a criterio de Claude).
- [x] ¿En qué juegos? → En los dos.

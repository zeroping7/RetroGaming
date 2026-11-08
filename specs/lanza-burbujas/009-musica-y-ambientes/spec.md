# Spec de funcionalidad: Música y ambientes de Lanza Burbujas

> **ID:** 009-musica-y-ambientes · **Estado:** Implementada (v0.15.0) · **Fecha:** 2026-11-08
> Usa las piezas comunes de 007.

## 1. Problema
Los 6 mundos (SALÓN, JARDÍN, TEJADOS, COCINA, DESVÁN y LUNA) solo cambian el color del cielo y del marco, y no hay música.

## 2. Objetivo
Cada mundo con su tema musical y un fondo que cuente dónde están los gatos.

## 3. Historias de usuario
**HU-1 — Temas por mundo.**
- [x] Menú: un tema juguetón de gatos.
- [x] Salón: tranquilo y hogareño. Jardín: alegre, con «pájaros». Tejados: nocturno y travieso, con bajo andante. Cocina: rápido y burbujeante. Desván: misterioso, con caja de música. Luna: espacial y flotante.
- [x] Dado que el techo está a punto de bajar o las burbujas están cerca del límite, entonces el tema se acelera.
- [x] Dado que es el nivel 5 de un mundo, entonces suena la variante intensa.
- [x] Dado el modo VS (2 jugadores o contra la CPU), entonces suena un tema de duelo propio. Contra la REINA, el último rival, una variante «final».
- [x] Al ganar o perder suenan fanfarrias cortas.

**HU-2 — Ambientes.**
- [x] Salón: ventana con cortinas, sofá y una lámpara que brilla.
- [x] Jardín: valla, flores y mariposas.
- [x] Tejados: chimeneas, luna, estrellas que titilan y ventanas que se encienden.
- [x] Cocina: azulejos, estantes y vapor que sube de una olla.
- [x] Desván: vigas, cajas, telarañas y polvo flotando a contraluz.
- [x] Luna: la Tierra al fondo, cráteres y estrellas fugaces.
- [x] Siempre detrás del tablero y apagado, para que se lean bien los colores de las burbujas.

## 4. Requisitos no funcionales
- Igual que 007. Los niveles, la CPU y el protocolo no cambian.

## 5. Fuera de alcance
- Mundos o niveles nuevos.

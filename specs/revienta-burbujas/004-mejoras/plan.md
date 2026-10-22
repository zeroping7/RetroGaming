# Plan técnico: Mejoras arcade de Revienta Burbujas

> **Spec:** `specs/revienta-burbujas/004-mejoras/spec.md` · **Estado:** Aprobado · **Fecha:** 2026-10-22

## 1. Cumplimiento de la constitución
- [x] A1 Todo en `sim.js` (reglas) y `render.js` (dibujo); las fases son datos en `fases.js`
- [x] AR2 Fases, fondos, frutas e iconos propios, dibujados con formas
- [x] Q3 Pruebas nuevas en `tests.html` por cada bloque

## 2. Bloque A — reglas rápidas
| Regla | Valor inicial |
|---|---|
| Tiempo del nivel | 45 s + 15 s por burbuja inicial (máx. 100 s); en fases diseñadas, el de la fase |
| Tiempo agotado | se pierde una vida (nadie pierde el arma) |
| Bonus de tiempo | 20 puntos por segundo que sobra |
| Combo | burbujas seguidas del mismo tamaño, sin pasar 3 s entre ellas; puntos × n (máx. ×8) |
| Vida extra | 20.000, 50.000 y cada 50.000; máximo 9 vidas |
| Objetos nuevos | `fruta` (+500, peso 15) y `vida` (1UP, peso 1) |
- Textos flotantes (`st.textos`: «x3», «1UP», «+500») que suben y se desvanecen; viajan en la instantánea.
- Eventos de sonido nuevos: `combo`, `vida`, `tiempo` (se acabó) y `aviso` (cada segundo de los últimos 10).

## 3. Bloque B — escenario
- Bloque: `{ x, y, w, h, duro }`. Las burbujas rebotan en él (círculo contra rectángulo, por el lado más cercano); el arpón se para en su cara inferior (el fijo se clava ahí); el rompible desaparece al tocarlo un arpón.
- Hexagonal: `hex: true`, velocidad constante en diagonal, rebota en paredes, techo, suelo y bloques sin gravedad.
- Burbuja de objeto: `obj: true`; al reventar suelta siempre un objeto (aunque haya 2 en pantalla).
- En la red viaja qué bloques quedan (una máscara de bits) y las marcas `hex`/`obj` de cada burbuja.

## 4. Bloque C — fases
- `fases.js`: lista de `{ mundo, tiempo, burbujas: [{ s, x, y, dir, hex?, obj? }], bloques: [{ x, y, w, h, duro? }] }`.
- 4 mundos de 5 fases, cada uno con fondo propio dibujado en `render.js`. A partir de la 21, fases generadas con semilla.
- Pantalla «MUNDO N» al empezar cada mundo.

## 5. Bloque D — final de partida
- Continuar: fase `continuar` con cuenta atrás de 10 s; disparo para seguir (puntos a 0, mismas vidas iniciales, misma fase).
- Récords: `localStorage` `rb-records` (top 10: puntos, iniciales, fase). Entrada de iniciales con izquierda/derecha y disparo, también táctil. Online cada móvil guarda la suya.

## 6. Online
- Versión del protocolo 7 (bloque A) y siguientes según se avance.

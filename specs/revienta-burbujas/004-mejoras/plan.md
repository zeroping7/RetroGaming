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
- En la red viajan los bloques que quedan (`k`: x, y, w, h, duro; son pocos) y las marcas `hex`/`obj` dentro del tamaño de cada burbuja (+8, +16).
- Romper un bloque da 50 puntos. Los objetos se posan encima de los bloques.
- Hasta el bloque C, los niveles generados ponen bloques desde el 2, una burbuja de objeto a veces y hexagonales desde el 3. `?nivel=N` empieza en ese nivel.

## 4. Bloque C — fases
- `fases.js`: lista de `{ mundo, tiempo, burbujas: [{ s, x, y, dir, hex?, obj? }], bloques: [{ x, y, w, h, duro? }] }`.
- 4 mundos de 5 fases, cada uno con fondo propio dibujado en `render.js`: Pradera (lo básico), Desierto (bloques), Océano (hexagonales) y Volcán (todo junto). A partir de la 21, fases generadas con semilla.
  - Los fondos se pintan una vez en un canvas aparte y se copian en cada fotograma (R1).
  - Las generadas salen de la semilla de la partida y su número (al morir se repite la misma): 2-5 burbujas (sobre todo grandes), más hexagonales y bloques duros cuanto más lejos. Mundos 5, 6… repiten los 4 fondos.
- Con 2 jugadores, cada fase tiene una burbuja más: un tamaño menos que la primera, donde haya más hueco. El tiempo es el de la fase.
- Pantalla «MUNDO N» y su nombre al empezar cada mundo (también en la fase 1): la cuenta inicial dura 2,8 s en vez de 1,4. No sale al repetir la fase tras morir. Evento de sonido `mundo`.
- Online: el invitado lo deduce del nivel y de la cuenta (`v`, `t`); los bloques ya viajaban (bloque B).

## 5. Bloque D — final de partida
- Continuar: fase `continuar` con cuenta atrás de 10 s; disparo para seguir (puntos a 0, mismas vidas iniciales, misma fase).
  - Cuenta solo un disparo nuevo: el que se traía pulsado al morir no vale. Con 2 jugadores puede seguir cualquiera. Suenan `aviso` cada segundo y `continua` al seguir.
- Récords: `localStorage` `rb-records` (top 10: puntos, iniciales, fase). Entrada de iniciales con izquierda/derecha y disparo, también táctil. Online cada móvil guarda la suya.
  - Como continuar pone los puntos a 0, el récord que se apunta es el mejor tramo de la partida (`st.mejor`: puntos y fase), no solo el último (D-012).
  - `records.js`: funciones puras (`entra`, `insertar`, `limpiar`) y `leer`/`guardar` validando lo guardado. Con empate, la nueva queda debajo.
  - Letras A-Z y 0-9; se recuerdan las últimas iniciales (`rb-iniciales`, `rb-iniciales2`). Táctil: los botones ◀ DISPARO ▶ de abajo, y tocar una letra la avanza (o vuelve a ella si ya estaba hecha).
  - Con 2 jugadores en el mismo móvil, primero J1 y luego J2, cada uno con sus controles; se guarda «ABC/XYZ». Online, cada móvil apunta sus iniciales.
  - Mientras se escriben, el juego no recibe esas pulsaciones (tampoco el disparo con el que se cierra la tabla).
  - Botón «RÉCORDS» en el menú del juego.

## 6. Online
- Versión del protocolo 7 (bloque A), 8 (bloque B) y 9 (bloque D: estado `continuar` y `mp`/`mf`, lo mejor de la partida).

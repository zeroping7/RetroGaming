# Spec de funcionalidad: Mejoras arcade de Revienta Burbujas

> **ID:** 004-mejoras · **Estado:** Aprobada · **Fecha:** 2026-10-22
> Mecánicas clásicas del género, con diseño propio: fases, fondos, frutas y gráficos inventados (AR2). No se usa material del juego original.
> El juego de puzzle/tablero pasa a ser la spec 005.

## 1. Problema
Todos los niveles son iguales salvo el número de burbujas, no hay prisa ni recompensas por jugar bien, y la partida se acaba sin más.

## 2. Objetivo
Más tensión (tiempo), más variedad (escenarios, burbujas y fases diseñadas) y más motivos para volver (combos, vidas extra, récords).

## 3. Historias de usuario
**A — Reglas rápidas**
- **HU-1 Tiempo.** Cada nivel tiene cuenta atrás; a 0 se pierde una vida; al limpiar, el tiempo que sobra da puntos. Parpadea en los últimos 10 s.
- **HU-2 Combos.** Reventar seguidas burbujas del mismo tamaño multiplica sus puntos (x2, x3…), y se ve el multiplicador.
- **HU-3 Vida extra.** A los 20.000 y 50.000 puntos y luego cada 50.000; y un objeto «1UP» muy raro.
- **HU-4 Fruta.** A veces cae fruta que solo da puntos.

**B — Escenario**
- **HU-5 Bloques.** Hay bloques en la pantalla: las burbujas rebotan en ellos y los arpones se paran. Unos se rompen de un disparo; otros no.
- **HU-6 Burbujas hexagonales.** Se mueven en diagonal sin gravedad y se parten igual.
- **HU-7 Burbuja de objeto.** Brilla y siempre suelta un objeto.

**C — Fases**
- **HU-8 Fases diseñadas.** Unas 20 fases hechas a mano en mundos de 5, cada mundo con su fondo; después, fases generadas cada vez más difíciles. Al cambiar de mundo se anuncia.

**D — Final de partida**
- **HU-9 Continuar.** Al perder todas las vidas, 10 s para continuar en la misma fase con los puntos a 0, sin límite de veces.
- **HU-10 Récords.** Top 10 guardado en el móvil, con 3 iniciales (con 2 jugadores, una entrada con las dos iniciales). Se ve desde el menú del juego.

## 4. Requisitos no funcionales
- Online: el anfitrión decide todo; las fases se identifican por número (los bloques no viajan enteros).
- R2: tráfico por debajo de 20 KB/s. R1: 60 FPS con bloques y fondos.

## 5. Fuera de alcance
- Modo sin fin (descartado por el usuario).
- Música.

## 6. Preguntas abiertas
- [x] ¿Se pierde una vida al acabarse el tiempo? → Sí.
- [x] ¿Continuar ilimitado? → Sí, con los puntos a 0.
- [x] ¿Récords con 2 jugadores? → Una entrada con las dos iniciales.
- [x] ¿Orden? → A → B → C → D, subiendo cada bloque para probarlo.

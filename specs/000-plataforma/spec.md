# Spec de funcionalidad: Plataforma (menú, partidas y controles)

> **ID:** 000-plataforma · **Estado:** Aprobada (menú implementado; resto en `tareas.md`) · **Fecha:** 2026-10-20

## 1. Problema
Faltaba la base común: un menú para elegir juego, una forma de jugar con otra persona a distancia y unos controles iguales en todos los juegos.

## 2. Objetivo
Abrir la web desde cualquier dispositivo, elegir un juego como en una consola retro y jugar solo, con alguien en el mismo dispositivo o a distancia con un código.

## 3. Historias de usuario

**HU-1 — Menú tipo consola.** Como jugador, quiero ver los juegos como cartuchos y elegir uno.
- [x] Dado que abro la web, cuando carga, entonces veo un estante de cartuchos con su portada y título.
- [x] Dado el menú, cuando deslizo el dedo, uso `←/→` o la cruceta, entonces cambia el cartucho seleccionado y su descripción.
- [x] Dado un juego seleccionado, cuando toco el cartucho o "JUGAR", pulso `Enter` o `A`, entonces entro en ese juego.
- [x] Las ranuras vacías dicen "Próximamente" y no se pueden lanzar.
- [x] Si el juego guarda récord, el menú lo muestra.
- [x] El pie muestra la versión y la ayuda del control que estoy usando.

**HU-2 — Volver al menú.** Como jugador, quiero salir de un juego al menú.
- [x] Cada juego tiene "◀ Menú RetroGaming"; `Esc` en su menú hace lo mismo.
- [x] Al volver con el botón "atrás" del navegador, el menú funciona con normalidad.

**HU-3 — Jugar solo o en el mismo dispositivo.**
- [x] "1 jugador" empieza sin conexión de red. *(Revienta Burbujas)*
- [x] "2 jugadores" reparte teclado/mandos/botones táctiles entre los dos. *(Revienta Burbujas)*

**HU-4 — Crear partida online.** Como anfitrión, quiero un código para que mi compañero se una.
- [x] "Crear partida" muestra un código de 4 caracteres sin caracteres confusos (0/O, 1/I/L).
- [x] Cuando el invitado se conecta, la partida empieza sola.

**HU-5 — Unirse.** Como invitado, quiero entrar en el mismo juego y escribir el código.
- [x] "Unirse con código" abre un campo de texto con el teclado del móvil y acepta minúsculas.
- [x] Si nadie responde en 15 s, veo "No hay ninguna partida con ese código".
- [ ] Si el código es de otro juego, el aviso lo dice. *(hoy cada juego usa sus propios temas: simplemente no conecta)*

**HU-6 — Controles.** Como jugador, quiero usar táctil, teclado o mando indistintamente.
- [x] En el menú principal funcionan los tres.
- [ ] En el menú de cada juego también funciona el mando (constitución C3).

**HU-7 — Pausa.** Como jugador, quiero pausar sin perder la partida.
- [ ] `Start` / `Esc` / ☰ abre una pausa con "Continuar" y "Salir"; online, pausa a los dos.

**HU-8 — Corte de conexión.**
- [x] Si se deja de recibir 4 s, ambos ven "Esperando…" hasta que vuelve.

## 4. Requisitos no funcionales
- Menú interactivo en < 3 s con 4G (R4).
- `?debug=1` y `?lag=&loss=` (Q1, Q2) en el módulo de red compartido.

## 5. Fuera de alcance (v1)
- Más de 2 jugadores.
- Cuentas, ranking online o chat.
- Emparejamiento automático con desconocidos.

## 6. Preguntas abiertas
- [x] Nombre del proyecto → **RetroGaming**.
- [ ] ¿Además del código, un enlace para compartir por WhatsApp que entre directo en la partida?
- [ ] ¿Juegos en horizontal? Hoy la app instalada está fijada en vertical.
- [ ] ¿Las carreras serán cooperativas o uno contra otro?
- [ ] ¿Cuál es el siguiente juego?

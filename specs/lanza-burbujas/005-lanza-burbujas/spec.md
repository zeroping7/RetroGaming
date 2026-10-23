# Spec: Lanza Burbujas

> **ID:** 005-lanza-burbujas · **Estado:** Implementada (v0.13.0) · **Fecha:** 2026-10-23
> Aprobada por el usuario el 2026-10-23 («me valen así»), junto con el encargo de hacer el juego completo de una vez.
> Esta spec describe QUÉ y POR QUÉ. Nada de código, archivos ni librerías.
> Clon de las reglas clásicas del género «Puzzle Bobble», con diseño propio: niveles, mascota, fondos y gráficos inventados (AR2). No se usa material del juego original.

## 1. Resumen
Puzzle de disparo: desde un cañón abajo lanzas burbujas de colores hacia un techo lleno de burbujas. Si juntas 3 o más del mismo color explotan, y las que se quedan colgando sin sujeción caen y dan muchos puntos. Es divertido por los rebotes en las paredes y por las grandes caídas en cadena.

## 2. Objetivo
- **Victoria (niveles):** dejar el tablero vacío y pasar al siguiente. 30 niveles; al acabar el 30, fin del juego con bonus.
- **Victoria (versus):** que el rival pierda; gana el primero en ganar 2 rondas (al mejor de 3).
- **Derrota:** alguna burbuja queda por debajo de la línea de peligro.
- **Duración:** un nivel 1-3 min; una partida completa de niveles 20-60 min; un versus 3-8 min.

## 3. Modos
| | 1 jugador: Niveles | 1 jugador: VS CPU | Online (2) |
|---|---|---|---|
| ¿Existe? | sí | sí | sí, solo versus |
| Qué hace cada jugador | limpiar tableros diseñados | ganar a una serie de rivales CPU | ganar al otro |
| Tableros | 1 | 2, lado a lado | 2, lado a lado |
| Vidas | sin vidas: perder = «¿continuar?» | perder la serie = «¿continuar?» contra ese rival | — |
| Dificultad | sube con el nivel | cada rival CPU apunta mejor y dispara más rápido | igual para los dos |

- **2 en el mismo dispositivo: no** (decidido por el usuario).
- Sin cooperativo en v1.

## 4. Bucle de juego
Mirar el color actual y el siguiente → girar el cañón → disparar (directo o rebotando en la pared) → explotar grupos y hacer caer racimos → antes de que baje el techo.

## 5. Controles
| Acción del juego | Acción abstracta | Teclado | Mando | Táctil |
|---|---|---|---|---|
| Girar el cañón | left / right | `← →` / `A D` | cruceta / stick | botones ◀ ▶ |
| Disparar | a | `Espacio` / `↑` | A | botón DISPARO |
| — | b | | | (sin uso en v1) |
| Pausa | start | `Enter` / `Esc` | Start | ☰ |

- Pulsación corta = giro fino (un paso); mantener = giro continuo que acelera un poco.
- El cañón no llega a apuntar en horizontal (límite de unos 10° sobre cada lado).

## 6. Entidades
| Entidad | Comportamiento | Interacción |
|---|---|---|
| Cañón | gira entre los límites; muestra la burbuja actual y, al lado, la siguiente | dispara la actual; la siguiente pasa a actual |
| Mascota | gatos del usuario en pixel art: J1 = gato atigrado con pecho blanco (collar turquesa), J2 = gata tricolor (collar rosa). Junto al cañón: gira la manivela, salta al hacer una gran caída, se lamenta al perder | solo decorativa |
| Burbuja de color | en rejilla hexagonal (filas alternas de 8 y 7) pegada al techo | ver reglas §6.1 |
| Burbuja disparada | va recta a velocidad fija, rebota en las paredes laterales | se pega en el hueco libre más cercano al tocar otra burbuja o el techo |
| Techo | baja una fila cada N disparos (tiembla los 2 disparos previos) | empuja todo el tablero hacia abajo |
| Línea de peligro | fija sobre el cañón | si una burbuja queda por debajo, pierdes |
| Basura (versus) | burbujas de color al azar que entran por abajo y suben hasta pegarse | se comportan como burbujas normales |

### 6.1 Reglas clásicas
- **Explotar:** al pegarse, si forma grupo de 3 o más del mismo color conectadas, explotan. **10 puntos** cada una.
- **Caer:** las burbujas que ya no están unidas al techo (directa o indirectamente) caen. Bonus: 1 → 20, 2 → 40, 3 → 80… se dobla por cada una, hasta un máximo de 1.310.720 (como el clásico).
- **Colores:** la burbuja nueva solo puede ser de un color que quede en el tablero.
- **Prisa:** si no disparas en 10 s, el cañón dispara solo; los últimos 5 s se ve una cuenta atrás.
- **Techo:** baja cada 8 disparos en el nivel 1, y cada vez antes en niveles altos (mínimo cada 5).
- **Bonus de tiempo** al limpiar: más puntos cuanto más rápido (≤ 5 s: 50.000; ≤ 60 s: 0, en escala).
- **Guía de puntería:** línea punteada hasta el primer rebote, siempre visible.
- **8 colores** posibles; los primeros niveles usan 3-4 y los últimos hasta 8.

### 6.2 Versus
- Cada burbuja que **cae** (no las que explotan) se envía al rival como 1 burbuja de basura. Si en un mismo disparo caen más de 1, llegan juntas después de ese disparo del rival.
- El techo baja por tiempo en versus (cada 20 s, avisa temblando), para que las rondas no se alarguen.
- Tableros iniciales generados al azar, iguales para los dos en cada ronda (justo).
- Entre rondas: marcador (●○), 3 s y siguiente ronda. Al acabar: «REVANCHA» o «MENÚ».

### 6.3 VS CPU
- Serie de **8 rivales CPU** (cada uno con su color de mascota); al ganar a uno pasas al siguiente. Ganar a los 8 = pantalla de campeón. Los rivales son gatos de otros pelajes.
- La CPU elige disparo como un jugador sencillo: busca grupos de su color, a veces usa rebotes, y falla a propósito más en los primeros rivales.

## 7. Niveles y progresión
- **30 niveles diseñados** a mano, en 6 mundos de 5 niveles, cada mundo con su fondo y su color de marco. Al cambiar de mundo se anuncia.
- «¿Continuar?» 10 s al perder: repite el nivel con los puntos a 0, sin límite (como Revienta Burbujas, D-012: el récord es el mejor tramo).
- **Récords:** top 10 con 3 iniciales, guardado en el móvil, visible desde el menú del juego y el récord en el cartucho del menú principal. Solo modo Niveles.

## 8. Pantalla y cámara
- **Orientación:** horizontal.
- **Resolución lógica:** 640×360.
- **1 jugador (Niveles):** tablero centrado; a los lados, mascota, puntos, nivel, récord y siguiente burbuja.
- **Versus (CPU u online):** dos tableros lado a lado; J1 (o yo) a la izquierda.
- **Cámara:** fija.
- **HUD:** puntos, nivel o marcador de rondas, disparos hasta que baje el techo (versus: tiempo), récord; online: código, conexión y ms.

## 9. Online
- **Nivel de red:** C para el cañón propio (gira al instante en mi móvil) y A/B para el resto: el anfitrión decide dónde se pega cada burbuja, qué explota y la basura.
- **Idéntico en ambos:** los dos tableros, burbujas en vuelo, siguiente burbuja, basura, marcador.
- **Puede diferir un instante:** ángulo exacto del cañón del otro, partículas y caídas.
- **Nunca se puede perder:** disparo del invitado, burbuja pegada, fin de ronda y de partida.
- Mismo menú online que Revienta Burbujas: crear partida, código de 4 letras, enlace `?sala=`.

## 10. Arte y sonido
- **Estilo:** formas planas con paleta común (AR3), greybox primero (AR1). Burbujas con brillo y un símbolo distinto por color (para daltónicos).
- **Portada del cartucho:** gato junto al cañón apuntando a un techo de burbujas de colores; sin texto.
- **Sonido** (Web Audio, D-011): disparo, rebote en pared, pegar, explotar, caer (cascada más larga cuanto más caen), techo tiembla y baja, cuenta atrás, nivel limpio, perder, ronda ganada, basura enviada/recibida. Sin música.

## 11. Historias de usuario
**HU-1 — Jugar un nivel.**
- [x] Dado el menú del juego, cuando pulso «NIVELES» (1 jugador), entonces empieza el nivel 1 con su tablero diseñado.
- [x] Dado que disparo y formo un grupo de 3+ del mismo color, entonces explotan y suman 10 cada una.
- [x] Dado que quedan burbujas sin unión al techo, entonces caen y suman el bonus doble.
- [x] Dado que disparo hacia una pared, entonces la burbuja rebota.

**HU-2 — Presión.**
- [x] Dado que llevo N disparos, entonces el techo tiembla 2 disparos antes y luego baja una fila.
- [x] Dado que no disparo en 10 s, entonces el cañón dispara solo.
- [x] Dado que una burbuja cruza la línea de peligro, entonces pierdo y sale «¿continuar?».

**HU-3 — Progresar.**
- [x] Dado que vacío el tablero, entonces recibo bonus de tiempo y paso al siguiente nivel; cada 5 cambia el mundo.
- [x] Dado que acabo el nivel 30 o pierdo sin continuar, entonces puedo dejar mis iniciales si entro en el top 10.

**HU-4 — VS CPU.**
- [x] Dado «VS CPU», entonces juego al mejor de 3 contra el rival 1; al ganarle paso al 2, hasta el 8.
- [x] Dado que hago caer burbujas, entonces le llegan al rival como basura (y al revés).

**HU-5 — Versus online.**
- [x] Dado que creo partida y mi rival entra con el código o el enlace, entonces empieza el versus y ambos vemos los dos tableros iguales.
- [x] Dado que giro mi cañón, entonces se mueve al instante en mi móvil.
- [x] Dado el final, entonces podemos pedir revancha sin volver a meter el código.

**HU-6 — Controles.**
- [x] Dado táctil, teclado o mando, entonces puedo jugar entero y navegar los menús (C1, C3).

**HU-7 — Pantalla completa** (añadida tras la v1, v0.13.1).
- [x] Dado el botón de pantalla completa (o la tecla F), cuando lo pulso, entonces el juego ocupa toda la pantalla; al pulsarlo otra vez, vuelve. Si el navegador no lo permite (Safari en iPhone), el botón no aparece.

## 12. Fuera de alcance (v1)
- 2 jugadores en el mismo dispositivo.
- Cooperativo.
- Burbujas especiales (bomba, arcoíris, piedra, estrella…).
- Cambiar la burbuja actual por la siguiente.
- Modo infinito, editor de niveles, música.
- Apuntar arrastrando el dedo.

## 13. Preguntas abiertas
- [x] ¿Guía de puntería? → Siempre, hasta el primer rebote.
- [x] ¿Récords también en VS CPU? → No en v1.
- [x] ¿Mascota? → Los dos gatos de las fotos del usuario: el atigrado es J1 y la tricolor J2.
- [x] ¿Valores de §6.1 (10 s para disparar, techo cada 8 disparos, 8 rivales CPU)? → Sí.

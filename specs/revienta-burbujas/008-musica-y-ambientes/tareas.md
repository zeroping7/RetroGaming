# Tareas: Música y ambientes de Revienta Burbujas

> **Plan:** `specs/revienta-burbujas/008-musica-y-ambientes/plan.md` · Necesita T001-T003 de 007.

- [ ] T001 — Temas de menú y de los 4 mundos, más los jingles
  - Archivos: `juegos/revienta-burbujas/musica.js`, `sw.js`
  - Hecho cuando: están los 5 temas con variante intensa y los jingles de fase y fin.
- [ ] T002 — Elegir la música según el estado
  - Archivos: `juegos/revienta-burbujas/index.html`
  - Hecho cuando: menú → tema del menú; fase → tema de su mundo sin reiniciarse entre fases; acelera con ≤ 15 s; intensa en la 5.ª fase; jingles al superar una fase y al perder la partida; funciona también como invitado.
  - Probar en el móvil: jugar el mundo 1 completo.
- [ ] T010 — Fondos fijos con más detalle (4 mundos)
  - Archivos: `juegos/revienta-burbujas/render.js`
  - Hecho cuando: cada mundo tiene 2-3 planos y se reconoce de un vistazo; el suelo y los bloques cambian por mundo.
- [ ] T011 — Capa animada de cada mundo
  - Archivos: `juegos/revienta-burbujas/render.js`
  - Hecho cuando: nubes y luciérnagas, calima y arena, rayos, peces y burbujitas, brasas y lava que palpita; fluido en el móvil.
  - Probar en el móvil: pasar por los 4 mundos; las burbujas se siguen leyendo bien.

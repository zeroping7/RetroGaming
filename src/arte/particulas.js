// Partículas de ambiente para los fondos (spec 007): brasas, polvo, burbujitas, hojas...
// Solo calcula posiciones en arrays fijos creados una vez (R5); cada juego las dibuja a su manera.

/**
 * @param {object} op
 * @param {number} op.n            cuántas
 * @param {number} op.ancho        zona donde viven
 * @param {number} op.alto
 * @param {[number, number]} [op.vx]   px/s (mín, máx)
 * @param {[number, number]} [op.vy]   px/s (negativo = suben)
 * @param {[number, number]} [op.vida] s
 * @param {[number, number]} [op.tam]  px
 * @param {number} [op.vaiven]     px de balanceo lateral
 * @param {number} [op.alfa]       opacidad máxima
 * @param {number} [op.y0]         franja donde nacen (0-1 del alto): [y0, y1]
 * @param {number} [op.y1]
 * @param {number} [op.x0]         franja donde nacen (0-1 del ancho)
 * @param {number} [op.x1]
 */
export function crearParticulas(op) {
  const n = op.n, vx = op.vx || [0, 0], vy = op.vy || [0, 0], vida = op.vida || [3, 6], tam = op.tam || [1, 2];
  const P = {
    n, x: new Float32Array(n), y: new Float32Array(n), a: new Float32Array(n), tam: new Float32Array(n),
    vx: new Float32Array(n), vy: new Float32Array(n), t: new Float32Array(n), dur: new Float32Array(n), fase: new Float32Array(n),
    /** Posición con el balanceo aplicado */
    px(i) { return P.x[i] + Math.sin(P.t[i] * 1.7 + P.fase[i]) * (op.vaiven || 0); },
    actualizar(dt) {
      for (let i = 0; i < n; i++) {
        P.t[i] += dt;
        P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt;
        const fuera = P.y[i] < -10 || P.y[i] > op.alto + 10 || P.x[i] < -20 || P.x[i] > op.ancho + 20;
        if (P.t[i] >= P.dur[i] || fuera) nacer(i, false);
        // aparece y se apaga suave
        const k = P.t[i] / P.dur[i];
        P.a[i] = (op.alfa ?? 0.35) * Math.min(1, k * 5, (1 - k) * 4);
      }
    },
  };
  const r = (a, b) => a + Math.random() * (b - a);
  function nacer(i, primera) {
    P.x[i] = r(op.x0 ?? 0, op.x1 ?? 1) * op.ancho;
    P.y[i] = r(op.y0 ?? 0, op.y1 ?? 1) * op.alto;
    P.vx[i] = r(vx[0], vx[1]); P.vy[i] = r(vy[0], vy[1]);
    P.dur[i] = r(vida[0], vida[1]); P.t[i] = primera ? Math.random() * P.dur[i] : 0;
    P.tam[i] = r(tam[0], tam[1]); P.fase[i] = Math.random() * 7; P.a[i] = 0;
  }
  for (let i = 0; i < n; i++) nacer(i, true);
  return P;
}

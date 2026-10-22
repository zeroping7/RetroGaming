// Dibujo de Revienta Burbujas en canvas 2D. Solo lee el estado: nunca lo cambia.
import { W, H, FLOOR, R } from './sim.js';

const COL = ['', '#ff6fae', '#5ee6c2', '#6fa8ff', '#ff7a4d'];
const PCOL = [{ body: '#2ec4b6', hat: '#e94f37', shot: '#ffcf3a' }, { body: '#ff8fc7', hat: '#7b5cff', shot: '#ff8fc7' }];
const FUENTE = '"Press Start 2P", monospace';

/**
 * @typedef {Object} Vista
 * @property {'menu'|'local'|'host'|'guest'} modo
 * @property {string} codigo   código de la partida online
 * @property {string} red      conexión y retardo para el HUD ('' si no hay)
 * @property {string} servidores  estado de los servidores (pantalla de espera)
 * @property {number} record
 * @property {number} ahora    ms (para animaciones del menú)
 * @property {number} alfa     0-1: cuánto del siguiente tick ha pasado (interpolación; 1 = sin interpolar)
 */

function txt(x, s, y, size, col) {
  x.fillStyle = col || '#f4f1ff'; x.font = `${size}px ${FUENTE}`; x.textAlign = 'center'; x.fillText(s, W / 2, y);
}

function fondo(x) {
  const g = x.createLinearGradient(0, 0, 0, FLOOR);
  g.addColorStop(0, '#241d5c'); g.addColorStop(1, '#0f0c2b');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = '#3a2f86'; x.fillRect(0, FLOOR, W, H - FLOOR);
  x.fillStyle = '#5446b8'; for (let i = 0; i < W; i += 20) x.fillRect(i, FLOOR, 10, 4);
}

/** @param {CanvasRenderingContext2D} x @param {object} st estado (o {state:'menu'|'wait'}) @param {Vista} v */
export function dibujar(x, st, v) {
  const al = v.alfa;
  // Posición entre el tick anterior y el actual (si no hay anterior, la actual)
  const L = (antes, ahora) => (antes === undefined ? ahora : antes + (ahora - antes) * al);
  fondo(x);
  if (st.state === 'menu') {
    const t = v.ahora / 1000; x.globalAlpha = 0.3;
    for (let i = 0; i < 4; i++) {
      const s = 4 - i; x.fillStyle = COL[s];
      x.beginPath(); x.arc(60 + i * 95, 470 - Math.abs(Math.sin(t * 1.5 + i)) * 120, R[s], 0, 7); x.fill();
    }
    x.globalAlpha = 1; return;
  }
  if (st.state === 'wait') {
    if (v.modo === 'host') { txt(x, 'CÓDIGO', 200, 12, '#a59fd6'); txt(x, v.codigo, 250, 36, '#ffcf3a'); txt(x, 'Esperando a tu', 310, 10); txt(x, 'compañero…', 330, 10); }
    else { txt(x, 'PARTIDA ' + v.codigo, 230, 12, '#ffcf3a'); txt(x, 'Conectando con', 280, 10); txt(x, 'el anfitrión…', 300, 10); }
    txt(x, 'Servidores: ' + v.servidores, 400, 8, '#a59fd6');
    return;
  }

  st.ps.forEach((p, i) => {
    if (!p.shot) return;
    const c = PCOL[i].shot, top = L(p.shot.atop, p.shot.top);
    x.strokeStyle = c; x.lineWidth = 3; x.setLineDash([6, 4]);
    x.beginPath(); x.moveTo(p.shot.x, FLOOR - p.h); x.lineTo(p.shot.x, top); x.stroke(); x.setLineDash([]);
    x.fillStyle = c; x.beginPath();
    x.moveTo(p.shot.x - 6, top + 8); x.lineTo(p.shot.x, top - 2); x.lineTo(p.shot.x + 6, top + 8); x.fill();
  });
  for (const b of st.balls) {
    const r = R[b.s], bx = L(b.ax, b.x), by = L(b.ay, b.y);
    x.fillStyle = COL[b.s]; x.beginPath(); x.arc(bx, by, r, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(bx - r * 0.35, by - r * 0.35, r * 0.25, 0, 7); x.fill();
  }
  for (const q of st.pop) {
    x.strokeStyle = COL[q.s]; x.lineWidth = 2;
    x.beginPath(); x.arc(q.x, q.y, Math.max(1, R[q.s] * (1.6 - q.t * 2)), 0, 7); x.stroke();
  }
  const yo = v.modo === 'guest' ? 1 : v.modo === 'host' ? 0 : -1;
  st.ps.forEach((p, i) => {
    if (st.state === 'dead' && st.hit === i && Math.floor(st.t * 10) % 2) return;
    const px = L(p.ax, p.x), bx = px - p.w / 2, by = FLOOR - p.h, c = PCOL[i];
    x.fillStyle = c.body; x.fillRect(bx + 3, by + 12, p.w - 6, p.h - 12);
    x.fillStyle = '#ffd9b0'; x.fillRect(bx + 6, by, p.w - 12, 13);
    x.fillStyle = '#0d0b1f'; x.fillRect(bx + 9, by + 5, 3, 3); x.fillRect(bx + p.w - 12, by + 5, 3, 3);
    x.fillStyle = c.hat; x.fillRect(bx + 4, by - 3, p.w - 8, 5);
    if (st.n > 1) { x.fillStyle = '#f4f1ff'; x.font = `7px ${FUENTE}`; x.textAlign = 'center'; x.fillText(i === yo ? 'TÚ' : 'J' + (i + 1), px, by - 8); }
  });

  x.font = `10px ${FUENTE}`;
  x.textAlign = 'left'; x.fillStyle = '#f4f1ff'; x.fillText('PUNTOS ' + st.score, 10, FLOOR + 20);
  x.textAlign = 'right'; x.fillText('NIVEL ' + st.lvl, W - 10, FLOOR + 20);
  x.textAlign = 'left'; x.fillStyle = '#ff6fae'; x.fillText('♥'.repeat(Math.max(0, Math.min(9, st.lives))), 10, FLOOR + 36);
  x.textAlign = 'right'; x.fillStyle = '#a59fd6'; x.fillText(v.modo === 'local' ? 'RÉCORD ' + v.record : 'ONLINE ' + v.codigo, W - 10, FLOOR + 36);
  if (v.modo !== 'local') { x.fillStyle = '#a59fd6'; x.font = `7px ${FUENTE}`; x.textAlign = 'left'; x.fillText(v.red, 8, 14); }
  if (st.state === 'ready') txt(x, 'NIVEL ' + st.lvl, 250, 18, '#ffcf3a');
  if (st.state === 'clear') txt(x, '¡LIMPIO! +500', 250, 16, '#5ee6c2');
  if (st.state === 'over') { txt(x, 'FIN DE PARTIDA', 230, 18, '#ff6fae'); txt(x, 'Pulsa disparo', 270, 10); }
}

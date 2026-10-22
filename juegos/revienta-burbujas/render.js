// Dibujo de Revienta Burbujas en canvas 2D. Solo lee el estado: nunca lo cambia.
import { W, H, FLOOR, R, TIPOS, ARMAS, TAM_OBJETO, OBJ_EN_SUELO, OBJ_PARPADEO, AVISO_TIEMPO } from './sim.js';

const COL = ['', '#ff6fae', '#5ee6c2', '#6fa8ff', '#ff7a4d'];
const PCOL = [{ body: '#2ec4b6', hat: '#e94f37', shot: '#ffcf3a' }, { body: '#ff8fc7', hat: '#7b5cff', shot: '#ff8fc7' }];
const FUENTE = '"Press Start 2P", monospace';

// Objetos: un color de fondo por tipo (mismo orden que TIPOS) y un símbolo dibujado con formas
const OBJ_COL = { doble: '#ffcf3a', fijo: '#5ee6c2', triple: '#ff8fc7', velocidad: '#6fa8ff', escudo: '#b79bff', dinamita: '#ff6b4a', reloj: '#f4f1ff', fruta: '#7ee081', vida: '#ffd6e8' };
const TINTA = '#1a1640';

function simbolo(x, tipo, cx, cy) {
  x.strokeStyle = TINTA; x.fillStyle = TINTA; x.lineWidth = 2; x.lineCap = 'butt';
  const linea = (x1, y1, x2, y2) => { x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); };
  switch (tipo) {
    case 'doble': linea(cx - 3, cy - 5, cx - 3, cy + 5); linea(cx + 3, cy - 5, cx + 3, cy + 5); break;
    case 'triple': linea(cx - 4, cy - 5, cx - 4, cy + 5); linea(cx, cy - 5, cx, cy + 5); linea(cx + 4, cy - 5, cx + 4, cy + 5); break;
    case 'fijo': x.fillRect(cx - 2, cy - 4, 4, 9); x.fillRect(cx - 5, cy - 6, 10, 3); break;
    case 'velocidad':
      x.beginPath(); x.moveTo(cx - 5, cy); x.lineTo(cx, cy - 5); x.lineTo(cx + 5, cy); x.stroke();
      x.beginPath(); x.moveTo(cx - 5, cy + 5); x.lineTo(cx, cy); x.lineTo(cx + 5, cy + 5); x.stroke(); break;
    case 'escudo': x.beginPath(); x.arc(cx, cy, 5, 0, 7); x.stroke(); break;
    case 'dinamita': x.fillRect(cx - 2, cy - 3, 4, 9); linea(cx, cy - 3, cx + 3, cy - 6); break;
    case 'reloj': x.beginPath(); x.arc(cx, cy, 5, 0, 7); x.stroke(); linea(cx, cy, cx, cy - 3); linea(cx, cy, cx + 3, cy); break;
    case 'fruta': // manzana: cuerpo rojo, rabito y hoja
      x.fillStyle = '#e8384f'; x.beginPath(); x.arc(cx - 2, cy + 1, 4, 0, 7); x.arc(cx + 2, cy + 1, 4, 0, 7); x.fill();
      x.strokeStyle = '#5a3a1a'; linea(cx, cy - 3, cx + 1, cy - 6);
      x.fillStyle = '#2f9e44'; x.beginPath(); x.ellipse(cx + 3, cy - 5, 2.5, 1.3, -0.5, 0, 7); x.fill(); break;
    case 'vida': // corazón
      x.fillStyle = '#e8384f'; x.beginPath(); x.arc(cx - 2.5, cy - 1.5, 3, 0, 7); x.arc(cx + 2.5, cy - 1.5, 3, 0, 7); x.fill();
      x.beginPath(); x.moveTo(cx - 5.5, cy - 0.5); x.lineTo(cx, cy + 5.5); x.lineTo(cx + 5.5, cy - 0.5); x.fill(); break;
  }
}

/** Icono de un objeto (también se usa en el HUD). */
function icono(x, tipo, cx, cy) {
  const m = TAM_OBJETO / 2;
  x.fillStyle = OBJ_COL[tipo];
  x.beginPath();
  if (x.roundRect) x.roundRect(cx - m, cy - m, TAM_OBJETO, TAM_OBJETO, 4); else x.rect(cx - m, cy - m, TAM_OBJETO, TAM_OBJETO);
  x.fill();
  x.strokeStyle = '#0d0b1f'; x.lineWidth = 1; x.stroke();
  simbolo(x, tipo, cx, cy);
}

function dibujarObjeto(x, o, cx, cy) {
  // parpadea los últimos segundos en el suelo
  if (o.enSuelo > OBJ_EN_SUELO - OBJ_PARPADEO && Math.floor(o.enSuelo * 8) % 2) return;
  icono(x, TIPOS[o.tipo], cx, cy);
}

// Arpón normal: cuerda discontinua y punta. Fijo: cable grueso y continuo con brillo.
function dibujarArpon(x, a, top, base, c) {
  if (a.fijo) {
    if (a.clavado > 0 && a.clavado < 0.5 && Math.floor(a.clavado * 12) % 2) return; // va a soltarse
    x.fillStyle = c; x.fillRect(a.x - 2.5, top, 5, base - top);
    x.fillStyle = '#ffffff'; x.fillRect(a.x - 0.5, top, 1, base - top);
    x.fillStyle = c; x.fillRect(a.x - 6, top, 12, 4); // tope clavado / cabeza
    return;
  }
  x.strokeStyle = c; x.lineWidth = 3; x.setLineDash([6, 4]);
  x.beginPath(); x.moveTo(a.x, base); x.lineTo(a.x, top); x.stroke(); x.setLineDash([]);
  x.fillStyle = c; x.beginPath();
  x.moveTo(a.x - 6, top + 8); x.lineTo(a.x, top - 2); x.lineTo(a.x + 6, top + 8); x.fill();
}

// HUD: arma y potenciadores de cada jugador, en el centro de la franja inferior
function hudJugadores(x, st) {
  const slots = st.ps.map((p) => {
    const l = [];
    if (p.arma > 0) l.push(ARMAS[p.arma]);
    if (p.rapido > 0) l.push('velocidad');
    if (p.escudo) l.push('escudo');
    return l;
  });
  const ancho = slots.reduce((t, l) => t + Math.max(1, l.length) * 18, 0) + (st.ps.length - 1) * 10;
  let cx = W / 2 - ancho / 2 + 9;
  st.ps.forEach((p, i) => {
    const l = slots[i];
    if (st.n > 1) { x.fillStyle = PCOL[i].body; x.fillRect(cx - 9, FLOOR + 38, Math.max(1, l.length) * 18 - 2, 2); }
    if (!l.length) { x.fillStyle = 'rgba(244,241,255,.25)'; x.fillRect(cx - 1, FLOOR + 22, 2, 12); } // arpón normal
    for (const t of l) { icono(x, t, cx, FLOOR + 28); cx += 18; }
    cx += (l.length ? 0 : 18) + 10;
  });
}

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
    for (const a of p.arpones) dibujarArpon(x, a, L(a.atop, a.top), FLOOR - p.h, PCOL[i].shot);
  });
  const quietas = st.congelado > 0;
  for (const b of st.balls) {
    const r = R[b.s], bx = L(b.ax, b.x), by = L(b.ay, b.y);
    x.fillStyle = COL[b.s]; x.beginPath(); x.arc(bx, by, r, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(bx - r * 0.35, by - r * 0.35, r * 0.25, 0, 7); x.fill();
    if (quietas) { x.strokeStyle = '#e6f7ff'; x.lineWidth = 2; x.beginPath(); x.arc(bx, by, r, 0, 7); x.stroke(); } // congeladas
  }
  for (const q of st.pop) {
    x.strokeStyle = COL[q.s]; x.lineWidth = 2;
    x.beginPath(); x.arc(q.x, q.y, Math.max(1, R[q.s] * (1.6 - q.t * 2)), 0, 7); x.stroke();
  }
  if (st.objetos) for (const o of st.objetos) dibujarObjeto(x, o, o.x, L(o.ay, o.y));
  const yo = v.modo === 'guest' ? 1 : v.modo === 'host' ? 0 : -1;
  st.ps.forEach((p, i) => {
    if (st.state === 'dead' && st.hit === i && Math.floor(st.t * 10) % 2) return;
    if (p.invulnerable > 0 && Math.floor(v.ahora / 80) % 2) return; // parpadeo tras perder el escudo
    const px = L(p.ax, p.x), bx = px - p.w / 2, by = FLOOR - p.h, c = PCOL[i];
    if (p.escudo) {
      x.strokeStyle = c.body; x.lineWidth = 2; x.globalAlpha = 0.85;
      x.beginPath(); x.ellipse(px, by + p.h / 2 - 2, p.w / 2 + 7, p.h / 2 + 7, 0, 0, 7); x.stroke();
      x.globalAlpha = 1;
    }
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
  hudJugadores(x, st);
  // textos flotantes: «x3» (combo), «+500» (fruta), «1UP»
  if (st.textos) for (const q of st.textos) {
    x.globalAlpha = Math.max(0, Math.min(1, q.t * 2));
    x.font = `${q.k === 0 ? 11 : 9}px ${FUENTE}`; x.textAlign = 'center';
    x.fillStyle = '#0d0b1f'; const t = q.k === 0 ? 'x' + q.v : q.k === 1 ? '+' + q.v : '1UP';
    x.fillText(t, q.x + 1, q.y + 1);
    x.fillStyle = q.k === 2 ? '#ff6fae' : q.k === 1 ? '#7ee081' : '#ffcf3a'; x.fillText(t, q.x, q.y);
    x.globalAlpha = 1;
  }
  // tiempo del nivel (parpadea en rojo los últimos segundos)
  if (typeof st.tiempo === 'number' && (st.state === 'play' || st.state === 'ready')) {
    const seg = Math.ceil(st.tiempo), aviso = seg <= AVISO_TIEMPO && st.state === 'play';
    if (!aviso || Math.floor(v.ahora / 250) % 2) {
      x.font = `10px ${FUENTE}`; x.textAlign = 'center'; x.fillStyle = aviso ? '#ff6b4a' : '#f4f1ff';
      x.fillText('TIEMPO ' + seg, W / 2, 22);
    }
  }
  if (quietas) {
    icono(x, 'reloj', W / 2 - 22, 44);
    x.fillStyle = '#f4f1ff'; x.font = `12px ${FUENTE}`; x.textAlign = 'left'; x.fillText(String(Math.ceil(st.congelado)), W / 2 - 8, 50);
  }
  if (v.modo !== 'local') { x.fillStyle = '#a59fd6'; x.font = `7px ${FUENTE}`; x.textAlign = 'left'; x.fillText(v.red, 8, 14); }
  if (st.state === 'ready') txt(x, 'NIVEL ' + st.lvl, 250, 18, '#ffcf3a');
  if (st.state === 'clear') { txt(x, '¡LIMPIO! +500', 240, 16, '#5ee6c2'); if (st.bono) txt(x, 'TIEMPO +' + st.bono, 270, 10, '#ffcf3a'); }
  if (st.state === 'dead' && st.hit === -1) txt(x, '¡SE ACABÓ EL TIEMPO!', 250, 12, '#ff6b4a');
  if (st.state === 'over') { txt(x, 'FIN DE PARTIDA', 230, 18, '#ff6fae'); txt(x, 'Pulsa disparo', 270, 10); }
}

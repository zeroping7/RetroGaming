// Dibujo de Revienta Burbujas en canvas 2D. Solo lee el estado: nunca lo cambia.
import { W, H, FLOOR, R, TIPOS, ARMAS, TAM_OBJETO, OBJ_EN_SUELO, OBJ_PARPADEO, AVISO_TIEMPO, READY_SEG } from './sim.js';
import { MUNDOS, mundoDe, fondoDe } from './fases.js';
import { lienzoGato, GATOS } from '../../src/arte/gatos.js';
import { crearParticulas } from '../../src/arte/particulas.js';

// Jugadores: los gatos de Lanza Burbujas (spec 006). J1 atigrado, J2 tricolor.
// Lienzos de cada pose, hechos una vez (R5); el gato mira hacia donde anda.
const ESCALA_GATO = 1.5, CENTRO_GATO = 10; // el cuerpo ocupa las columnas 0-19 del dibujo (la cola, 20-23)
let lienzosGatos = null;
function gatoDe(i, pose) {
  if (!lienzosGatos) lienzosGatos = [GATOS.j1, GATOS.j2].map((g) => Object.fromEntries(['sentado', 'parpadeo', 'feliz', 'triste'].map((p) => [p, lienzoGato(g, p)])));
  return lienzosGatos[i][pose];
}

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

// Bloques: el rompible, de ladrillo con juntas y del color de su mundo (spec 008); el duro, de metal con remaches
let bloqueMundo = 0;
function dibujarBloque(x, k) {
  if (k.duro) {
    x.fillStyle = '#8a8fb0'; x.fillRect(k.x, k.y, k.w, k.h);
    x.fillStyle = '#c9cde6'; x.fillRect(k.x, k.y, k.w, 2);
    x.fillStyle = '#4b4f6e'; x.fillRect(k.x, k.y + k.h - 2, k.w, 2);
    x.fillStyle = '#4b4f6e';
    for (const rx of [k.x + 4, k.x + k.w - 7]) x.fillRect(rx, k.y + k.h / 2 - 1.5, 3, 3);
  } else {
    const c = SUELO[bloqueMundo + 1].length > 2 ? SUELO[bloqueMundo + 1] : SUELO[1];
    x.fillStyle = c[2]; x.fillRect(k.x, k.y, k.w, k.h);
    x.fillStyle = c[3]; x.fillRect(k.x, k.y, k.w, 2);
    x.fillStyle = c[4];
    x.fillRect(k.x, k.y + k.h / 2 - 0.5, k.w, 1);
    for (let i = 10; i < k.w; i += 20) x.fillRect(k.x + i, k.y, 1, k.h / 2);
    for (let i = 0; i < k.w; i += 20) x.fillRect(k.x + i, k.y + k.h / 2, 1, k.h / 2);
  }
}

// Hexágono regular de «radio» r centrado en (cx, cy)
function hexagono(x, cx, cy, r) {
  x.beginPath();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; x.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
  x.closePath();
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

// Fondos (spec 004, bloque C): uno por mundo, dibujados con formas (AR2) una sola vez en un
// canvas aparte y copiados en cada fotograma, para no rehacer degradados 60 veces por segundo (R1).
// Colores apagados para que las burbujas destaquen. -1 = menú y esperas.
// Spec 008: cada mundo en 2-3 planos (fijos, en caché) más una capa animada encima (ambiente()).
// Suelo y bloques: [suelo, detalle del suelo, ladrillo, luz del ladrillo, junta]
const SUELO = [
  ['#3a2f86', '#5446b8'],                                   // menú
  ['#2f5a2a', '#4f8a3c', '#b0703a', '#d9975a', '#6e3f18'],  // pradera: hierba y ladrillo
  ['#8a5a2c', '#b07a3a', '#c9a061', '#e6c48a', '#80602f'],  // desierto: arena y adobe
  ['#1d4a63', '#2f6f8a', '#c86a7a', '#e898a4', '#7a3442'],  // océano: arena mojada y coral
  ['#2a1414', '#7a2a12', '#5a3a3a', '#7d5555', '#2a1515'],  // volcán: roca y basalto
];
const cacheFondo = [];

function degradado(c, a, b) {
  const g = c.createLinearGradient(0, 0, 0, FLOOR);
  g.addColorStop(0, a); g.addColorStop(1, b);
  c.fillStyle = g; c.fillRect(0, 0, W, FLOOR);
}
function colinas(c, col, base, alto, paso, fase) {
  c.fillStyle = col; c.beginPath(); c.moveTo(0, FLOOR);
  for (let px = 0; px <= W; px += 10) c.lineTo(px, base - alto * (0.5 + 0.5 * Math.sin(px / paso + fase)));
  c.lineTo(W, FLOOR); c.closePath(); c.fill();
}
function circulo(c, cx, cy, r) { c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); }

function pintarFondo(c, i) {
  if (i === 0) { // Pradera: anochecer, sol poniente, colinas en dos planos, árboles y flores
    degradado(c, '#1c1745', '#5a4072');
    c.fillStyle = 'rgba(255,255,255,.35)';
    for (let n = 0; n < 18; n++) c.fillRect((n * 151) % W, (n * 53) % 160, 1, 1);
    c.fillStyle = 'rgba(201,113,74,.18)'; circulo(c, 300, 395, 70);
    c.fillStyle = '#c9714a'; c.beginPath(); c.arc(300, 405, 48, Math.PI, 0); c.fill();
    colinas(c, '#2c2a55', 430, 70, 60, 0.5);
    c.fillStyle = '#24224a'; // árboles lejanos
    for (const [tx, ty, tr] of [[60, 392, 16], [86, 400, 12], [340, 404, 14]]) { c.fillRect(tx - 2, ty, 4, 18); circulo(c, tx, ty, tr); }
    colinas(c, '#1f3d36', 480, 45, 40, 2);
    c.fillStyle = '#244a3f'; for (let px = 0; px < W; px += 7) c.fillRect(px, 488 + (px * 13) % 9, 2, 6);
    colinas(c, '#1a3329', 510, 14, 25, 4);
  } else if (i === 1) { // Desierto: atardecer, mesetas, dunas y cactus
    degradado(c, '#3b1f4a', '#a2513a');
    c.fillStyle = 'rgba(232,140,80,.18)'; circulo(c, 90, 372, 74);
    c.fillStyle = '#d07040'; c.beginPath(); c.arc(90, 380, 46, Math.PI, 0); c.fill();
    c.fillStyle = 'rgba(255,200,150,.12)'; c.fillRect(0, 300, W, 2); c.fillRect(0, 312, W, 1);
    c.fillStyle = '#5a2d3a';
    c.fillRect(30, 380, 110, 140); c.fillRect(20, 372, 130, 10);
    c.fillRect(250, 340, 130, 180); c.fillRect(240, 332, 150, 10);
    c.fillStyle = '#4c2532'; c.fillRect(250, 360, 130, 3); c.fillRect(30, 400, 110, 3); // estratos
    colinas(c, '#6e3a2c', 490, 30, 70, 1);
    colinas(c, '#7e4630', 510, 16, 45, 3);
    c.fillStyle = '#2f4a2a';
    for (const cx of [190, 360]) { c.fillRect(cx, 452, 8, 40); c.fillRect(cx - 10, 466, 8, 4); c.fillRect(cx - 10, 456, 4, 12); c.fillRect(cx + 10, 462, 8, 4); c.fillRect(cx + 14, 450, 4, 14); }
  } else if (i === 2) { // Océano: bajo el mar, rocas, algas al fondo y luz desde arriba
    degradado(c, '#0d3a5c', '#061629');
    c.fillStyle = 'rgba(160,210,255,.10)'; // superficie ondulada
    for (let px = 0; px < W; px += 16) c.fillRect(px, 6 + ((px / 16) % 2) * 3, 10, 2);
    c.fillStyle = '#0a2742'; // rocas lejanas
    c.beginPath(); c.moveTo(0, FLOOR); c.lineTo(0, 420); c.lineTo(40, 390); c.lineTo(90, 410); c.lineTo(120, 380); c.lineTo(170, 430); c.lineTo(170, FLOOR); c.fill();
    c.beginPath(); c.moveTo(250, FLOOR); c.lineTo(280, 410); c.lineTo(330, 370); c.lineTo(370, 400); c.lineTo(W, 380); c.lineTo(W, FLOOR); c.fill();
    c.fillStyle = '#0e2f4a'; c.fillRect(300, 404, 40, 3); c.fillRect(60, 418, 30, 3);
    colinas(c, '#123a55', 495, 18, 30, 1);
    c.fillStyle = '#1d4a63'; for (let px = 3; px < W; px += 11) c.fillRect(px, 505 + (px * 7) % 8, 3, 2); // arena
    c.fillStyle = '#7a3442'; // coral apagado
    for (const [kx, ky] of [[140, 492], [228, 496]]) { c.fillRect(kx, ky, 3, 16); c.fillRect(kx - 6, ky + 4, 3, 10); c.fillRect(kx + 6, ky + 2, 3, 12); c.fillRect(kx - 6, ky + 12, 15, 3); }
  } else if (i === 3) { // Volcán: cielo rojo oscuro, volcán, ríos de lava y montañas
    degradado(c, '#1a0a12', '#4a1414');
    const brillo = c.createRadialGradient(200, 270, 10, 200, 270, 170);
    brillo.addColorStop(0, 'rgba(255,110,40,.30)'); brillo.addColorStop(1, 'rgba(255,110,40,0)');
    c.fillStyle = brillo; c.fillRect(0, 80, W, 380);
    c.fillStyle = '#220c10'; // montañas lejanas
    c.beginPath(); c.moveTo(0, FLOOR); c.lineTo(0, 360); c.lineTo(50, 330); c.lineTo(110, 380); c.lineTo(110, FLOOR); c.fill();
    c.beginPath(); c.moveTo(300, FLOOR); c.lineTo(340, 350); c.lineTo(370, 330); c.lineTo(W, 360); c.lineTo(W, FLOOR); c.fill();
    c.fillStyle = '#2a1012'; c.beginPath(); c.moveTo(40, FLOOR); c.lineTo(170, 260); c.lineTo(230, 260); c.lineTo(360, FLOOR); c.closePath(); c.fill();
    c.fillStyle = '#d9541e'; c.fillRect(176, 258, 48, 6);
    c.fillRect(196, 264, 6, 60); c.fillRect(204, 300, 5, 40); c.fillRect(190, 320, 5, 50); c.fillRect(186, 368, 4, 40);
    c.fillStyle = 'rgba(70,40,45,.35)'; // humo: nubes bajas y anchas, que no parezcan burbujas
    for (const [hx, hy, hr] of [[190, 230, 16], [220, 205, 22], [180, 175, 28]]) { c.beginPath(); c.ellipse(hx, hy, hr * 1.6, hr * 0.6, -0.2, 0, 7); c.fill(); }
    colinas(c, '#200c0e', 495, 25, 30, 1);
    c.fillStyle = '#a8401a'; for (const [lx, lw] of [[30, 40], [150, 70], [300, 50]]) c.fillRect(lx, 506, lw, 3); // grietas con lava
  } else { // menú y esperas
    degradado(c, '#241d5c', '#0f0c2b');
  }
}

/* ---------- capa animada (spec 008, HU-2): nada se crea por fotograma (R5) ---------- */
const amb = { mundo: -2, t: 0, ultimo: 0, p: null, nubes: null, rayos: null, lava: null };
const NUBES = [[70, 80, 8], [210, 150, 5], [120, 230, 6], [330, 60, 7]]; // x, y, px/s
const FLORES = [[22, '#c86a8a'], [64, '#c8b46a'], [118, '#8a7ac8'], [176, '#c86a8a'], [236, '#c8b46a'], [290, '#8a7ac8'], [352, '#c86a8a'], [386, '#c8b46a']];
const ALGAS = [18, 52, 196, 262, 318, 380];
const PECES = [[0, 160, 22, 1], [1, 250, 15, -1], [2, 330, 28, 1], [3, 120, 12, -1]]; // fase, y, px/s, sentido
const PARTICULAS = [
  { n: 14, ancho: W, alto: FLOOR, vx: [-6, 6], vy: [-6, 4], vida: [3, 6], tam: [1.5, 2.5], vaiven: 6, alfa: 0.55, y0: 0.55, y1: 0.95, color: '#f6f08a' }, // luciérnagas
  { n: 22, ancho: W, alto: FLOOR, vx: [40, 80], vy: [-6, 6], vida: [4, 8], tam: [1, 2], alfa: 0.35, x0: -0.1, x1: 0.9, y0: 0.6, y1: 0.98, color: '#e8c08a' }, // arena
  { n: 18, ancho: W, alto: FLOOR, vy: [-22, -40], vida: [8, 14], tam: [1.5, 3.5], vaiven: 4, alfa: 0.3, y0: 0.7, y1: 1, color: '#b4dcff', aro: true }, // burbujitas
  { n: 28, ancho: W, alto: FLOOR, vx: [-8, 8], vy: [-25, -60], vida: [3, 7], tam: [1, 2.5], vaiven: 6, alfa: 0.7, y0: 0.55, y1: 1, color: '#ff8a3a' }, // brasas
];
function lienzoAparte(w, h) {
  return typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
}
function prepararAmbiente(i, x) {
  amb.mundo = i; amb.p = PARTICULAS[i] ? crearParticulas(PARTICULAS[i]) : null;
  if (i === 0 && !amb.nubes) { // una nube dibujada una vez
    try {
      amb.nubes = lienzoAparte(100, 30); const c = amb.nubes.getContext('2d');
      c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.ellipse(40, 18, 34, 10, 0, 0, 7); c.ellipse(62, 12, 22, 9, 0, 0, 7); c.fill();
    } catch (e) { amb.nubes = null; }
  }
  if (i === 2 && !amb.rayos) {
    amb.rayos = x.createLinearGradient(0, 0, 0, 420);
    amb.rayos.addColorStop(0, 'rgba(180,220,255,.16)'); amb.rayos.addColorStop(1, 'rgba(180,220,255,0)');
  }
  if (i === 3 && !amb.lava) {
    amb.lava = x.createRadialGradient(200, 300, 10, 200, 300, 200);
    amb.lava.addColorStop(0, 'rgba(255,90,30,.22)'); amb.lava.addColorStop(1, 'rgba(255,90,30,0)');
  }
}

function ambiente(x, i, ahora, base) {
  if (i < 0) return;
  if (amb.mundo !== i) prepararAmbiente(i, x);
  const dt = Math.min(0.1, Math.max(0, (ahora - (amb.ultimo || ahora)) / 1000)); amb.ultimo = ahora; amb.t += dt;
  const t = amb.t;
  if (i === 0) { // nubes que cruzan y flores que se mecen
    if (amb.nubes) for (const [nx, ny, v] of NUBES) x.drawImage(amb.nubes, ((nx + t * v) % (W + 110)) - 100, ny);
    for (const [fx, col] of FLORES) {
      const dx = Math.sin(t * 1.6 + fx) * 2;
      x.fillStyle = '#2e5a35'; x.fillRect(fx, FLOOR - 9, 1, 9);
      x.fillStyle = col; x.fillRect(fx - 1 + dx, FLOOR - 12, 3, 3);
    }
  } else if (i === 1 && base) { // calima: franjas del horizonte que ondulan
    for (let y = 330; y < 470; y += 5) x.drawImage(base, 0, y, W, 5, Math.sin(t * 3 + y * 0.12) * 1.5, y, W, 5);
  } else if (i === 2) { // rayos de luz que laten, algas, peces lejanos
    x.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.8); x.fillStyle = amb.rayos;
    for (const [rx, rw, k] of [[60, 40, 0], [180, 60, 1], [300, 36, 2]]) {
      const d = Math.sin(t * 0.5 + k) * 12;
      x.beginPath(); x.moveTo(rx, 0); x.lineTo(rx + rw, 0); x.lineTo(rx + rw * 1.8 + d, 420); x.lineTo(rx + rw * 0.6 + d, 420); x.closePath(); x.fill();
    }
    x.globalAlpha = 1;
    x.fillStyle = 'rgba(20,70,90,.85)';
    for (const ax of ALGAS) for (let s = 0; s < 8; s++) x.fillRect(ax + Math.sin(t * 1.3 + ax + s * 0.5) * s * 0.8, FLOOR - 4 - s * 6, 3, 6);
    x.fillStyle = 'rgba(60,110,150,.45)';
    for (const [f, fy, v, sd] of PECES) {
      const fx = sd > 0 ? ((t * v + f * 120) % (W + 60)) - 30 : W + 30 - ((t * v + f * 120) % (W + 60));
      const fy2 = fy + Math.sin(t * 1.5 + f) * 4;
      x.beginPath(); x.ellipse(fx, fy2, 7, 3, 0, 0, 7); x.fill();
      x.beginPath(); x.moveTo(fx - sd * 6, fy2); x.lineTo(fx - sd * 11, fy2 - 3); x.lineTo(fx - sd * 11, fy2 + 3); x.fill();
    }
  } else if (i === 3) { // lava que palpita
    x.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2.2); x.fillStyle = amb.lava; x.fillRect(0, 100, W, 420);
    x.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3.1); x.fillStyle = '#ff7a2a';
    x.fillRect(176, 258, 48, 3); for (const [lx, lw] of [[30, 40], [150, 70], [300, 50]]) x.fillRect(lx, 506, lw, 2);
    x.globalAlpha = 1;
  }
  const p = amb.p;
  if (p) {
    p.actualizar(dt);
    const op = PARTICULAS[i];
    x.fillStyle = op.color; x.strokeStyle = op.color; x.lineWidth = 1;
    for (let k = 0; k < p.n; k++) {
      if (p.a[k] <= 0.01) continue;
      x.globalAlpha = p.a[k];
      if (op.aro) { x.beginPath(); x.arc(p.px(k), p.y[k], p.tam[k], 0, 7); x.stroke(); }
      else x.fillRect(p.px(k), p.y[k], p.tam[k], p.tam[k]);
    }
    x.globalAlpha = 1;
  }
}

function fondo(x, i, ahora) {
  let f = cacheFondo[i + 1];
  if (f === undefined) {
    f = null;
    try { const c = lienzoAparte(W, FLOOR); pintarFondo(c.getContext('2d'), i); f = c; } catch (e) { /* sin canvas aparte: se pinta directo */ }
    cacheFondo[i + 1] = f;
  }
  if (f) x.drawImage(f, 0, 0); else pintarFondo(x, i);
  ambiente(x, i, ahora, f);
  const [a, b] = SUELO[i + 1];
  x.fillStyle = a; x.fillRect(0, FLOOR, W, H - FLOOR);
  x.fillStyle = b; for (let p = 0; p < W; p += 20) x.fillRect(p, FLOOR, 10, 4);
  if (i >= 0) { x.fillStyle = b; for (let p = 7; p < W; p += 23) x.fillRect(p, FLOOR + 12 + (p % 3) * 6, 4, 2); }
}

/** @param {CanvasRenderingContext2D} x @param {object} st estado (o {state:'menu'|'wait'}) @param {Vista} v */
export function dibujar(x, st, v) {
  const al = v.alfa;
  // Posición entre el tick anterior y el actual (si no hay anterior, la actual)
  const L = (antes, ahora) => (antes === undefined ? ahora : antes + (ahora - antes) * al);
  const mundo = st.lvl ? fondoDe(st.lvl) : -1;
  fondo(x, mundo, v.ahora);
  bloqueMundo = mundo;
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

  if (st.bloques) for (const k of st.bloques) dibujarBloque(x, k);
  st.ps.forEach((p, i) => {
    for (const a of p.arpones) dibujarArpon(x, a, L(a.atop, a.top), FLOOR - p.h, PCOL[i].shot);
  });
  const quietas = st.congelado > 0, brillo = 0.5 + 0.5 * Math.sin(v.ahora / 120);
  for (const b of st.balls) {
    const r = R[b.s], bx = L(b.ax, b.x), by = L(b.ay, b.y);
    x.fillStyle = COL[b.s];
    if (b.hex) { hexagono(x, bx, by, r); x.fill(); x.strokeStyle = 'rgba(13,11,31,.45)'; x.lineWidth = 2; x.stroke(); }
    else { x.beginPath(); x.arc(bx, by, r, 0, 7); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(bx - r * 0.35, by - r * 0.35, r * 0.25, 0, 7); x.fill();
    if (b.obj) { // brilla: suelta un objeto seguro
      x.strokeStyle = `rgba(255,207,58,${0.4 + 0.6 * brillo})`; x.lineWidth = 3;
      x.beginPath(); x.arc(bx, by, r + 3, 0, 7); x.stroke();
      x.fillStyle = '#ffcf3a'; x.font = `${Math.max(7, r * 0.6)}px ${FUENTE}`; x.textAlign = 'center'; x.fillText('?', bx, by + r * 0.25);
    }
    if (quietas) { x.strokeStyle = '#e6f7ff'; x.lineWidth = 2; if (b.hex) hexagono(x, bx, by, r); else { x.beginPath(); x.arc(bx, by, r, 0, 7); } x.stroke(); } // congeladas
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
    let pose = 'sentado';
    if (st.state === 'dead' && st.hit === i) pose = 'triste';
    else if (p.arpones.length) pose = 'feliz';
    else if (Math.floor(v.ahora / 400 + i * 3) % 11 === 0) pose = 'parpadeo';
    const lz = gatoDe(i, pose), ancho = lz.width * ESCALA_GATO, alto = lz.height * ESCALA_GATO;
    x.save();
    x.imageSmoothingEnabled = false;
    x.translate(px, FLOOR);
    if (p.dir < 0) x.scale(-1, 1); // mira hacia donde va
    x.drawImage(lz, -CENTRO_GATO * ESCALA_GATO, -alto, ancho, alto);
    x.restore();
    if (st.n > 1) { x.fillStyle = '#f4f1ff'; x.font = `7px ${FUENTE}`; x.textAlign = 'center'; x.fillText(i === yo ? 'TÚ' : 'J' + (i + 1), px, FLOOR - 22 * ESCALA_GATO - 6); }
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
  if (st.state === 'ready') {
    if (st.t > READY_SEG) { // empieza un mundo: «MUNDO N» y su nombre
      const m = mundoDe(st.lvl);
      x.fillStyle = 'rgba(13,11,31,.55)'; x.fillRect(0, 170, W, 120);
      txt(x, 'MUNDO ' + m, 220, 22, '#ffcf3a');
      txt(x, MUNDOS[(m - 1) % MUNDOS.length], 256, 12, '#f4f1ff');
    } else txt(x, 'NIVEL ' + st.lvl, 250, 18, '#ffcf3a');
  }
  if (st.state === 'clear') { txt(x, '¡LIMPIO! +500', 240, 16, '#5ee6c2'); if (st.bono) txt(x, 'TIEMPO +' + st.bono, 270, 10, '#ffcf3a'); }
  if (st.state === 'dead' && st.hit === -1) txt(x, '¡SE ACABÓ EL TIEMPO!', 250, 12, '#ff6b4a');
  if (st.state === 'continuar') { // sin vidas: cuenta atrás para seguir (spec 004, bloque D)
    x.fillStyle = 'rgba(13,11,31,.7)'; x.fillRect(0, 0, W, FLOOR);
    txt(x, '¿CONTINUAR?', 190, 18, '#ffcf3a');
    txt(x, String(Math.max(0, Math.ceil(st.t))), 280, 56, Math.ceil(st.t) <= 3 ? '#ff6b4a' : '#f4f1ff');
    txt(x, 'Pulsa disparo', 340, 10);
    txt(x, 'Sigues en el nivel ' + st.lvl + ' con los puntos a 0', 366, 7, '#a59fd6');
  }
  if (st.state === 'over') {
    x.fillStyle = 'rgba(13,11,31,.55)'; x.fillRect(0, 0, W, FLOOR);
    txt(x, 'FIN DE PARTIDA', 230, 18, '#ff6fae'); txt(x, 'Pulsa disparo', 270, 10);
  }
}

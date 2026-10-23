// Dibujo de Lanza Burbujas con Phaser 3.90 (D-013): solo lee el estado de sim.js y los eventos;
// nunca cambia la partida. Coordenadas lógicas 640×360, dibujadas a 1280×720 con cámara ×2
// para que el texto y los bordes se vean nítidos al escalar.
import { ANCHO, ALTO, R, D, FILA, COLS, FILAS, LINEA, CANON_X, CANON_Y, PRISA, AVISO_PRISA, EVENTOS,
  T_MUNDO, TECHO_VS, RONDAS_GANAR, RIVALES, ancho, centroX, centroY, celda, trayectoria, temblando, bonusCaida } from './sim.js';
import { COLORES, MUNDOS, TOTAL_NIVELES, NUM_COLORES } from './niveles.js';
import { lienzoGato, GATOS, GATOS_RIVALES, POSES, ALTO_GATO } from './gatos.js';
import { RIVALES_CPU } from './cpu.js';

export const W = 640, H = 360;
const FUENTE = '"Press Start 2P", monospace';
const C = { fondo: '#0d0b1f', panel: '#1a1640', texto: '#f4f1ff', suave: '#a59fd6', j1: '#2ec4b6', j2: '#ff8fc7', acento: '#ffcf3a', peligro: '#ff5a6e' };
const hex = (s) => parseInt(s.slice(1), 16);
const LINEA_Y = R + (LINEA - 1) * FILA + R; // borde inferior de la fila 11: por debajo se pierde
const DISPOSICION_1J = [{ x: 220, y: 24, k: 1.25 }];
const DISPOSICION_VS = [{ x: 78, y: 52, k: 1.15 }, { x: 382, y: 52, k: 1.15 }];
const EV = Object.fromEntries(EVENTOS.map((n, i) => [n, i]));
const N_CELDAS = FILAS * COLS;

/* ---------- colores ---------- */
function mezclar(a, b, f) {
  const x = hex(a), y = hex(b);
  const m = (s) => Math.round(((x >> s) & 255) * (1 - f) + ((y >> s) & 255) * f);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}
const aclarar = (c, f) => mezclar(c, '#ffffff', f);
const oscurecer = (c, f) => mezclar(c, '#000000', f);

/* ---------- texturas hechas con canvas ---------- */
function lienzo(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }

function simbolo(x, tipo, cx, cy, s) {
  x.beginPath();
  switch (tipo) {
    case 'corazon':
      x.moveTo(cx, cy + s * 0.9);
      x.bezierCurveTo(cx - s * 1.3, cy - s * 0.1, cx - s * 0.6, cy - s * 1.1, cx, cy - s * 0.35);
      x.bezierCurveTo(cx + s * 0.6, cy - s * 1.1, cx + s * 1.3, cy - s * 0.1, cx, cy + s * 0.9); break;
    case 'estrella':
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? s * 0.45 : s; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
      break;
    case 'hoja': x.ellipse(cx, cy, s * 0.55, s, Math.PI / 4, 0, 7); break;
    case 'gota': x.moveTo(cx, cy - s); x.quadraticCurveTo(cx + s * 0.9, cy + s * 0.2, cx, cy + s * 0.8); x.quadraticCurveTo(cx - s * 0.9, cy + s * 0.2, cx, cy - s); break;
    case 'luna': x.arc(cx, cy, s * 0.85, Math.PI * 0.35, Math.PI * 1.65); x.arc(cx + s * 0.35, cy, s * 0.6, Math.PI * 1.55, Math.PI * 0.45, true); break;
    case 'triangulo': x.moveTo(cx, cy - s); x.lineTo(cx + s * 0.95, cy + s * 0.7); x.lineTo(cx - s * 0.95, cy + s * 0.7); break;
    case 'rombo': x.moveTo(cx, cy - s); x.lineTo(cx + s * 0.75, cy); x.lineTo(cx, cy + s); x.lineTo(cx - s * 0.75, cy); break;
    case 'cuadro': x.rect(cx - s * 0.7, cy - s * 0.7, s * 1.4, s * 1.4); break;
  }
  x.closePath(); x.fill();
}

// Burbuja a doble resolución (44 px): brillo, borde, símbolo para daltónicos
function texBurbuja(esc, clave, col) {
  const cv = lienzo(44, 44), x = cv.getContext('2d'), c = 22, r = 20;
  const g = x.createRadialGradient(c - 6, c - 7, 2, c, c, r);
  g.addColorStop(0, aclarar(col.hex, 0.5)); g.addColorStop(0.55, col.hex); g.addColorStop(1, oscurecer(col.hex, 0.3));
  x.fillStyle = g; x.beginPath(); x.arc(c, c, r - 1, 0, 7); x.fill();
  x.lineWidth = 2; x.strokeStyle = oscurecer(col.hex, 0.55); x.stroke();
  x.fillStyle = 'rgba(26,16,34,0.5)'; simbolo(x, col.simbolo, c + 1, c + 2, 7.5);
  x.fillStyle = 'rgba(255,255,255,0.8)'; x.beginPath(); x.ellipse(c - 7, c - 9, 5.5, 3, -0.6, 0, 7); x.fill();
  esc.textures.addCanvas(clave, cv);
}

function texAnillo(esc) {
  const cv = lienzo(44, 44), x = cv.getContext('2d');
  x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.beginPath(); x.arc(22, 22, 18, 0, 7); x.stroke();
  esc.textures.addCanvas('anillo', cv);
}

function texFlecha(esc) {
  const cv = lienzo(28, 96), x = cv.getContext('2d');
  x.fillStyle = '#f4f1ff'; x.strokeStyle = '#1a1022'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(14, 3); x.lineTo(25, 24); x.lineTo(18, 24); x.lineTo(18, 92); x.lineTo(10, 92); x.lineTo(10, 24); x.lineTo(3, 24); x.closePath();
  x.fill(); x.stroke();
  x.fillStyle = '#ffcf3a'; x.fillRect(11, 40, 6, 6); x.fillRect(11, 58, 6, 6);
  esc.textures.addCanvas('flecha', cv);
}

function texBase(esc) {
  const cv = lienzo(84, 44), x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 44); g.addColorStop(0, '#6c63b8'); g.addColorStop(1, '#2a2160');
  x.fillStyle = g; x.strokeStyle = '#1a1022'; x.lineWidth = 3;
  x.beginPath(); x.arc(42, 44, 38, Math.PI, 0); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#ffcf3a'; for (const a of [-2.6, -2.1, -1.05, -0.55]) { x.beginPath(); x.arc(42 + Math.cos(a) * 30, 44 + Math.sin(a) * 30, 2.5, 0, 7); x.fill(); }
  esc.textures.addCanvas('base', cv);
}

function texEngranaje(esc) {
  const cv = lienzo(40, 40), x = cv.getContext('2d');
  x.fillStyle = '#ffcf3a'; x.strokeStyle = '#1a1022'; x.lineWidth = 2.5;
  x.beginPath();
  for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, r = i % 2 ? 14 : 18; x.lineTo(20 + Math.cos(a) * r, 20 + Math.sin(a) * r); }
  x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#8a6a10'; x.beginPath(); x.arc(20, 20, 5, 0, 7); x.fill();
  x.fillStyle = '#1a1022'; x.fillRect(18, 2, 4, 12); // manivela
  esc.textures.addCanvas('engranaje', cv);
}

const GATOS_TODOS = [['j1', GATOS.j1], ['j2', GATOS.j2], ...GATOS_RIVALES.map((g, i) => ['r' + i, g])];
function texGatos(esc) {
  for (const [id, g] of GATOS_TODOS) for (const p of POSES) {
    const k = `g-${id}-${p}`;
    esc.textures.addCanvas(k, lienzoGato(g, p));
    esc.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}

/* ---------- fondos de los mundos (dibujados una vez al cambiar) ---------- */
function azarFijo(semilla) { let s = semilla; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

function pintarFondo(x, mundo) {
  x.setTransform(2, 0, 0, 2, 0, 0);
  const m = MUNDOS[mundo] || MUNDOS[0], az = azarFijo(1000 + mundo * 77);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, m.cielo[0]); g.addColorStop(1, m.cielo[1]);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const estrellas = (n, a) => { x.fillStyle = `rgba(255,255,255,${a})`; for (let i = 0; i < n; i++) { const s = az() < 0.15 ? 2 : 1; x.fillRect(Math.floor(az() * W), Math.floor(az() * H * 0.8), s, s); } };
  switch (mundo) {
    case 0: { // EL SALÓN: papel pintado, ventana con luna, sofá y estantería
      x.fillStyle = 'rgba(255,143,199,0.05)'; for (let i = 0; i < W; i += 24) x.fillRect(i, 0, 10, 300);
      x.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 12; i < W; i += 24) for (let j = 18; j < 300; j += 36) x.fillRect(i, j, 3, 3);
      x.fillStyle = '#3b2a5e'; x.fillRect(30, 40, 120, 90); x.fillStyle = '#0f1a3a'; x.fillRect(38, 48, 104, 74);
      x.fillStyle = '#f8f0c8'; x.beginPath(); x.arc(110, 72, 12, 0, 7); x.fill();
      x.fillStyle = '#3b2a5e'; x.fillRect(88, 48, 4, 74); x.fillRect(38, 83, 104, 4);
      x.fillStyle = '#4a2f2a'; x.fillRect(470, 70, 140, 8); x.fillRect(470, 130, 140, 8);
      for (let i = 0; i < 7; i++) { x.fillStyle = ['#ff6fae', '#5ee67a', '#4d8dff', '#ffcf3a'][i % 4]; x.fillRect(478 + i * 16, 46, 10, 24); }
      x.fillStyle = '#7a5c3a'; x.fillRect(560, 106, 20, 24); x.fillStyle = '#5ee67a'; x.beginPath(); x.arc(570, 100, 12, 0, 7); x.fill();
      x.fillStyle = '#2a1d3f'; x.fillRect(0, 300, W, 60);
      x.fillStyle = 'rgba(255,255,255,0.04)'; for (let i = 0; i < W; i += 40) x.fillRect(i, 300, 2, 60);
      x.fillStyle = '#7b3a5e'; x.fillRect(20, 250, 180, 50); x.fillRect(10, 236, 30, 64); x.fillRect(180, 236, 30, 64);
      x.fillStyle = '#9a4a76'; x.fillRect(40, 240, 140, 24);
      break;
    }
    case 1: { // EL JARDÍN: sol, colinas, valla y flores
      x.fillStyle = 'rgba(255,207,58,0.9)'; x.beginPath(); x.arc(560, 60, 26, 0, 7); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.12)'; for (const [cx, cy] of [[90, 60], [180, 40], [470, 110]]) { x.beginPath(); x.ellipse(cx, cy, 34, 10, 0, 0, 7); x.fill(); }
      x.fillStyle = '#1f5a3a'; x.beginPath(); x.ellipse(120, 330, 260, 110, 0, 0, 7); x.fill();
      x.fillStyle = '#28704a'; x.beginPath(); x.ellipse(520, 340, 260, 100, 0, 0, 7); x.fill();
      x.fillStyle = '#e8d8b0'; for (let i = 0; i < W; i += 22) { x.fillRect(i, 260, 14, 70); x.beginPath(); x.moveTo(i, 260); x.lineTo(i + 7, 252); x.lineTo(i + 14, 260); x.fill(); }
      x.fillRect(0, 276, W, 6); x.fillRect(0, 310, W, 6);
      for (let i = 0; i < 40; i++) { x.fillStyle = ['#ff6fae', '#ffcf3a', '#f4f1ff', '#a66bff'][i % 4]; x.beginPath(); x.arc(az() * W, 330 + az() * 28, 3, 0, 7); x.fill(); }
      break;
    }
    case 2: { // LOS TEJADOS: noche, luna y chimeneas
      estrellas(90, 0.7);
      x.fillStyle = '#f8f0c8'; x.beginPath(); x.arc(520, 70, 34, 0, 7); x.fill();
      x.fillStyle = 'rgba(0,0,0,0.12)'; x.beginPath(); x.arc(510, 62, 8, 0, 7); x.arc(532, 82, 5, 0, 7); x.fill();
      let px = 0;
      while (px < W) {
        const w = 60 + az() * 70, h = 60 + az() * 80, y = H - h;
        x.fillStyle = '#0a0b24'; x.beginPath(); x.moveTo(px, H); x.lineTo(px, y + 20); x.lineTo(px + w / 2, y); x.lineTo(px + w, y + 20); x.lineTo(px + w, H); x.fill();
        x.fillRect(px + w * 0.7, y - 6, 10, 22);
        if (az() < 0.7) { x.fillStyle = '#ffcf3a'; x.fillRect(px + w * 0.3, y + 40, 8, 10); }
        px += w - 4;
      }
      break;
    }
    case 3: { // LA COCINA: azulejos, encimera y cacerolas
      for (let i = 0; i < W; i += 20) for (let j = 0; j < 290; j += 20) { x.fillStyle = (i + j) / 20 % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(255,154,60,0.06)'; x.fillRect(i, j, 20, 20); }
      x.fillStyle = '#3a2a2a'; for (const cx of [60, 130, 520, 590]) { x.fillRect(cx - 1, 0, 2, 40); x.beginPath(); x.arc(cx, 56, 18, 0, 7); x.fill(); x.fillRect(cx + 16, 52, 18, 6); }
      x.fillStyle = '#5a3a2a'; x.fillRect(0, 290, W, 70); x.fillStyle = '#7a5038'; x.fillRect(0, 290, W, 10);
      x.fillStyle = '#e9e6f7'; x.beginPath(); x.ellipse(90, 286, 26, 8, 0, 0, 7); x.fill(); // cuenco
      x.fillStyle = '#4d8dff'; x.fillRect(560, 250, 40, 40); x.fillStyle = '#f4f1ff'; x.fillRect(568, 240, 24, 12); // brick de leche
      break;
    }
    case 4: { // EL DESVÁN: vigas, ventana redonda y cajas
      x.fillStyle = '#2a1e18'; x.beginPath(); x.moveTo(0, 0); x.lineTo(W / 2, -40); x.lineTo(W, 0); x.lineTo(W, 30); x.lineTo(W / 2, -10); x.lineTo(0, 30); x.fill();
      x.fillStyle = '#3a2a20'; for (let i = 40; i < W; i += 120) x.fillRect(i, 0, 14, H);
      x.fillStyle = '#4b3628'; x.beginPath(); x.arc(560, 80, 30, 0, 7); x.fill(); x.fillStyle = '#9ac8ff'; x.beginPath(); x.arc(560, 80, 24, 0, 7); x.fill();
      x.fillStyle = '#4b3628'; x.fillRect(558, 56, 4, 48); x.fillRect(536, 78, 48, 4);
      x.fillStyle = 'rgba(154,200,255,0.06)'; x.beginPath(); x.moveTo(540, 90); x.lineTo(420, 360); x.lineTo(640, 360); x.lineTo(580, 90); x.fill();
      x.fillStyle = '#6a4a2a'; x.fillRect(20, 280, 70, 60); x.fillRect(60, 240, 50, 40); x.fillRect(540, 290, 80, 50);
      x.strokeStyle = '#3a2a1a'; x.lineWidth = 2; x.strokeRect(20, 280, 70, 60); x.strokeRect(60, 240, 50, 40); x.strokeRect(540, 290, 80, 50);
      x.fillStyle = '#1e1612'; x.fillRect(0, 340, W, 20);
      break;
    }
    default: { // LA LUNA: espacio, la Tierra y cráteres
      estrellas(160, 0.8);
      x.fillStyle = '#2f6fd0'; x.beginPath(); x.arc(560, 70, 30, 0, 7); x.fill();
      x.fillStyle = '#3fae5a'; x.beginPath(); x.ellipse(550, 62, 12, 8, 0.4, 0, 7); x.ellipse(572, 82, 8, 6, 0, 0, 7); x.fill();
      x.fillStyle = '#9a98a8'; x.beginPath(); x.ellipse(W / 2, 420, 460, 120, 0, 0, 7); x.fill();
      x.fillStyle = '#7d7b8c'; for (const [cx, cy, r] of [[80, 330, 18], [160, 345, 10], [520, 330, 22], [600, 350, 12], [440, 350, 8]]) { x.beginPath(); x.ellipse(cx, cy, r, r * 0.4, 0, 0, 7); x.fill(); }
    }
  }
  x.setTransform(1, 0, 0, 1, 0, 0);
}

/* ---------- escena ---------- */
/**
 * Crea el juego de Phaser dentro de `padre`. `alFotograma(dt)` se llama en cada fotograma
 * (ahí la página avanza la simulación y llama a dibujar()).
 * @returns {Promise<{dibujar(st, vista): void, eventos(lista, st, vista): void, juego: Phaser.Game}>}
 */
export function crearRender(padre, alFotograma) {
  return new Promise((ok, mal) => {
    let api = null;
    class Escena extends Phaser.Scene {
      constructor() { super('lanza'); }
      create() {
        try { api = montar(this); ok(api); } catch (e) { mal(e); }
      }
      update(_t, d) { if (api) alFotograma(Math.min(0.25, d / 1000)); }
    }
    try {
      const juego = new Phaser.Game({
        // ?canvas=1: sin WebGL (móviles con problemas de gráficos y pruebas automáticas)
        type: new URLSearchParams(location.search).get('canvas') === '1' ? Phaser.CANVAS : Phaser.AUTO,
        parent: padre, width: W * 2, height: H * 2, backgroundColor: C.fondo, banner: false,
        audio: { noAudio: true }, input: { keyboard: false, mouse: false, touch: false, gamepad: false },
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        render: { antialias: true }, scene: Escena,
      });
      juego.__lb = true;
    } catch (e) { mal(e); }
  });
}

// Texto a doble tamaño y escala 0,5: con la cámara ×2 queda nítido con WebGL y con canvas
function texto(esc, x, y, tam, color, origenX = 0) {
  return esc.add.text(x, y, '', { fontFamily: FUENTE, fontSize: tam * 2 + 'px', color, align: 'center' }).setScale(0.5).setOrigin(origenX, 0);
}

function montar(esc) {
  const cam = esc.cameras.main;
  cam.setZoom(2); cam.centerOn(W / 2, H / 2);
  for (let c = 1; c <= NUM_COLORES; c++) texBurbuja(esc, 'b' + c, COLORES[c]);
  texAnillo(esc); texFlecha(esc); texBase(esc); texEngranaje(esc); texGatos(esc);

  // fondo
  const cvFondo = lienzo(W * 2, H * 2), ctxFondo = cvFondo.getContext('2d');
  pintarFondo(ctxFondo, 0);
  esc.textures.addCanvas('fondo', cvFondo);
  const fondo = esc.add.image(0, 0, 'fondo').setOrigin(0).setScale(0.5);
  let fondoMundo = 0;
  function ponerFondo(m) {
    if (m === fondoMundo) return;
    fondoMundo = m; pintarFondo(ctxFondo, m); esc.textures.get('fondo').refresh();
  }

  // paneles del HUD (detrás del texto, para que se lea sobre cualquier fondo)
  const paneles = esc.add.graphics();

  // menú: gatos grandes y burbujas que suben
  const menuGatos = [esc.add.image(96, 352, 'g-j1-sentado').setOrigin(0.5, 1).setScale(4), esc.add.image(544, 352, 'g-j2-sentado').setOrigin(0.5, 1).setScale(4).setFlipX(true)];
  const menuBurbujas = [];
  for (let i = 0; i < 14; i++) menuBurbujas.push({ img: esc.add.image(0, 0, 'b' + (1 + (i % NUM_COLORES))).setScale(0.5 + (i % 3) * 0.15).setAlpha(0.75), x: (i * 97) % W, y: H + ((i * 53) % H), v: 12 + (i % 5) * 6 });

  const ranuras = [crearRanura(esc), crearRanura(esc)];

  // HUD 1 jugador
  const hud1 = {
    grupo: [],
    add(o) { this.grupo.push(o); return o; },
  };
  const L = 28;
  hud1.lPuntos = hud1.add(texto(esc, L, 40, 7, C.suave)); hud1.lPuntos.setText('PUNTOS');
  hud1.puntos = hud1.add(texto(esc, L, 54, 12, C.acento));
  hud1.lRecord = hud1.add(texto(esc, L, 88, 7, C.suave)); hud1.lRecord.setText('RÉCORD');
  hud1.record = hud1.add(texto(esc, L, 102, 10, C.texto));
  hud1.lNivel = hud1.add(texto(esc, L, 134, 7, C.suave)); hud1.lNivel.setText('NIVEL');
  hud1.nivel = hud1.add(texto(esc, L, 148, 12, C.texto));
  hud1.mundo = hud1.add(texto(esc, L, 176, 7, C.acento).setLineSpacing(12));
  hud1.lTecho = hud1.add(texto(esc, L, 214, 7, C.suave)); hud1.lTecho.setText('EL TECHO BAJA EN');
  hud1.techo = hud1.add(esc.add.graphics());
  hud1.lSig = hud1.add(texto(esc, 528, 40, 7, C.suave, 0.5)); hud1.lSig.setText('SIGUIENTE');
  hud1.sig = hud1.add(esc.add.image(528, 80, 'b1').setScale(1));
  hud1.lAct = hud1.add(texto(esc, 528, 120, 7, C.suave, 0.5)); hud1.lAct.setText('');
  hud1.bonus = hud1.add(texto(esc, 528, 150, 10, C.acento, 0.5).setLineSpacing(10));

  // HUD versus
  const hudVs = { grupo: [], add(o) { this.grupo.push(o); return o; } };
  hudVs.nombres = [hudVs.add(texto(esc, 0, 8, 9, C.j1, 0.5)), hudVs.add(texto(esc, 0, 8, 9, C.j2, 0.5))];
  hudVs.marcas = hudVs.add(esc.add.graphics());
  hudVs.ronda = hudVs.add(texto(esc, W / 2, 72, 7, C.suave, 0.5).setLineSpacing(4));
  hudVs.vs = hudVs.add(texto(esc, W / 2, 124, 16, C.acento, 0.5)); hudVs.vs.setText('VS');
  hudVs.lTecho = hudVs.add(texto(esc, W / 2, 168, 7, C.suave, 0.5)); hudVs.lTecho.setText('TECHO');
  hudVs.techo = hudVs.add(esc.add.graphics());
  hudVs.basura = [hudVs.add(texto(esc, W / 2 - 14, 250, 8, C.texto, 1)), hudVs.add(texto(esc, W / 2 + 14, 250, 8, C.texto, 0))];
  hudVs.lBasura = hudVs.add(texto(esc, W / 2, 232, 6, C.suave, 0.5)); hudVs.lBasura.setText('BASURA');
  hudVs.red = hudVs.add(texto(esc, W / 2, 294, 6, C.suave, 0.5));

  // capa central de mensajes
  const capa = esc.add.container(W / 2, H / 2).setDepth(20);
  const capaFondo = esc.add.graphics();
  const capaTitulo = texto(esc, 0, -48, 16, C.acento, 0.5);
  const capaGrande = texto(esc, 0, -18, 28, C.texto, 0.5);
  const capaSub = texto(esc, 0, 26, 8, C.suave, 0.5).setLineSpacing(8);
  const capaGato = esc.add.image(0, 10, 'g-j1-feliz').setScale(3).setVisible(false);
  capa.add([capaFondo, capaGato, capaTitulo, capaGrande, capaSub]);
  function mostrarCapa(titulo, grande = '', sub = '', gato = null, ancho = 300) {
    capa.setVisible(true);
    if (capaTitulo.text !== titulo) capaTitulo.setText(titulo);
    if (capaGrande.text !== grande) capaGrande.setText(grande);
    if (capaSub.text !== sub) capaSub.setText(sub);
    capaTitulo.setVisible(!!titulo); capaGrande.setVisible(!!grande); capaSub.setVisible(!!sub);
    capaGato.setVisible(!!gato); if (gato && capaGato.texture.key !== gato) capaGato.setTexture(gato);
    // alto según lo que se muestra, para que nada se salga del panel
    const lineas = sub ? sub.split('\n').length : 0;
    const alto = 46 + (grande ? 40 : 0) + (gato ? 80 : 0) + (lineas ? lineas * 12 + 6 : 0);
    let y = -alto / 2 + 14;
    capaTitulo.y = y; y += 28;
    if (grande) { capaGrande.y = y; y += 40; }
    if (gato) { capaGato.y = y + 34; y += 80; }
    capaSub.y = y;
    const clave = ancho + '|' + alto;
    if (capaFondo._clave !== clave) {
      capaFondo._clave = clave; capaFondo.clear();
      capaFondo.fillStyle(hex(C.panel), 0.94); capaFondo.fillRoundedRect(-ancho / 2, -alto / 2, ancho, alto, 10);
      capaFondo.lineStyle(2, hex(C.acento), 1); capaFondo.strokeRoundedRect(-ancho / 2, -alto / 2, ancho, alto, 10);
    }
  }

  const depura = texto(esc, 4, 4, 6, C.acento).setDepth(30);

  let tiempo = 0;
  const yaVisto = { mundo: -1 };

  function slotDe(st, vista, b) { return st.tab.length === 1 ? 0 : b === vista.yo ? 0 : 1; }
  function gatoDe(st, b) {
    if (st.modo === 'cpu' && b === 1) return 'r' + Math.max(0, Math.min(RIVALES - 1, st.rival));
    return b === 0 ? 'j1' : 'j2';
  }

  /* ---------- dibujar ---------- */
  function dibujar(st, vista, dt) {
    tiempo += dt;
    const enMenu = !st;
    for (const g of menuGatos) g.setVisible(enMenu);
    for (const b of menuBurbujas) {
      b.img.setVisible(enMenu);
      if (!enMenu) continue;
      b.y -= b.v * dt; if (b.y < -20) { b.y = H + 20; b.x = (b.x + 211) % W; }
      b.img.setPosition(b.x + Math.sin(tiempo + b.v) * 8, b.y);
    }
    if (enMenu) {
      ponerFondo(0);
      menuGatos[0].setTexture(Math.floor(tiempo * 0.5) % 6 === 0 ? 'g-j1-parpadeo' : 'g-j1-sentado');
      menuGatos[1].setTexture(Math.floor(tiempo * 0.5 + 3) % 7 === 0 ? 'g-j2-parpadeo' : 'g-j2-sentado');
      for (const r of ranuras) r.cont.setVisible(false);
      for (const o of hud1.grupo) o.setVisible(false);
      for (const o of hudVs.grupo) o.setVisible(false);
      paneles.clear(); paneles._clave = null;
      if (vista.espera) mostrarCapa(vista.espera.titulo, vista.espera.grande, vista.espera.sub, null, 320);
      else capa.setVisible(false);
      depura.setText(vista.depura || '');
      return;
    }

    const vs = st.tab.length === 2;
    ponerFondo(st.modo === 'niveles' ? Math.max(0, st.mundo) : st.modo === 'cpu' ? st.rival % MUNDOS.length : 2);
    const disp = vs ? DISPOSICION_VS : DISPOSICION_1J;

    for (let b = 0; b < st.tab.length; b++) {
      const s = ranuras[slotDe(st, vista, b)], d = disp[slotDe(st, vista, b)];
      const marco = vs ? (b === 0 ? C.j1 : st.modo === 'cpu' ? GATOS_RIVALES[st.rival].collar : C.j2) : (MUNDOS[Math.max(0, st.mundo)] || MUNDOS[0]).marco;
      s.dibujar(st, b, vista, d, marco, gatoDe(st, b), dt, tiempo, b === vista.yo && vista.guia);
    }
    if (!vs) ranuras[1].cont.setVisible(false);

    // HUD
    for (const o of hud1.grupo) o.setVisible(!vs);
    for (const o of hudVs.grupo) o.setVisible(vs);
    if (paneles._clave !== vs) {
      paneles._clave = vs; paneles.clear(); paneles.fillStyle(hex(C.fondo), 0.92);
      if (vs) paneles.fillRoundedRect(W / 2 - 50, 60, 100, 284, 8);
      else { paneles.fillRoundedRect(14, 28, 192, 220, 8); paneles.fillRoundedRect(434, 28, 188, 160, 8); }
    }
    if (!vs) {
      const t = st.tab[0];
      cambiar(hud1.puntos, st.puntos.toLocaleString('es-ES'));
      cambiar(hud1.record, Math.max(vista.record || 0, st.puntos).toLocaleString('es-ES'));
      cambiar(hud1.nivel, st.nivel + '/' + TOTAL_NIVELES);
      cambiar(hud1.mundo, 'MUNDO ' + (Math.max(0, st.mundo) + 1) + '\n' + (MUNDOS[Math.max(0, st.mundo)] || MUNDOS[0]).nombre);
      const g = hud1.techo, quedan = Math.max(0, st.techo - t.desdeBajada), clave = quedan * 100 + st.techo;
      if (g._clave !== clave) { // solo se redibuja al cambiar
        g._clave = clave; g.clear();
        for (let i = 0; i < st.techo; i++) {
          g.fillStyle(i < quedan ? hex(quedan <= 2 ? C.peligro : C.acento) : hex(C.panel), 1);
          g.fillRect(L + i * 18, 230, 12, 12);
        }
      }
      if (t.siguiente > 0 && hud1.sig.texture.key !== 'b' + t.siguiente) hud1.sig.setTexture('b' + t.siguiente);
      hud1.sig.setVisible(t.siguiente > 0);
      hud1.bonus.setVisible(st.fase === 'limpio' || st.fase === 'final');
      if (st.fase === 'limpio' || st.fase === 'final') cambiar(hud1.bonus, 'BONUS\n+' + st.bonus.toLocaleString('es-ES'));
    } else {
      const izq = DISPOSICION_VS[0], der = DISPOSICION_VS[1], anchoT = ANCHO * izq.k;
      for (let b = 0; b < 2; b++) {
        const lado = slotDe(st, vista, b), dd = lado ? der : izq, n = hudVs.nombres[lado];
        n.x = dd.x + anchoT / 2;
        let nombre;
        if (st.modo === 'cpu') nombre = b === 0 ? 'TÚ' : RIVALES_CPU[st.rival].nombre;
        else nombre = b === vista.yo ? 'TÚ' : 'RIVAL';
        cambiar(n, nombre);
        n.setColor(b === 0 ? C.j1 : st.modo === 'cpu' ? GATOS_RIVALES[st.rival].collar : C.j2);
        cambiar(hudVs.basura[lado], st.tab[b].basura ? '+' + st.tab[b].basura : '');
      }
      const g = hudVs.marcas, clave = st.marcador[0] * 10 + st.marcador[1] + vista.yo * 100;
      if (g._clave !== clave) g.clear();
      for (let b = 0; g._clave !== clave && b < 2; b++) {
        const lado = slotDe(st, vista, b), dd = lado ? der : izq, cx = dd.x + anchoT / 2;
        for (let k = 0; k < RONDAS_GANAR; k++) {
          const x = cx + (k - (RONDAS_GANAR - 1) / 2) * 16, y = 30;
          g.lineStyle(2, hex(C.acento), 1); g.strokeCircle(x, y, 5);
          if (st.marcador[b] > k) { g.fillStyle(hex(C.acento), 1); g.fillCircle(x, y, 5); }
        }
      }
      g._clave = clave;
      cambiar(hudVs.ronda, st.modo === 'cpu' ? `RIVAL ${st.rival + 1}/${RIVALES}\n\nRONDA ${st.ronda}` : `RONDA ${st.ronda}`);
      const f = Math.max(0, 1 - st.techoT / TECHO_VS);
      const tg = hudVs.techo; tg.clear();
      tg.fillStyle(hex(C.panel), 1); tg.fillRect(W / 2 - 36, 182, 72, 8);
      tg.fillStyle(hex(f < 0.16 ? C.peligro : C.acento), 1); tg.fillRect(W / 2 - 36, 182, 72 * f, 8);
      cambiar(hudVs.red, vista.red || '');
    }

    capas(st, vista);
    depura.setText(vista.depura || '');
  }

  function capas(st, vista) {
    if (vista.sinCapa) { capa.setVisible(false); return; } // hay una pantalla HTML encima (iniciales, récords)
    const quedan = Math.max(0, Math.ceil(st.dur - st.t));
    switch (st.fase) {
      case 'continuar':
        mostrarCapa('¿CONTINUAR?', String(quedan), st.modo === 'niveles' ? 'PULSA DISPARO\n\nLOS PUNTOS VUELVEN A 0' : 'PULSA DISPARO');
        break;
      case 'over':
        mostrarCapa('FIN DE LA PARTIDA', '', vista.salir ? 'PULSA DISPARO' : ''); break;
      case 'final':
        mostrarCapa('¡LO HAS LOGRADO!', '', `HAS LIMPIADO LOS ${TOTAL_NIVELES} NIVELES\n\nBONUS +${st.bonus.toLocaleString('es-ES')}` + (vista.salir ? '\n\nPULSA DISPARO' : ''), 'g-j1-feliz', 340);
        break;
      case 'partida': {
        const gano = st.ganador === vista.yo;
        let sub = '';
        if (st.modo === 'online') {
          const yo = st.revancha[vista.yo], otro = st.revancha[1 - vista.yo];
          sub = st.t < 1 ? '' : yo ? (otro ? '' : 'ESPERANDO AL RIVAL…') : 'DISPARO = REVANCHA' + (otro ? '\n\n¡TU RIVAL QUIERE OTRA!' : '');
        }
        mostrarCapa(gano ? '¡VICTORIA!' : 'DERROTA', '', sub, `g-${gano ? (vista.yo === 0 ? 'j1' : 'j2') : (vista.yo === 0 ? 'j1' : 'j2')}-${gano ? 'feliz' : 'triste'}`, 300);
        break;
      }
      case 'rival':
        mostrarCapa(`RIVAL ${st.rival + 1}/${RIVALES}`, '', RIVALES_CPU[st.rival].nombre, `g-r${st.rival}-sentado`, 260); break;
      case 'campeon':
        mostrarCapa('¡CAMPEÓN!', '', `HAS GANADO A LOS ${RIVALES} GATOS` + (vista.salir ? '\n\nPULSA DISPARO' : ''), 'g-j1-feliz', 320);
        break;
      default:
        capa.setVisible(false);
    }
  }

  // los textos vacíos se ocultan (el renderizador canvas dibuja un cuadrito)
  function cambiar(t, v) { if (t.text !== v) t.setText(v); if (!v) t.setVisible(false); }

  /* ---------- efectos a partir de los eventos de sim.js ---------- */
  function eventos(lista, st, vista) {
    if (!st) return;
    for (let i = 0; i + 1 < lista.length; i += 2) {
      const k = lista[i] | 0, d = lista[i + 1] | 0;
      const deBurbuja = k === EV.explota || k === EV.cae || k === EV.basura || k === EV.pega;
      if (deBurbuja) {
        const b = Math.floor(d / 10000), j = Math.floor((d % 10000) / 10), c = d % 10;
        if (b > 1 || !st.tab[b] || j >= N_CELDAS) continue;
        const s = ranuras[slotDe(st, vista, b)], t = st.tab[b];
        const r = (j / COLS) | 0, x = centroX(r, j % COLS), y = centroY(t, r);
        if (k === EV.explota) s.efecto('pop', x, y, c);
        else if (k === EV.cae) s.efecto('cae', x, y, c);
        else if (k === EV.basura) { s.efecto('sube', x, y, c); s.oculta[j] = 0.4; }
        else if (k === EV.pega) s.oculta[j] = 0;
        continue;
      }
      if (k === EV.cascada || k === EV.envia) {
        const b = Math.floor(d / 100), n = d % 100;
        if (b > 1 || !st.tab[b]) continue;
        const s = ranuras[slotDe(st, vista, b)];
        if (k === EV.cascada) {
          if (st.modo === 'niveles') s.flotar('+' + bonusCaida(n).toLocaleString('es-ES'));
          if (n >= 3) s.feliz = 1.4;
        } else s.flotar('¡×' + n + '!');
      } else if (k === EV.baja && d <= 1 && st.tab[d]) ranuras[slotDe(st, vista, d)].golpe = 0.35;
      else if (k === EV.limpio) ranuras[0].feliz = 3;
      else if (k === EV.ronda && d > 0 && st.tab[d - 1]) ranuras[slotDe(st, vista, d - 1)].feliz = 3;
    }
  }

  return { dibujar, eventos, escena: esc };
}

/* ---------- un tablero en pantalla ---------- */
function crearRanura(esc) {
  const cont = esc.add.container(0, 0);
  const marco = esc.add.graphics(), techo = esc.add.graphics();
  const rejilla = esc.add.container(0, 0);
  const celdas = [];
  for (let r = 0; r < FILAS; r++) for (let c = 0; c < COLS; c++) {
    const im = esc.add.image(c < ancho(r) ? centroX(r, c) : -100, R + r * FILA, 'b1').setScale(0.5).setVisible(false);
    celdas.push(im); rejilla.add(im);
  }
  const guia = esc.add.graphics();
  const base = esc.add.image(CANON_X, ALTO - 1, 'base').setOrigin(0.5, 1).setScale(0.5);
  const engranaje = esc.add.image(CANON_X - 30, ALTO - 12, 'engranaje').setScale(0.5);
  const flecha = esc.add.image(CANON_X, CANON_Y, 'flecha').setOrigin(0.5, 1).setScale(0.5);
  const actual = esc.add.image(CANON_X, CANON_Y, 'b1').setScale(0.5);
  const siguiente = esc.add.image(CANON_X + 44, ALTO - 12, 'b1').setScale(0.42);
  const gato = esc.add.image(CANON_X - 56, ALTO - 1, 'g-j1-sentado').setOrigin(0.5, 1).setScale(1.25);
  const vuelo = esc.add.image(0, 0, 'b1').setScale(0.5).setVisible(false);
  const efectos = [];
  for (let i = 0; i < 48; i++) {
    const im = esc.add.image(0, 0, 'b1').setVisible(false);
    efectos.push({ im, vivo: false, tipo: '', t: 0, x: 0, y: 0, vx: 0, vy: 0, y1: 0 });
  }
  const flotantes = [];
  for (let i = 0; i < 4; i++) flotantes.push({ txt: texto(esc, ANCHO / 2, 0, 9, C.acento, 0.5).setVisible(false), t: 0 });
  const prisa = texto(esc, CANON_X, CANON_Y - 52, 16, C.peligro, 0.5);
  const banda = esc.add.graphics();
  const bandaTitulo = texto(esc, ANCHO / 2, 104, 12, C.acento, 0.5), bandaSub = texto(esc, ANCHO / 2, 128, 7, C.texto, 0.5).setLineSpacing(4);
  cont.add([marco, techo, rejilla, guia, base, engranaje, flecha, actual, siguiente, gato, vuelo,
    ...efectos.map((e) => e.im), ...flotantes.map((f) => f.txt), prisa, banda, bandaTitulo, bandaSub]);

  const previo = new Int8Array(N_CELDAS).fill(-1);
  const OUT = { i: -1, reb: 0, x: 0, y: 0, gx: 0, gy: 0 };
  let clMarco = '', clTecho = -1, clBanda = '', gris = false, angAntes = 0, giroT = 0;

  const s = {
    cont, oculta: new Float32Array(N_CELDAS), feliz: 0, golpe: 0,
    efecto(tipo, x, y, c) {
      const e = efectos.find((q) => !q.vivo) || efectos[0];
      e.vivo = true; e.tipo = tipo; e.t = 0; e.x = x; e.y = y; e.y1 = y;
      e.im.setVisible(true).setTexture(tipo === 'pop' ? 'anillo' : 'b' + c).setAlpha(1).setScale(0.5).setPosition(x, y);
      if (tipo === 'pop') e.im.setTint(hex(COLORES[c].hex));
      else e.im.clearTint();
      if (tipo === 'cae') { e.vx = (Math.random() - 0.5) * 120; e.vy = -40 - Math.random() * 80; }
      if (tipo === 'sube') { e.y = ALTO + R; e.im.y = e.y; }
    },
    flotar(txt) {
      const f = flotantes.find((q) => q.t <= 0) || flotantes[0];
      f.t = 1.1; f.txt.setText(txt).setVisible(true).setAlpha(1);
    },
    dibujar(st, b, vista, d, colMarco, idGato, dt, tiempo, conGuia) {
      const t = st.tab[b];
      cont.setVisible(true).setScale(d.k);
      // temblor del techo y golpe al bajar
      s.golpe = Math.max(0, s.golpe - dt);
      const tiembla = temblando(st, b);
      cont.x = d.x + (tiembla ? Math.sin(tiempo * 55) * 1.2 : 0);
      cont.y = d.y + (s.golpe > 0 ? Math.sin(s.golpe * 40) * s.golpe * 8 : 0);

      if (clMarco !== colMarco) {
        clMarco = colMarco; marco.clear();
        marco.fillStyle(hex(C.fondo), 0.82); marco.fillRect(0, 0, ANCHO, ALTO);
        marco.fillStyle(hex(colMarco), 1);
        marco.fillRect(-6, -10, 6, ALTO + 14); marco.fillRect(ANCHO, -10, 6, ALTO + 14); marco.fillRect(-6, ALTO, ANCHO + 12, 4);
        marco.fillStyle(0xffffff, 0.25); marco.fillRect(-5, -10, 2, ALTO + 14); marco.fillRect(ANCHO + 1, -10, 2, ALTO + 14);
        // línea de peligro
        marco.fillStyle(hex(C.peligro), 0.7);
        for (let x = 2; x < ANCHO; x += 10) marco.fillRect(x, LINEA_Y, 6, 2);
        clTecho = -1;
      }
      if (clTecho !== t.bajadas) {
        clTecho = t.bajadas; techo.clear();
        const h = t.bajadas * FILA;
        techo.fillStyle(hex(oscurecerHex(colMarco)), 1); techo.fillRect(0, -10, ANCHO, h + 10);
        techo.fillStyle(hex(colMarco), 1); techo.fillRect(0, h - 3, ANCHO, 3);
        techo.fillStyle(0x000000, 0.25); for (let y = -10 + FILA; y < h; y += FILA) techo.fillRect(0, y, ANCHO, 2);
        techo.fillStyle(0xffffff, 0.35); for (let x = 12; x < ANCHO; x += 34) for (let y = 4; y < h - 4; y += FILA) techo.fillRect(x, y, 3, 3);
      }

      // burbujas pegadas
      rejilla.y = t.bajadas * FILA;
      const cs = t.celdas, ahoraGris = t.perdido;
      for (let i = 0; i < N_CELDAS; i++) {
        const c = cs[i], im = celdas[i];
        if (c !== previo[i]) { previo[i] = c; if (c) im.setTexture('b' + c); }
        if (s.oculta[i] > 0) s.oculta[i] -= dt;
        im.visible = c > 0 && s.oculta[i] <= 0;
        if (ahoraGris !== gris) { if (ahoraGris) im.setTint(0x6c6a80).setAlpha(0.6); else im.clearTint().setAlpha(1); }
      }
      gris = ahoraGris;

      // cañón, burbuja cargada y siguiente
      const jugando = st.fase === 'juego' && !t.perdido;
      flecha.rotation = t.ang;
      engranaje.rotation = t.ang * 3;
      if (actual.texture.key !== 'b' + t.actual) actual.setTexture('b' + t.actual);
      actual.setVisible(!t.perdido);
      if (ahoraGris) actual.setTint(0x6c6a80); else actual.clearTint();
      siguiente.setVisible(t.siguiente > 0 && !t.perdido); if (t.siguiente > 0) siguiente.setTexture('b' + t.siguiente);

      // guía de puntería (solo la mía)
      guia.clear();
      if (conGuia && jugando && !t.vuelo.activo) {
        trayectoria(t, t.ang, OUT);
        const dx = OUT.gx - CANON_X, dy = OUT.gy - CANON_Y, l = Math.hypot(dx, dy), n = Math.floor(l / 9);
        guia.fillStyle(0xffffff, 0.55);
        for (let k = 2; k <= n; k++) guia.fillCircle(CANON_X + (dx * k * 9) / l, CANON_Y + (dy * k * 9) / l, 1.6);
      }

      // burbuja en vuelo (suavizada entre ticks)
      const v = t.vuelo;
      vuelo.setVisible(v.activo);
      if (v.activo) {
        const a = vista.alfa ?? 1;
        vuelo.setTexture('b' + v.c).setPosition(v.px + (v.x - v.px) * a, v.py + (v.y - v.py) * a);
      }

      // gato: manivela al girar, salta contento, triste al perder, parpadea
      if (Math.abs(t.ang - angAntes) > 1e-4) giroT = 0.18; else giroT -= dt;
      angAntes = t.ang;
      s.feliz -= dt;
      let pose = 'sentado';
      if (t.perdido) pose = 'triste';
      else if (s.feliz > 0) pose = 'feliz';
      else if (giroT > 0) pose = Math.floor(tiempo * 9) % 2 ? 'manivela' : 'sentado';
      else if (Math.floor(tiempo * 2 + b * 3) % 9 === 0) pose = 'parpadeo';
      const kg = `g-${idGato}-${pose}`;
      if (gato.texture.key !== kg) gato.setTexture(kg);
      gato.y = ALTO - 1 - (s.feliz > 0 ? Math.abs(Math.sin(tiempo * 9)) * 6 : 0);

      // cuenta atrás de la prisa
      const quedan = Math.ceil(PRISA - t.prisa);
      const verPrisa = jugando && !v.activo && quedan <= AVISO_PRISA;
      prisa.setVisible(verPrisa);
      if (verPrisa && prisa.text !== String(quedan)) prisa.setText(String(quedan));

      // efectos
      for (const e of efectos) {
        if (!e.vivo) continue;
        e.t += dt;
        if (e.tipo === 'pop') {
          const f = e.t / 0.28;
          if (f >= 1) { e.vivo = false; e.im.setVisible(false); continue; }
          e.im.setScale(0.45 + f * 0.5).setAlpha(1 - f);
        } else if (e.tipo === 'cae') {
          e.vy += 900 * dt; e.x += e.vx * dt; e.y += e.vy * dt;
          if (e.x < R || e.x > ANCHO - R) e.vx = -e.vx;
          e.im.setPosition(e.x, e.y).setAlpha(e.y > ALTO - 20 ? Math.max(0, 1 - (e.y - ALTO + 20) / 30) : 1);
          if (e.y > ALTO + 20) { e.vivo = false; e.im.setVisible(false); }
        } else if (e.tipo === 'sube') {
          const f = Math.min(1, e.t / 0.4), g = 1 - (1 - f) * (1 - f);
          e.im.setPosition(e.x, ALTO + R + (e.y1 - ALTO - R) * g);
          if (f >= 1) { e.vivo = false; e.im.setVisible(false); }
        }
      }
      for (const f of flotantes) {
        if (f.t <= 0) continue;
        f.t -= dt;
        f.txt.y = 90 + f.t * 30; f.txt.setAlpha(Math.min(1, f.t * 2));
        if (f.t <= 0) f.txt.setVisible(false);
      }

      // banda con mensajes de la fase sobre el tablero
      let titulo = '', sub = '';
      if (st.fase === 'listo') {
        const ya = st.dur - st.t < 0.45;
        if (st.modo === 'niveles') {
          titulo = ya ? '¡YA!' : 'NIVEL ' + st.nivel;
          if (!ya && st.dur === T_MUNDO) sub = 'MUNDO ' + (st.mundo + 1) + '\n\n' + MUNDOS[st.mundo].nombre;
        } else titulo = ya ? '¡YA!' : 'RONDA ' + st.ronda;
      } else if (st.fase === 'limpio') titulo = '¡LIMPIO!';
      else if (st.fase === 'perdido') titulo = '¡OH, NO!';
      else if (st.fase === 'ronda') titulo = st.ganador < 0 ? 'EMPATE' : st.ganador === b ? '¡GANA!' : 'PIERDE';
      const clave = titulo + '|' + sub;
      if (clave !== clBanda) {
        clBanda = clave; banda.clear();
        bandaTitulo.setVisible(!!titulo); bandaSub.setVisible(!!sub);
        if (titulo) {
          banda.fillStyle(hex(C.fondo), 0.85); banda.fillRect(0, 92, ANCHO, sub ? 66 : 40);
          bandaTitulo.setText(titulo); bandaSub.setText(sub);
        }
      }
    },
  };
  return s;
}

function oscurecerHex(c) {
  const v = hex(c);
  const m = (s) => Math.round(((v >> s) & 255) * 0.45);
  return '#' + ((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, '0');
}

// Menú de RetroGaming: estante de cartuchos navegable con táctil, teclado y mando.
import { JUEGOS } from '../juegos/registro.js';
import { VERSION } from './version.js';
import { crearEntradas } from './input/entradas.js';

const $ = (id) => document.getElementById(id);
const estante = $('estante');
const movReducido = matchMedia('(prefers-reduced-motion: reduce)');

/** @type {{juego: (typeof JUEGOS)[number] | null, el: HTMLElement}[]} */
const ranuras = [];
let sel = 0;
let lanzando = false;

/* ---------- construcción ---------- */
function crearCartucho(juego, i) {
  const li = document.createElement('li');
  const el = document.createElement(juego ? 'button' : 'div');
  el.className = juego ? 'cartucho' : 'cartucho vacio';
  if (juego) {
    el.type = 'button';
    el.tabIndex = -1;
    el.setAttribute('aria-label', `${juego.titulo}. ${textoJugadores(juego)}`);
    if (juego.etiqueta) el.style.setProperty('--etiqueta', juego.etiqueta);
    el.innerHTML = `
      <span class="carcasa">
        <span class="estrias"></span>
        <span class="etiqueta"><img alt="" width="240" height="260" decoding="async"></span>
        <span class="nombre"></span>
      </span>`;
    el.querySelector('img').src = juego.portada;
    el.querySelector('.nombre').textContent = juego.titulo;
    el.addEventListener('click', () => (i === sel ? lanzar() : seleccionar(i, { desplazar: true })));
  } else {
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <span class="carcasa">
        <span class="estrias"></span>
        <span class="etiqueta">Próximamente</span>
        <span class="nombre">Ranura libre</span>
      </span>`;
    el.addEventListener('click', () => seleccionar(i, { desplazar: true }));
  }
  li.append(el);
  estante.append(li);
  ranuras.push({ juego, el });
}

JUEGOS.forEach((j, i) => crearCartucho(j, i));
const vacias = Math.max(1, 3 - JUEGOS.length);
for (let k = 0; k < vacias; k++) crearCartucho(null, ranuras.length);

$('version').textContent = 'v' + VERSION;

/* ---------- ficha ---------- */
function textoJugadores(j) {
  const { min, max } = j.jugadores;
  if (min === max) return `${min} jugador${min > 1 ? 'es' : ''}`;
  return `${min} o ${max} jugadores`;
}

function leerRecord(clave) {
  try {
    const v = Number(localStorage.getItem(clave));
    return v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

function pintarFicha() {
  const j = ranuras[sel].juego;
  const datos = $('f-datos');
  datos.replaceChildren();
  $('f-titulo').textContent = j ? j.titulo : 'Ranura libre';
  $('f-desc').textContent = j ? j.descripcion : 'Aquí irá el próximo juego.';
  $('jugar').disabled = !j;
  if (!j) return;
  const chips = [textoJugadores(j)];
  if (j.online) chips.push('Online con código');
  if (j.mismoDispositivo && j.jugadores.max > 1) chips.push('2 en el mismo móvil');
  for (const t of chips) {
    const li = document.createElement('li');
    li.textContent = t;
    datos.append(li);
  }
  const record = j.claveRecord ? leerRecord(j.claveRecord) : 0;
  if (record) {
    const li = document.createElement('li');
    li.className = 'record';
    li.textContent = 'Récord ' + record.toLocaleString('es-ES');
    datos.append(li);
  }
}

/* ---------- selección ---------- */
function seleccionar(i, { desplazar = false, enfocar = false } = {}) {
  i = Math.max(0, Math.min(ranuras.length - 1, i));
  const cambia = i !== sel || !ranuras[i].el.hasAttribute('aria-current');
  if (cambia) {
    ranuras.forEach((r, k) => {
      if (k === i) r.el.setAttribute('aria-current', 'true');
      else r.el.removeAttribute('aria-current');
      if (r.juego) r.el.tabIndex = k === i ? 0 : -1;
    });
    sel = i;
    pintarFicha();
  }
  const el = ranuras[i].el;
  if (desplazar) {
    guiado = true; // mientras se desplaza solo, el scroll no cambia la selección
    esperarFinScroll(800);
    el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: movReducido.matches ? 'auto' : 'smooth' });
  }
  if (enfocar && ranuras[i].juego) el.focus({ preventScroll: true });
}

function mover(d) {
  if (lanzando) return;
  const enCartucho = document.activeElement?.classList.contains('cartucho');
  seleccionar(sel + d, { desplazar: true, enfocar: enCartucho || document.activeElement === document.body });
}

// Al deslizar con el dedo, el cartucho centrado pasa a ser el seleccionado.
let guiado = false, rafScroll = 0, tFin = 0;
function cartuchoCentrado() {
  const centro = estante.scrollLeft + estante.clientWidth / 2;
  let mejor = 0, dist = Infinity;
  ranuras.forEach((r, k) => {
    const li = r.el.parentElement; // offsetLeft relativo al estante (position:relative)
    const d = Math.abs(li.offsetLeft + li.offsetWidth / 2 - centro);
    if (d < dist) { dist = d; mejor = k; }
  });
  return mejor;
}
function esperarFinScroll(ms) {
  clearTimeout(tFin);
  tFin = setTimeout(() => {
    guiado = false;
    const k = cartuchoCentrado();
    if (k !== sel) seleccionar(k);
  }, ms);
}
estante.addEventListener('scroll', () => {
  esperarFinScroll(guiado ? 160 : 120);
  if (guiado || rafScroll) return;
  rafScroll = requestAnimationFrame(() => {
    rafScroll = 0;
    const k = cartuchoCentrado();
    if (k !== sel) seleccionar(k);
  });
}, { passive: true });

/* ---------- lanzar ---------- */
function lanzar() {
  const j = ranuras[sel].juego;
  if (!j || lanzando) return;
  lanzando = true;
  document.body.classList.add('lanzando');
  const ir = () => { location.href = j.ruta; };
  if (movReducido.matches) ir();
  else setTimeout(ir, 480);
}
$('jugar').addEventListener('click', lanzar);

// Al volver con el botón atrás, el navegador puede restaurar la página tal cual se quedó.
addEventListener('pageshow', () => {
  lanzando = false;
  document.body.classList.remove('lanzando');
  pintarFicha(); // el récord puede haber cambiado
});

/* ---------- ayuda según el último control usado ---------- */
const AYUDAS = {
  tactil: [['Desliza', 'elegir'], ['Toca', 'jugar']],
  teclado: [['← →', 'elegir'], ['Enter', 'jugar']],
  mando: [['✚', 'elegir'], ['A', 'jugar']],
};
function pintarAyuda(d) {
  const ayuda = $('ayuda');
  ayuda.replaceChildren();
  for (const [tecla, accion] of AYUDAS[d]) {
    const s = document.createElement('span');
    const k = document.createElement('kbd');
    k.textContent = tecla;
    s.append(k, accion);
    ayuda.append(s);
  }
}

/* ---------- teclado y mando (src/input) ---------- */
const entradas = crearEntradas({
  alPulsar(accion, _jugador, info) {
    if (accion === 'left') { mover(-1); return true; }
    if (accion === 'right') { mover(1); return true; }
    const entrar = accion === 'a' || (accion === 'start' && info.codigo !== 'Escape');
    if (!entrar || info.repeticion) return false;
    // Con teclado sobre un botón, el propio botón ya hace clic.
    if (info.origen === 'teclado' && document.activeElement?.tagName === 'BUTTON') return false;
    lanzar();
    return true;
  },
  alCambiarDispositivo: pintarAyuda,
});
pintarAyuda(entradas.dispositivo);

/* ---------- arranque ---------- */
seleccionar(0);

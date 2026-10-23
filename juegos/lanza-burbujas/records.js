// Tabla de récords de Lanza Burbujas (spec 005, §7; misma lógica que Revienta Burbujas). Funciones puras más leer/guardar
// en localStorage. Se guarda en cada móvil (también online: cada uno la suya).
// Entrada: { p: puntos, i: iniciales ('ABC', o 'ABC/XYZ' con 2 jugadores), f: nivel al que se llegó }

export const CLAVE = 'lb-records';
export const MAX_RECORDS = 10;
export const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Deja solo entradas válidas, ordenadas de más a menos puntos y como mucho 10. */
export function limpiar(lista) {
  if (!Array.isArray(lista)) return [];
  const ok = [];
  for (const e of lista) {
    if (!e || typeof e !== 'object') continue;
    const p = Math.floor(+e.p), f = Math.floor(+e.f), i = String(e.i || '').toUpperCase();
    if (!(p > 0 && p < 1e9) || !/^[A-Z0-9]{1,3}(\/[A-Z0-9]{1,3})?$/.test(i)) continue;
    ok.push({ p, i, f: f > 0 && f < 1000 ? f : 1 });
  }
  ok.sort((a, b) => b.p - a.p);
  return ok.slice(0, MAX_RECORDS);
}

/** ¿Entra esta puntuación en la tabla? */
export function entra(lista, puntos) {
  return puntos > 0 && (lista.length < MAX_RECORDS || puntos > lista[lista.length - 1].p);
}

/** Añade una entrada. Con empate queda por debajo de las que ya estaban.
 *  @returns {{ lista: object[], pos: number }} pos: índice de la nueva (-1 si no entra) */
export function insertar(lista, e) {
  const l = lista.slice();
  let pos = l.findIndex((o) => e.p > o.p);
  if (pos < 0) pos = l.length;
  if (pos >= MAX_RECORDS) return { lista: l, pos: -1 };
  l.splice(pos, 0, { p: e.p, i: e.i, f: e.f });
  return { lista: l.slice(0, MAX_RECORDS), pos };
}

export function leer(almacen = globalThis.localStorage) {
  try { return limpiar(JSON.parse(almacen.getItem(CLAVE) || '[]')); } catch (e) { return []; }
}

export function guardar(lista, almacen = globalThis.localStorage) {
  try { almacen.setItem(CLAVE, JSON.stringify(limpiar(lista))); return true; } catch (e) { return false; }
}

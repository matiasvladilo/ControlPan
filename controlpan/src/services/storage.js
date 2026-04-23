/**
 * Storage service — abstraction layer over localStorage.
 * When migrating to Supabase, replace this file with supabase.js
 * keeping the same function signatures.
 */

const KEY = 'controlpan_v1';

const DEFAULT_LOCALES = [
  { id: 1,  nombre: 'BOTILLERIA',              estado: 'ACTIVO', precio: 2060, contacto: '' },
  { id: 2,  nombre: 'BALCANICA 2',             estado: 'ACTIVO', precio: 2050, contacto: '' },
  { id: 3,  nombre: 'JORGE (MACUL)',            estado: 'ACTIVO', precio: 2100, contacto: '' },
  { id: 4,  nombre: 'DRAGAN (BALCANICA)',       estado: 'ACTIVO', precio: 2050, contacto: '' },
  { id: 5,  nombre: 'CASINO INST. DEPORTE',    estado: 'ACTIVO', precio: 2600, contacto: '' },
  { id: 6,  nombre: 'CLINICA',                 estado: 'ACTIVO', precio: 2600, contacto: '' },
  { id: 7,  nombre: 'DONOSO',                  estado: 'ACTIVO', precio: 2000, contacto: '' },
  { id: 8,  nombre: 'FUENTE SUIZA',            estado: 'ACTIVO', precio: 2400, contacto: '' },
  { id: 9,  nombre: 'CORTEZ',                  estado: 'ACTIVO', precio: 2200, contacto: '' },
  { id: 10, nombre: 'RODRIGO (CHILE ESPAÑA)',  estado: 'ACTIVO', precio: 2200, contacto: '' },
  { id: 11, nombre: 'MERCADO',                 estado: 'ACTIVO', precio: 2000, contacto: '' },
  { id: 12, nombre: 'D Y D',                   estado: 'ACTIVO', precio: 2060, contacto: '' },
  { id: 13, nombre: 'SWISSFOODSPA',            estado: 'ACTIVO', precio: 1900, contacto: '' },
  { id: 14, nombre: 'ECUADOR',                 estado: 'ACTIVO', precio: 2000, contacto: '' },
  { id: 15, nombre: 'CARRETAS',                estado: 'ACTIVO', precio: 2200, contacto: '' },
];

function getState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  const initial = { locales: DEFAULT_LOCALES, salidas: [], pagos: [], nextId: 100 };
  localStorage.setItem(KEY, JSON.stringify(initial));
  return initial;
}

function setState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function nextId(state) {
  state.nextId = (state.nextId || 100) + 1;
  return state.nextId;
}

// ── Locales ──────────────────────────────────────────────────────────────────
export function getLocales() {
  return getState().locales;
}

export function saveLocal(data) {
  const state = getState();
  if (data.id) {
    state.locales = state.locales.map(l => l.id === data.id ? { ...l, ...data } : l);
  } else {
    const nombre = data.nombre.trim().toUpperCase();
    if (state.locales.find(l => l.nombre === nombre)) {
      throw new Error('Ya existe un local con ese nombre');
    }
    state.locales.push({ ...data, nombre, id: nextId(state) });
  }
  setState(state);
  return state.locales;
}

export function deleteLocal(id) {
  const state = getState();
  const loc = state.locales.find(l => l.id === id);
  if (state.salidas.some(s => s.local === loc.nombre)) {
    throw new Error('No se puede eliminar un local con entregas. Márcalo como INACTIVO.');
  }
  state.locales = state.locales.filter(l => l.id !== id);
  setState(state);
  return state.locales;
}

// ── Salidas ───────────────────────────────────────────────────────────────────
export function getSalidas() {
  return getState().salidas;
}

export function saveSalida(data) {
  const state = getState();
  state.salidas.push({ ...data, id: nextId(state), ts: Date.now() });
  setState(state);
  return state.salidas;
}

export function deleteSalida(id) {
  const state = getState();
  state.salidas = state.salidas.filter(s => s.id !== id);
  setState(state);
  return state.salidas;
}

// ── Pagos ─────────────────────────────────────────────────────────────────────
export function getPagos() {
  return getState().pagos;
}

export function savePago(data) {
  const state = getState();
  state.pagos.push({ ...data, id: nextId(state), ts: Date.now() });
  setState(state);
  return state.pagos;
}

export function deletePago(id) {
  const state = getState();
  state.pagos = state.pagos.filter(p => p.id !== id);
  setState(state);
  return state.pagos;
}

// ── Export / Import ───────────────────────────────────────────────────────────
export function exportData() {
  return JSON.stringify(getState(), null, 2);
}

export function importData(json) {
  const data = JSON.parse(json);
  if (!data.locales || !data.salidas || !data.pagos) {
    throw new Error('Formato inválido');
  }
  setState(data);
}

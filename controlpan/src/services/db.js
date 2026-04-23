/**
 * Database service — Supabase backend.
 * Same function signatures as the old storage.js (localStorage),
 * now all async.
 */
import { supabase } from './supabaseClient';

function handleError(error) {
  if (error) throw new Error(error.message);
}

// ── Locales ───────────────────────────────────────────────────────────────────
export async function getLocales() {
  const { data, error } = await supabase
    .from('locales')
    .select('*')
    .order('nombre');
  handleError(error);
  return data;
}

export async function saveLocal(local) {
  if (local.id) {
    const { data, error } = await supabase
      .from('locales')
      .update({
        nombre:   local.nombre,
        precio:   local.precio,
        contacto: local.contacto,
        estado:   local.estado,
      })
      .eq('id', local.id)
      .select();
    handleError(error);
    return data[0];
  } else {
    const { data, error } = await supabase
      .from('locales')
      .insert({
        nombre:   local.nombre.trim().toUpperCase(),
        precio:   local.precio,
        contacto: local.contacto || '',
        estado:   local.estado || 'ACTIVO',
      })
      .select();
    handleError(error);
    return data[0];
  }
}

export async function deleteLocal(id) {
  const { error } = await supabase.from('locales').delete().eq('id', id);
  handleError(error);
}

// ── Productos ─────────────────────────────────────────────────────────────────
export async function getProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('local')
    .order('nombre');
  handleError(error);
  return data;
}

export async function saveProducto(prod) {
  if (prod.id) {
    const { data, error } = await supabase
      .from('productos')
      .update({ nombre: prod.nombre, unidad: prod.unidad, precio: prod.precio })
      .eq('id', prod.id)
      .select();
    handleError(error);
    return data[0];
  } else {
    const { data, error } = await supabase
      .from('productos')
      .insert({ local: prod.local, nombre: prod.nombre, unidad: prod.unidad, precio: prod.precio })
      .select();
    handleError(error);
    return data[0];
  }
}

export async function deleteProducto(id) {
  const { error } = await supabase.from('productos').delete().eq('id', id);
  handleError(error);
}

// ── Salidas ───────────────────────────────────────────────────────────────────
export async function getSalidas() {
  const { data, error } = await supabase
    .from('salidas')
    .select('*')
    .order('fecha', { ascending: false });
  handleError(error);
  return data;
}

export async function saveSalida(salida) {
  const { data, error } = await supabase
    .from('salidas')
    .insert({
      fecha:    salida.fecha,
      local:    salida.local,
      kg:       salida.kg,
      precio:   salida.precio,
      deuda:    salida.deuda,
      comment:  salida.comment || '',
      unidad:   salida.unidad || 'kg',
      producto: salida.producto || 'Pan',
    })
    .select();
  handleError(error);
  return data[0];
}

export async function deleteSalida(id) {
  const { error } = await supabase.from('salidas').delete().eq('id', id);
  handleError(error);
}

// ── Pagos ─────────────────────────────────────────────────────────────────────
export async function getPagos() {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .order('fecha', { ascending: false });
  handleError(error);
  return data;
}

export async function savePago(pago) {
  const { data, error } = await supabase
    .from('pagos')
    .insert({
      fecha:   pago.fecha,
      local:   pago.local,
      monto:   pago.monto,
      forma:   pago.forma,
      comment: pago.comment || '',
    })
    .select();
  handleError(error);
  return data[0];
}

export async function deletePago(id) {
  const { error } = await supabase.from('pagos').delete().eq('id', id);
  handleError(error);
}

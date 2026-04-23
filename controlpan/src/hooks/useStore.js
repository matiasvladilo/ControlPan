import { useState, useEffect, useCallback } from 'react';
import * as db from '../services/db';

export function useStore() {
  const [locales,   setLocales]   = useState([]);
  const [salidas,   setSalidas]   = useState([]);
  const [pagos,     setPagos]     = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    Promise.all([db.getLocales(), db.getSalidas(), db.getPagos(), db.getProductos()])
      .then(([l, s, p, pr]) => {
        setLocales(l);
        setSalidas(s);
        setPagos(p);
        setProductos(pr);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Locales ────────────────────────────────────────────────────────────────
  const saveLocal = useCallback(async (data) => {
    const updated = await db.saveLocal(data);
    setLocales(await db.getLocales());
    return updated;
  }, []);

  const removeLocal = useCallback(async (id) => {
    await db.deleteLocal(id);
    setLocales(prev => prev.filter(l => l.id !== id));
  }, []);

  // ── Productos ──────────────────────────────────────────────────────────────
  const saveProducto = useCallback(async (data) => {
    const saved = await db.saveProducto(data);
    setProductos(await db.getProductos());
    return saved;
  }, []);

  const removeProducto = useCallback(async (id) => {
    await db.deleteProducto(id);
    setProductos(prev => prev.filter(p => p.id !== id));
  }, []);

  // ── Salidas ────────────────────────────────────────────────────────────────
  const addSalida = useCallback(async (data) => {
    const nueva = await db.saveSalida(data);
    setSalidas(prev => [nueva, ...prev]);
    return nueva;
  }, []);

  const removeSalida = useCallback(async (id) => {
    await db.deleteSalida(id);
    setSalidas(prev => prev.filter(s => s.id !== id));
  }, []);

  // ── Pagos ──────────────────────────────────────────────────────────────────
  const addPago = useCallback(async (data) => {
    const nuevo = await db.savePago(data);
    setPagos(prev => [nuevo, ...prev]);
    return nuevo;
  }, []);

  const removePago = useCallback(async (id) => {
    await db.deletePago(id);
    setPagos(prev => prev.filter(p => p.id !== id));
  }, []);

  // ── CC helper ──────────────────────────────────────────────────────────────
  const getCC = useCallback((nombre) => {
    const s = salidas.filter(x => x.local === nombre);
    const p = pagos.filter(x => x.local === nombre);
    const deuda    = s.reduce((a, x) => a + (x.deuda || 0), 0);
    const pagado   = p.reduce((a, x) => a + (x.monto || 0), 0);
    const kg       = s.filter(x => (x.unidad || 'kg') === 'kg').reduce((a, x) => a + (parseFloat(x.kg) || 0), 0);
    const unidades = s.filter(x => x.unidad === 'unidad').reduce((a, x) => a + (parseFloat(x.kg) || 0), 0);
    return { deuda, pagado, saldo: deuda - pagado, kg, unidades };
  }, [salidas, pagos]);

  return {
    locales, salidas, pagos, productos,
    loading, error,
    saveLocal, removeLocal,
    saveProducto, removeProducto,
    addSalida, removeSalida,
    addPago, removePago,
    getCC,
  };
}

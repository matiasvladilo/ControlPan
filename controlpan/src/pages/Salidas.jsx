import { useState, useMemo } from 'react';
import { fmt, fmtCantidad, fmtDate, today, monthLabel } from '../utils';
import { Modal, Field } from '../components/Modal';
import { Icons } from '../components/Icons';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { toast } from '../components/Toast';
import { Badge } from '../components/Badge';


function ProductoChip({ label, sublabel, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
        padding: '10px 14px',
        borderRadius: 'var(--r-md)',
        border: `1.5px solid ${active ? 'var(--text)' : 'var(--border-strong)'}`,
        background: active ? 'var(--text)' : 'var(--surface)',
        color: active ? 'var(--text-inv)' : 'var(--text-2)',
        fontFamily: 'var(--font)',
        cursor: 'pointer',
        transition: 'var(--t-fast)',
        textAlign: 'left',
        minWidth: 0,
        flex: 1,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#fff' : 'var(--text)' }}>{label}</span>
      <span style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.6)' : 'var(--text-3)' }}>{sublabel}</span>
    </button>
  );
}

function SalidaModal({ open, onClose, locales, productos, onSave }) {
  const [fecha,      setFecha]      = useState(today());
  const [local,      setLocal]      = useState('');
  const [productoId, setProductoId] = useState('pan');
  const [kg,         setKg]         = useState('');
  const [precio,     setPrecio]     = useState('');
  const [comment,    setComment]    = useState('');

  const activeLocales     = locales.filter(l => l.estado === 'ACTIVO').sort((a, b) => a.nombre.localeCompare(b.nombre));
  const selectedLocal     = locales.find(l => l.nombre === local);
  const productosDelLocal = productos.filter(p => p.local === local);

  const selectedProd = productoId === 'pan'
    ? (selectedLocal ? { nombre: 'Pan', unidad: 'kg', precio: selectedLocal.precio } : { nombre: 'Pan', unidad: 'kg', precio: 0 })
    : productosDelLocal.find(p => String(p.id) === String(productoId));

  const unidad    = selectedProd?.unidad || 'kg';
  const isKg      = unidad === 'kg';
  const cantidad  = parseFloat(kg) || 0;
  const precioNum = parseFloat(precio) || 0;
  const deuda     = cantidad * precioNum;

  function handleLocalChange(nombre) {
    setLocal(nombre);
    setProductoId('pan');
    setKg('');
    const loc = locales.find(l => l.nombre === nombre);
    setPrecio(loc ? String(loc.precio) : '');
  }

  function handleProductoChange(val) {
    setProductoId(val);
    setKg('');
    if (val === 'pan') {
      setPrecio(selectedLocal ? String(selectedLocal.precio) : '');
    } else {
      const prod = productosDelLocal.find(p => String(p.id) === val);
      setPrecio(prod ? String(prod.precio) : '');
    }
  }

  function reset() {
    setFecha(today()); setLocal(''); setProductoId('pan');
    setKg(''); setPrecio(''); setComment('');
  }

  async function handleSave() {
    if (!local)        { toast.error('Selecciona un local'); return; }
    if (cantidad <= 0) { toast.error('La cantidad debe ser mayor a 0'); return; }
    if (precioNum <= 0){ toast.error('El precio debe ser mayor a $0'); return; }
    const productoNombre = selectedProd?.nombre || 'Pan';
    try {
      await onSave({ fecha, local, kg: cantidad, precio: precioNum, deuda: Math.round(deuda), comment, unidad, producto: productoNombre });
      reset();
      onClose();
      toast.success('Entrega registrada');
    } catch (e) {
      toast.error('Error al guardar: ' + e.message);
    }
  }

  // Todos los chips de producto disponibles
  const chips = [
    { id: 'pan', label: 'Pan', sublabel: selectedLocal ? `${fmt(selectedLocal.precio)}/kg` : '—/kg' },
    ...productosDelLocal.map(p => ({
      id: String(p.id),
      label: p.nombre,
      sublabel: `${fmt(p.precio)}/${p.unidad === 'kg' ? 'kg' : 'u.'}`,
    })),
  ];

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) { reset(); onClose(); } }}
      style={{ display: open ? 'flex' : 'none' }}
    >
      <div className="modal" style={{ width: 540 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>Nueva entrega</div>
        </div>

        {/* Sección 1: ¿A quién y cuándo? */}
        <div style={{ marginBottom: 20 }}>
          <div className="form-section-label">¿A quién y cuándo?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <div className="field">
              <label>Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div className="field">
              <label>Local</label>
              <select value={local} onChange={e => handleLocalChange(e.target.value)}>
                <option value="">Seleccionar...</option>
                {activeLocales.map(l => <option key={l.id} value={l.nombre}>{l.nombre}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Sección 2: ¿Qué producto? */}
        <div style={{ marginBottom: 20 }}>
          <div className="form-section-label">¿Qué producto?</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {chips.map(c => (
              <ProductoChip
                key={c.id}
                label={c.label}
                sublabel={c.sublabel}
                active={productoId === c.id}
                onClick={() => handleProductoChange(c.id)}
              />
            ))}
          </div>
        </div>

        {/* Sección 3: ¿Cuánto? */}
        <div style={{ marginBottom: 20 }}>
          <div className="form-section-label">¿Cuánto?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label>{isKg ? 'Kilogramos' : 'Unidades'}</label>
              <input
                type="number" value={kg}
                step={isKg ? '0.1' : '1'} min="0"
                placeholder={isKg ? '0.0' : '0'}
                onChange={e => setKg(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Precio / {isKg ? 'kg' : 'unidad'} ($)</label>
              <input type="number" value={precio} min="0" placeholder="0" onChange={e => setPrecio(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Total */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: deuda > 0 ? 'var(--text)' : 'var(--bg)',
          borderRadius: 'var(--r-md)',
          padding: '14px 18px',
          marginBottom: 16,
          transition: 'background 0.2s',
        }}>
          <span style={{ fontSize: 13, color: deuda > 0 ? 'rgba(255,255,255,0.6)' : 'var(--text-3)', fontWeight: 500 }}>
            {deuda > 0
              ? `${isKg ? cantidad + ' kg' : Math.round(cantidad) + ' u.'} × ${fmt(precioNum)}`
              : 'Total a cobrar'}
          </span>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em',
            color: deuda > 0 ? '#fff' : 'var(--text-3)',
          }}>
            {deuda > 0 ? fmt(deuda) : '$0'}
          </span>
        </div>

        {/* Comentario */}
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Comentario <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: 11 }}>— opcional</span></label>
          <input type="text" value={comment} placeholder="Observaciones..." onChange={e => setComment(e.target.value)} />
        </div>

        {/* Acciones */}
        <div className="modal-actions">
          <button className="btn-outline" onClick={() => { reset(); onClose(); }}>Cancelar</button>
          <button className="btn" onClick={handleSave}>{Icons.plus} Guardar entrega</button>
        </div>
      </div>
    </div>
  );
}

export function Salidas({ locales, salidas, productos, onAdd, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [fLocal,    setFLocal]    = useState('');
  const [fMes,      setFMes]      = useState('');
  const [fFecha,    setFFecha]    = useState('');
  const [fSearch,   setFSearch]   = useState('');

  const meses = useMemo(() => {
    const set = new Set(salidas.map(s => s.fecha.substring(0, 7)));
    return [...set].sort().reverse();
  }, [salidas]);

  const allLocales = useMemo(() =>
    [...new Set(salidas.map(s => s.local))].sort(), [salidas]);

  const filtered = useMemo(() => {
    let data = [...salidas].sort((a, b) =>
      b.fecha.localeCompare(a.fecha) || (b.created_at || '').localeCompare(a.created_at || '')
    );
    if (fLocal)  data = data.filter(s => s.local === fLocal);
    if (fFecha)  data = data.filter(s => s.fecha === fFecha);
    else if (fMes) data = data.filter(s => s.fecha.startsWith(fMes));
    if (fSearch) {
      const q = fSearch.toLowerCase();
      data = data.filter(s =>
        s.local.toLowerCase().includes(q) || (s.comment || '').toLowerCase().includes(q)
      );
    }
    return data;
  }, [salidas, fLocal, fMes, fSearch]);

  const totalDeuda = filtered.reduce((a, s) => a + (s.deuda || 0), 0);
  const totalKg = filtered
    .filter(s => (s.unidad || 'kg') === 'kg')
    .reduce((a, s) => a + (parseFloat(s.kg) || 0), 0);
  const totalUnidades = filtered
    .filter(s => s.unidad === 'unidad')
    .reduce((a, s) => a + (parseFloat(s.kg) || 0), 0);
  const activeFilterLabel = fFecha
    ? fmtDate(fFecha)
    : fMes ? monthLabel(fMes) : null;

  async function handleDelete(id) {
    try {
      await onDelete(id);
      toast.success('Entrega eliminada');
    } catch (e) {
      toast.error('Error al eliminar: ' + e.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Salidas</div>
          <div className="page-sub">Registro de entregas por local</div>
        </div>
        <div className="page-header-actions">
          <button className="btn" onClick={() => setShowModal(true)}>
            {Icons.plus} Nueva entrega
          </button>
        </div>
      </div>

      <div className="filter-row">
        <select value={fLocal} onChange={e => setFLocal(e.target.value)}>
          <option value="">Todos los locales</option>
          {allLocales.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <input
          type="date"
          value={fFecha}
          onChange={e => { setFFecha(e.target.value); if (e.target.value) setFMes(''); }}
          title="Filtrar por día exacto"
        />
        <select value={fMes} onChange={e => { setFMes(e.target.value); if (e.target.value) setFFecha(''); }}>
          <option value="">Todos los meses</option>
          {meses.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <input
          type="text"
          placeholder="Buscar..."
          value={fSearch}
          onChange={e => setFSearch(e.target.value)}
        />
        {(fFecha || fMes || fLocal || fSearch) && (
          <button className="btn-outline" style={{ whiteSpace: 'nowrap' }}
            onClick={() => { setFFecha(''); setFMes(''); setFLocal(''); setFSearch(''); }}>
            Limpiar
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state">
            {Icons.empty}
            <p><strong>Sin entregas</strong><br />
              {salidas.length === 0
                ? 'Registra la primera entrega del día.'
                : 'No hay entregas que coincidan con los filtros.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Local</th>
                <th>Producto</th>
                <th className="right">Cantidad</th>
                <th className="right">Precio unit.</th>
                <th className="right">Total</th>
                <th>Comentario</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const u = s.unidad || 'kg';
                return (
                  <tr key={s.id}>
                    <td className="muted">{fmtDate(s.fecha)}</td>
                    <td><strong>{s.local}</strong></td>
                    <td>
                      <Badge variant={u === 'kg' ? 'blue' : 'amber'}>
                        {s.producto || (u === 'kg' ? 'Pan' : 'Producto')}
                      </Badge>
                    </td>
                    <td className="mono right">{fmtCantidad(s.kg, u)}</td>
                    <td className="mono right">{fmt(s.precio)}/{u === 'kg' ? 'kg' : 'u.'}</td>
                    <td className="mono right">{fmt(s.deuda)}</td>
                    <td className="muted">{s.comment || ''}</td>
                    <td>
                      <button className="btn-danger" title="Eliminar" onClick={() => setConfirmId(s.id)}>
                        {Icons.trash}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>{filtered.length} entregas{activeFilterLabel ? ` · ${activeFilterLabel}` : ''}</td>
                <td className="mono right" style={{ fontSize: 12 }}>
                  {totalKg > 0 ? `${totalKg.toLocaleString('es-CL', { maximumFractionDigits: 1 })} kg` : '—'}
                </td>
                <td></td>
                <td className="mono right" style={{ fontWeight: 600, color: 'var(--text)' }}>{fmt(totalDeuda)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{
          display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap',
        }}>
          <div style={{
            flex: 1, minWidth: 160,
            background: 'var(--text)', color: '#fff',
            borderRadius: 'var(--r-lg)', padding: '16px 20px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total{activeFilterLabel ? ` · ${activeFilterLabel}` : ''}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {fmt(totalDeuda)}
            </span>
            <span style={{ fontSize: 12, opacity: 0.5 }}>{filtered.length} entregas</span>
          </div>
          {totalKg > 0 && (
            <div style={{
              minWidth: 130,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', padding: '16px 20px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kilos</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>
                {totalKg.toLocaleString('es-CL', { maximumFractionDigits: 1 })} kg
              </span>
            </div>
          )}
          {totalUnidades > 0 && (
            <div style={{
              minWidth: 130,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', padding: '16px 20px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unidades</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>
                {Math.round(totalUnidades)} u.
              </span>
            </div>
          )}
        </div>
      )}

      <SalidaModal
        open={showModal}
        onClose={() => setShowModal(false)}
        locales={locales}
        productos={productos}
        onSave={onAdd}
      />

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDelete(confirmId)}
        title="Eliminar entrega"
        message="Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar esta entrega?"
      />
    </div>
  );
}

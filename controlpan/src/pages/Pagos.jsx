import { useState, useMemo, useEffect } from 'react';
import { fmt, fmtDate, today } from '../utils';
import { Modal, Field } from '../components/Modal';
import { Badge } from '../components/Badge';
import { Icons } from '../components/Icons';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { toast } from '../components/Toast';

const FORMAS = ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'OTRO'];
const FORMA_VARIANT = { EFECTIVO: 'gray', TRANSFERENCIA: 'blue', CHEQUE: 'amber', OTRO: 'gray' };

export function PagoModal({ open, onClose, locales, getCC, prefillLocal, onSave }) {
  const [fecha,   setFecha]   = useState(today());
  const [local,   setLocal]   = useState('');
  const [monto,   setMonto]   = useState('');
  const [forma,   setForma]   = useState('EFECTIVO');
  const [comment, setComment] = useState('');

  const activeLocales = locales
    .filter(l => l.estado === 'ACTIVO')
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const cc = local ? getCC(local) : null;

  useEffect(() => {
    if (open) {
      setFecha(today());
      setLocal(prefillLocal || '');
      setMonto('');
      setForma('EFECTIVO');
      setComment('');
    }
  }, [open, prefillLocal]);

  async function handleSave() {
    if (!fecha || !local) { toast.error('Completa todos los campos'); return; }
    const montoNum = parseFloat(monto);
    if (!monto || montoNum <= 0) { toast.error('El monto debe ser mayor a $0'); return; }
    try {
      await onSave({ fecha, local, monto: montoNum, forma, comment });
      onClose();
    } catch (e) {
      toast.error('Error al guardar: ' + e.message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar pago"
      subtitle="Registra un cobro recibido de un local"
      actions={
        <>
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={handleSave}>
            {Icons.plus} Guardar pago
          </button>
        </>
      }
    >
      <Field label="Fecha">
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
      </Field>
      <Field label="Local">
        <select value={local} onChange={e => setLocal(e.target.value)}>
          <option value="">Seleccionar local...</option>
          {activeLocales.map(l => <option key={l.id} value={l.nombre}>{l.nombre}</option>)}
        </select>
      </Field>
      {cc && cc.saldo > 0 && (
        <div className="info-box">
          Saldo pendiente de <strong>{local}</strong>: <strong>{fmt(cc.saldo)}</strong>
        </div>
      )}
      <Field label="Monto pagado ($)">
        <input type="number" value={monto} min="0" placeholder="0" onChange={e => setMonto(e.target.value)} />
      </Field>
      <Field label="Forma de pago">
        <select value={forma} onChange={e => setForma(e.target.value)}>
          {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Field>
      <Field label="Comentario (opcional)">
        <input type="text" value={comment} placeholder="" onChange={e => setComment(e.target.value)} />
      </Field>
    </Modal>
  );
}

export function Pagos({ locales, pagos, getCC, onAdd, onDelete }) {
  const [showModal,    setShowModal]    = useState(false);
  const [prefillLocal, setPrefillLocal] = useState('');
  const [confirmId,    setConfirmId]    = useState(null);
  const [fLocal,  setFLocal]  = useState('');
  const [fDesde,  setFDesde]  = useState('');
  const [fHasta,  setFHasta]  = useState('');

  const allLocales = useMemo(() =>
    [...new Set(pagos.map(p => p.local))].sort(), [pagos]);

  const filtered = useMemo(() => {
    let data = [...pagos].sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.created_at || '').localeCompare(a.created_at || ''));
    if (fLocal)  data = data.filter(p => p.local === fLocal);
    if (fDesde)  data = data.filter(p => p.fecha >= fDesde);
    if (fHasta)  data = data.filter(p => p.fecha <= fHasta);
    return data;
  }, [pagos, fLocal, fDesde, fHasta]);

  const totalMonto = filtered.reduce((a, p) => a + (p.monto || 0), 0);
  const hasFilter = fLocal || fDesde || fHasta;

  function openModal(nombre) {
    setPrefillLocal(nombre || '');
    setShowModal(true);
  }

  async function handleDelete(id) {
    try {
      await onDelete(id);
      toast.success('Pago eliminado');
    } catch (e) {
      toast.error('Error al eliminar: ' + e.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Pagos</div>
          <div className="page-sub">Registro de cobros recibidos</div>
        </div>
        <div className="page-header-actions">
          <button className="btn" onClick={() => openModal('')}>
            {Icons.plus} Registrar pago
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
          value={fDesde}
          max={fHasta || undefined}
          onChange={e => setFDesde(e.target.value)}
          title="Desde"
        />
        <input
          type="date"
          value={fHasta}
          min={fDesde || undefined}
          onChange={e => setFHasta(e.target.value)}
          title="Hasta"
        />
        {hasFilter && (
          <button className="btn-outline" style={{ whiteSpace: 'nowrap' }}
            onClick={() => { setFLocal(''); setFDesde(''); setFHasta(''); }}>
            Limpiar
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state">
            {Icons.empty}
            <p><strong>Sin pagos</strong><br />
              {pagos.length === 0
                ? 'Registra el primer cobro cuando recibas un pago.'
                : 'No hay pagos que coincidan con los filtros.'}
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
                <th className="right">Monto</th>
                <th>Forma</th>
                <th>Comentario</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="muted">{fmtDate(p.fecha)}</td>
                  <td><strong>{p.local}</strong></td>
                  <td className="mono right" style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt(p.monto)}</td>
                  <td><Badge variant={FORMA_VARIANT[p.forma] || 'gray'}>{p.forma}</Badge></td>
                  <td className="muted">{p.comment || ''}</td>
                  <td>
                    <button className="btn-danger" title="Eliminar pago" onClick={() => setConfirmId(p.id)}>
                      {Icons.trash}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>{filtered.length} pagos</td>
                <td className="mono right" style={{ fontWeight: 600, color: 'var(--green)' }}>{fmt(totalMonto)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{
            flex: 1,
            background: 'var(--green)', color: '#fff',
            borderRadius: 'var(--r-lg)', padding: '16px 20px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total cobrado{fDesde || fHasta ? ` · ${fDesde && fHasta && fDesde === fHasta ? fmtDate(fDesde) : fDesde && fHasta ? `${fmtDate(fDesde)} – ${fmtDate(fHasta)}` : fDesde ? `Desde ${fmtDate(fDesde)}` : `Hasta ${fmtDate(fHasta)}`}` : ''}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {fmt(totalMonto)}
            </span>
            <span style={{ fontSize: 12, opacity: 0.6 }}>{filtered.length} pagos</span>
          </div>
        </div>
      )}

      <PagoModal
        open={showModal}
        onClose={() => setShowModal(false)}
        locales={locales}
        getCC={getCC}
        prefillLocal={prefillLocal}
        onSave={async (data) => { await onAdd(data); setShowModal(false); toast.success('Pago registrado'); }}
      />

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDelete(confirmId)}
        title="Eliminar pago"
        message="Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este pago?"
      />
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { fmt, fmtDate, today, monthLabel } from '../utils';
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
  const [fLocal,       setFLocal]       = useState('');
  const [fMes,         setFMes]         = useState('');

  const meses = useMemo(() => {
    const set = new Set(pagos.map(p => p.fecha.substring(0, 7)));
    return [...set].sort().reverse();
  }, [pagos]);

  const allLocales = useMemo(() =>
    [...new Set(pagos.map(p => p.local))].sort(), [pagos]);

  const filtered = useMemo(() => {
    let data = [...pagos].sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.created_at || '').localeCompare(a.created_at || ''));
    if (fLocal) data = data.filter(p => p.local === fLocal);
    if (fMes)   data = data.filter(p => p.fecha.startsWith(fMes));
    return data;
  }, [pagos, fLocal, fMes]);

  const totalMonto = filtered.reduce((a, p) => a + (p.monto || 0), 0);

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
        <select value={fMes} onChange={e => setFMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {meses.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
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

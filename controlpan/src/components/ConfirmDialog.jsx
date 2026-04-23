import { Modal } from './Modal';
import { Icons } from './Icons';

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Eliminar', danger = true }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button
            className={danger ? 'btn btn-red' : 'btn'}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'var(--text-2)' }}>
        <span style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }}>{Icons.warning}</span>
        <p style={{ fontSize: 14, lineHeight: 1.5 }}>{message}</p>
      </div>
    </Modal>
  );
}

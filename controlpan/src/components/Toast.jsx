import { useState, useEffect, useCallback } from 'react';
import { Icons } from './Icons';

// Simple event bus for toasts
const listeners = new Set();

export function toast(message, type = 'success') {
  listeners.forEach(fn => fn({ message, type, id: Date.now() }));
}

toast.success = (msg) => toast(msg, 'success');
toast.error   = (msg) => toast(msg, 'error');
toast.info    = (msg) => toast(msg, 'info');

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, 3500);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">
            {t.type === 'success' && Icons.check}
            {t.type === 'error'   && Icons.error}
            {t.type === 'info'    && Icons.warning}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

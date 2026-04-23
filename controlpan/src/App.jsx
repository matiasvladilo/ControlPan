import { useState } from 'react';
import { useStore } from './hooks/useStore';
import { Dashboard } from './pages/Dashboard';
import { Salidas } from './pages/Salidas';
import { Pagos, PagoModal } from './pages/Pagos';
import { CuentaCorriente } from './pages/CuentaCorriente';
import { Configuracion } from './pages/Configuracion';
import { Icons } from './components/Icons';
import { ToastContainer, toast } from './components/Toast';
import { today } from './utils';

const TABS = [
  { id: 'dashboard', label: 'Resumen',         icon: Icons.dashboard },
  { id: 'salidas',   label: 'Salidas',          icon: Icons.salidas   },
  { id: 'pagos',     label: 'Pagos',            icon: Icons.pagos     },
  { id: 'cuentas',   label: 'Cuenta Corriente', icon: Icons.cuentas   },
  { id: 'config',    label: 'Configuración',    icon: Icons.config    },
];

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: 16, color: 'var(--text-3)',
    }}>
      <div style={{
        width: 36, height: 36, border: '3px solid var(--border)',
        borderTopColor: 'var(--text)', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{ fontSize: 13 }}>Cargando datos...</span>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: 12, color: 'var(--red)',
      textAlign: 'center', padding: 24,
    }}>
      <span style={{ fontSize: 32 }}>⚠️</span>
      <strong style={{ fontSize: 15 }}>Error al conectar con la base de datos</strong>
      <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 420 }}>{message}</p>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const store = useStore();

  const [pagoModal,    setPagoModal]    = useState(false);
  const [pagoLocalPre, setPagoLocalPre] = useState('');

  function openPago(nombre) {
    setPagoLocalPre(nombre || '');
    setPagoModal(true);
  }

  async function handleSavePago(data) {
    try {
      await store.addPago(data);
      setPagoModal(false);
      toast.success('Pago registrado');
    } catch (e) {
      toast.error('Error al guardar: ' + e.message);
    }
  }

  const now = new Date();
  const dateLabel = now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <header>
        <div className="logo">
          <div className="logo-icon">🍞</div>
          Control Pan
          <span className="logo-badge">v1.0</span>
        </div>
        <div className="date-display">{dateLabel}</div>
      </header>

      <nav>
        {TABS.map(t => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <main>
        {store.error  && <ErrorScreen message={store.error} />}
        {store.loading && !store.error && <LoadingScreen />}

        {!store.loading && !store.error && (
          <>
            {tab === 'dashboard' && (
              <Dashboard
                locales={store.locales}
                salidas={store.salidas}
                pagos={store.pagos}
                getCC={store.getCC}
                onPago={openPago}
              />
            )}
            {tab === 'salidas' && (
              <Salidas
                locales={store.locales}
                salidas={store.salidas}
                productos={store.productos}
                onAdd={store.addSalida}
                onDelete={store.removeSalida}
              />
            )}
            {tab === 'pagos' && (
              <Pagos
                locales={store.locales}
                pagos={store.pagos}
                getCC={store.getCC}
                onAdd={store.addPago}
                onDelete={store.removePago}
              />
            )}
            {tab === 'cuentas' && (
              <CuentaCorriente
                locales={store.locales}
                salidas={store.salidas}
                pagos={store.pagos}
                onPago={openPago}
              />
            )}
            {tab === 'config' && (
              <Configuracion
                locales={store.locales}
                productos={store.productos}
                onSave={store.saveLocal}
                onDelete={store.removeLocal}
                onSaveProducto={store.saveProducto}
                onDeleteProducto={store.removeProducto}
              />
            )}
          </>
        )}
      </main>

      <PagoModal
        open={pagoModal}
        onClose={() => setPagoModal(false)}
        locales={store.locales}
        getCC={store.getCC}
        prefillLocal={pagoLocalPre}
        onSave={handleSavePago}
      />

      <ToastContainer />
    </>
  );
}

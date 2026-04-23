import { fmt, fmtKg, today, currentMonth } from '../utils';
import { StatusBadge } from '../components/Badge';
import { Icons } from '../components/Icons';

function StatCard({ label, value, sub, valueClass, icon, iconBg, iconColor, accentColor }) {
  return (
    <div className="stat-card">
      {accentColor && <div className="stat-card-accent" style={{ background: accentColor }} />}
      <div className="stat-header">
        <div className="stat-label">{label}</div>
        {icon && (
          <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
            {icon}
          </div>
        )}
      </div>
      <div className={`stat-value ${valueClass || ''}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function Dashboard({ locales, salidas, pagos, getCC, onPago }) {
  const now = new Date();
  const mes = currentMonth();

  const salidasMes = salidas.filter(s => s.fecha.startsWith(mes));
  const pagosMes   = pagos.filter(p => p.fecha.startsWith(mes));

  const totalDeuda  = salidas.reduce((a, s) => a + (s.deuda  || 0), 0);
  const totalPagado = pagos.reduce((a, p)   => a + (p.monto  || 0), 0);
  const saldoTotal  = totalDeuda - totalPagado;
  const kgMes       = salidasMes.reduce((a, s) => a + (parseFloat(s.kg) || 0), 0);
  const ventasMes   = salidasMes.reduce((a, s) => a + (s.deuda || 0), 0);
  const cobradoMes  = pagosMes.reduce((a, p)   => a + (p.monto || 0), 0);
  const entregasHoy = salidas.filter(s => s.fecha === today()).length;

  const conDeuda = locales
    .map(l => ({ ...l, cc: getCC(l.nombre) }))
    .filter(l => l.cc.saldo > 0)
    .sort((a, b) => b.cc.saldo - a.cc.saldo);

  const mesLabel = now.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Resumen</div>
          <div className="page-sub">Datos del mes: {mesLabel}</div>
        </div>
        <div className="page-header-actions"></div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Saldo pendiente"
          value={fmt(saldoTotal)}
          sub="Deuda total sin cobrar"
          valueClass={saldoTotal > 0 ? 'red' : 'green'}
          icon={Icons.deuda}
          iconBg={saldoTotal > 0 ? 'var(--red-bg)' : 'var(--green-bg)'}
          iconColor={saldoTotal > 0 ? 'var(--red)' : 'var(--green)'}
          accentColor={saldoTotal > 0 ? 'var(--red)' : 'var(--green)'}
        />
        <StatCard
          label="Ventas este mes"
          value={fmt(ventasMes)}
          sub={`${fmtKg(kgMes)} entregados`}
          icon={Icons.ventas}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue)"
          accentColor="var(--blue)"
        />
        <StatCard
          label="Cobrado este mes"
          value={fmt(cobradoMes)}
          sub={`${pagosMes.length} pagos registrados`}
          valueClass="green"
          icon={Icons.cobrado}
          iconBg="var(--green-bg)"
          iconColor="var(--green)"
          accentColor="var(--green)"
        />
        <StatCard
          label="Entregas hoy"
          value={entregasHoy}
          sub="Locales atendidos hoy"
          icon={Icons.hoy}
          iconBg="var(--purple-bg)"
          iconColor="var(--purple)"
          accentColor="var(--purple)"
        />
      </div>

      <div className="section-title">Locales con saldo pendiente</div>

      {conDeuda.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state">
            {Icons.empty}
            <p><strong>Todo al día</strong><br />No hay locales con saldo pendiente.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Local</th>
                <th className="right">Deuda total</th>
                <th className="right">Cobrado</th>
                <th className="right">Saldo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {conDeuda.map(l => (
                <tr key={l.id}>
                  <td><strong>{l.nombre}</strong></td>
                  <td className="mono right">{fmt(l.cc.deuda)}</td>
                  <td className="mono right">{fmt(l.cc.pagado)}</td>
                  <td className="mono right" style={{ color: 'var(--red)', fontWeight: 600 }}>{fmt(l.cc.saldo)}</td>
                  <td><StatusBadge saldo={l.cc.saldo} deuda={l.cc.deuda} /></td>
                  <td>
                    <button className="btn-outline btn-sm" onClick={() => onPago(l.nombre)}>
                      Registrar pago
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

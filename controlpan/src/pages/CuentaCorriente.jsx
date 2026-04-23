import { useState, useMemo } from 'react';
import { fmt, fmtKg, monthLabel } from '../utils';
import { StatusBadge } from '../components/Badge';
import { Icons } from '../components/Icons';

export function CuentaCorriente({ locales, salidas, pagos, onPago }) {
  const [filtro, setFiltro] = useState('');
  const [mes,    setMes]    = useState('');

  const meses = useMemo(() => {
    const set = new Set([
      ...salidas.map(s => s.fecha.substring(0, 7)),
      ...pagos.map(p => p.fecha.substring(0, 7)),
    ]);
    return [...set].sort().reverse();
  }, [salidas, pagos]);

  function getCCFiltered(nombre) {
    const sl = salidas.filter(s => s.local === nombre && (!mes || s.fecha.substring(0, 7) <= mes));
    const pl = pagos.filter(p => p.local === nombre && (!mes || p.fecha.substring(0, 7) <= mes));
    const deuda    = sl.reduce((a, s) => a + (s.deuda || 0), 0);
    const pagado   = pl.reduce((a, p) => a + (p.monto || 0), 0);
    const kg       = sl.filter(s => (s.unidad || 'kg') === 'kg').reduce((a, s) => a + (parseFloat(s.kg) || 0), 0);
    const unidades = sl.filter(s => s.unidad === 'unidad').reduce((a, s) => a + (parseFloat(s.kg) || 0), 0);
    return { deuda, pagado, saldo: deuda - pagado, kg, unidades };
  }

  const data = locales
    .filter(l => l.estado === 'ACTIVO')
    .map(l => ({ ...l, cc: getCCFiltered(l.nombre) }))
    .filter(l => {
      if (filtro === 'deuda')  return l.cc.saldo > 0;
      if (filtro === 'pagado') return l.cc.deuda > 0 && l.cc.saldo <= 0;
      return true;
    })
    .sort((a, b) => b.cc.saldo - a.cc.saldo);

  const totalDeuda  = data.reduce((a, l) => a + l.cc.deuda, 0);
  const totalPagado = data.reduce((a, l) => a + l.cc.pagado, 0);
  const totalSaldo  = data.reduce((a, l) => a + l.cc.saldo, 0);

  const subLabel = mes
    ? `Saldo acumulado hasta fin de ${monthLabel(mes)}`
    : 'Saldo total acumulado';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Cuenta Corriente</div>
          <div className="page-sub">{subLabel}</div>
        </div>
        <div className="page-header-actions">
          <select value={mes} onChange={e => setMes(e.target.value)}>
            <option value="">Todos los meses</option>
            {meses.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <select value={filtro} onChange={e => setFiltro(e.target.value)}>
            <option value="">Todos</option>
            <option value="deuda">Con deuda</option>
            <option value="pagado">Al día</option>
          </select>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state">
            {Icons.empty}
            <p><strong>Sin resultados</strong><br />No hay locales que coincidan con los filtros.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Local</th>
                <th className="right">KG entregados</th>
                <th className="right">Deuda total</th>
                <th className="right">Cobrado</th>
                <th style={{ minWidth: 100 }}>Progreso</th>
                <th className="right">Saldo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map(l => {
                const pct = l.cc.deuda > 0 ? Math.min(100, (l.cc.pagado / l.cc.deuda) * 100) : 0;
                const barColor = pct >= 90 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
                const saldoColor = l.cc.saldo > 0 ? 'var(--red)' : l.cc.saldo < 0 ? 'var(--green)' : 'var(--text-3)';
                return (
                  <tr key={l.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong>{l.nombre}</strong>
                        <StatusBadge saldo={l.cc.saldo} deuda={l.cc.deuda} />
                      </div>
                      {l.cc.unidades > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                          + {Math.round(l.cc.unidades).toLocaleString('es-CL')} u. entregadas
                        </div>
                      )}
                    </td>
                    <td className="mono right">{fmtKg(l.cc.kg)}</td>
                    <td className="mono right">{fmt(l.cc.deuda)}</td>
                    <td className="mono right" style={{ color: 'var(--green)' }}>{fmt(l.cc.pagado)}</td>
                    <td>
                      {l.cc.deuda > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{Math.round(pct)}%</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td className="mono right" style={{ fontWeight: 700, color: saldoColor }}>
                      {fmt(l.cc.saldo)}
                    </td>
                    <td>
                      {l.cc.saldo > 0 && (
                        <button className="btn-outline btn-sm" onClick={() => onPago(l.nombre)}>
                          {Icons.plus} Pago
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>{data.length} locales</td>
                <td></td>
                <td className="mono right" style={{ fontWeight: 600 }}>{fmt(totalDeuda)}</td>
                <td className="mono right" style={{ fontWeight: 600, color: 'var(--green)' }}>{fmt(totalPagado)}</td>
                <td></td>
                <td className="mono right" style={{ fontWeight: 700, color: totalSaldo > 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(totalSaldo)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

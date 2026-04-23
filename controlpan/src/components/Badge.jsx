export function Badge({ variant = 'gray', children }) {
  const cls = {
    green:  'badge-green',
    red:    'badge-red',
    amber:  'badge-amber',
    blue:   'badge-blue',
    purple: 'badge-purple',
    gray:   'badge-gray',
  }[variant] || 'badge-gray';
  return <span className={`badge ${cls}`}>{children}</span>;
}

export function StatusBadge({ saldo, deuda }) {
  if (deuda === 0) return <Badge variant="gray">Sin entregas</Badge>;
  if (saldo <= 0)  return <Badge variant="green">Al día</Badge>;
  const pct = (deuda - saldo) / deuda;
  if (pct >= 0.5)  return <Badge variant="amber">Pago parcial</Badge>;
  return             <Badge variant="red">Sin pago</Badge>;
}

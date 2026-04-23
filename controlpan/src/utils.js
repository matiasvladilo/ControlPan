export const fmt = (n) =>
  n == null || isNaN(n) ? '$0' : '$' + Math.round(n).toLocaleString('es-CL');

export const fmtKg = (n) =>
  parseFloat(n).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' kg';

// Formatea cantidad según unidad: '5.2 kg' o '50 unidades'
export const fmtCantidad = (n, unidad = 'kg') =>
  unidad === 'kg'
    ? parseFloat(n).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' kg'
    : Math.round(parseFloat(n)).toLocaleString('es-CL') + ' u.';

export const fmtDate = (d) => {
  if (!d) return '';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
};

export const today = () => new Date().toISOString().split('T')[0];

export const monthLabel = (ym) => {
  const [y, m] = ym.split('-');
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${names[parseInt(m) - 1]} ${y}`;
};

export const currentMonth = () => new Date().toISOString().substring(0, 7);

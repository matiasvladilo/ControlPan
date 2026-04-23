import { useState, useEffect } from 'react';
import { fmt } from '../utils';
import { Badge } from '../components/Badge';
import { Modal, Field } from '../components/Modal';
import { Icons } from '../components/Icons';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { toast } from '../components/Toast';

// ── Modal local ───────────────────────────────────────────────────────────────
function LocalModal({ open, onClose, editing, onSave }) {
  const [nombre,   setNombre]   = useState('');
  const [precio,   setPrecio]   = useState('');
  const [contacto, setContacto] = useState('');

  useEffect(() => {
    if (open) {
      setNombre(editing?.nombre || '');
      setPrecio(editing?.precio ? String(editing.precio) : '');
      setContacto(editing?.contacto || '');
    }
  }, [open, editing]);

  async function handleSave() {
    if (!nombre.trim() || !precio) { toast.error('Nombre y precio son obligatorios'); return; }
    await onSave({ ...(editing || {}), nombre: nombre.trim().toUpperCase(), precio: parseFloat(precio), contacto: contacto.trim(), estado: editing?.estado || 'ACTIVO' });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose}
      title={editing ? 'Editar local' : 'Nuevo local'}
      subtitle="El precio de referencia es el precio base de pan por kg"
      actions={<><button className="btn-outline" onClick={onClose}>Cancelar</button><button className="btn" onClick={handleSave}>Guardar</button></>}
    >
      <Field label="Nombre del local">
        <input type="text" value={nombre} placeholder="Ej: FUENTE SUIZA" onChange={e => setNombre(e.target.value)} />
      </Field>
      <Field label="Precio pan x KG ($)" hint="precio de referencia por defecto">
        <input type="number" value={precio} min="0" placeholder="2000" onChange={e => setPrecio(e.target.value)} />
      </Field>
      <Field label="Contacto (opcional)">
        <input type="text" value={contacto} onChange={e => setContacto(e.target.value)} />
      </Field>
    </Modal>
  );
}

// ── Modal producto ────────────────────────────────────────────────────────────
function ProductoModal({ open, onClose, localNombre, editing, onSave }) {
  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('unidad');
  const [precio, setPrecio] = useState('');

  useEffect(() => {
    if (open) {
      setNombre(editing?.nombre || '');
      setUnidad(editing?.unidad || 'unidad');
      setPrecio(editing?.precio ? String(editing.precio) : '');
    }
  }, [open, editing]);

  async function handleSave() {
    if (!nombre.trim() || !precio) { toast.error('Nombre y precio son obligatorios'); return; }
    await onSave({
      ...(editing || {}),
      local:  localNombre,
      nombre: nombre.trim(),
      unidad,
      precio: parseFloat(precio),
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose}
      title={editing ? 'Editar producto' : `Nuevo producto — ${localNombre}`}
      subtitle="Configura un producto con precio fijo para este local"
      actions={<><button className="btn-outline" onClick={onClose}>Cancelar</button><button className="btn" onClick={handleSave}>Guardar</button></>}
    >
      <Field label="Nombre del producto">
        <input type="text" value={nombre} placeholder="Ej: Empanadas de pino" onChange={e => setNombre(e.target.value)} />
      </Field>
      <Field label="Unidad de venta">
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: 'unidad', l: 'Por unidad (u.)' }, { v: 'kg', l: 'Por kilo (kg)' }].map(u => (
            <button key={u.v} type="button" onClick={() => setUnidad(u.v)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 'var(--r-md)',
                border: `1.5px solid ${unidad === u.v ? 'var(--text)' : 'var(--border-strong)'}`,
                background: unidad === u.v ? 'var(--text)' : 'var(--surface)',
                color: unidad === u.v ? 'var(--text-inv)' : 'var(--text-2)',
                fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'var(--t-fast)',
              }}
            >{u.l}</button>
          ))}
        </div>
      </Field>
      <Field label={`Precio x ${unidad === 'kg' ? 'KG' : 'Unidad'} ($)`}>
        <input type="number" value={precio} min="0" placeholder="0" onChange={e => setPrecio(e.target.value)} />
      </Field>
    </Modal>
  );
}

// ── Fila de local con productos expandibles ───────────────────────────────────
function LocalRow({ local, productos, onEdit, onToggle, onDelete, onAddProducto, onEditProducto, onDeleteProducto }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = local.estado === 'ACTIVO';
  const misProductos = productos.filter(p => p.local === local.nombre);

  return (
    <>
      <tr className={isActive ? '' : 'row-inactive'}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-3)', padding: '2px 4px', borderRadius: 4,
                fontSize: 10, transition: 'var(--t-fast)',
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
              title={expanded ? 'Colapsar' : 'Ver productos'}
            >▶</button>
            <strong>{local.nombre}</strong>
            {misProductos.length > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>
                +{misProductos.length} producto{misProductos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </td>
        <td className="mono right">{fmt(local.precio)}/kg</td>
        <td className="muted">{local.contacto || '—'}</td>
        <td><Badge variant={isActive ? 'green' : 'gray'}>{isActive ? 'Activo' : 'Inactivo'}</Badge></td>
        <td>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
            <button className={isActive ? 'btn-toggle-on' : 'btn-toggle-off'} onClick={() => onToggle(local)}>
              {isActive ? 'Desactivar' : 'Reactivar'}
            </button>
            <button className="btn-outline btn-sm" onClick={() => onEdit(local)}>{Icons.edit} Editar</button>
            <button className="btn-danger" onClick={() => onDelete(local.id)}>{Icons.trash}</button>
          </div>
        </td>
      </tr>

      {/* Fila expandida de productos */}
      {expanded && (
        <tr>
          <td colSpan={5} style={{ padding: 0, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ padding: '12px 16px 12px 40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                  Productos configurados para {local.nombre}
                </span>
                <button className="btn-outline btn-sm" onClick={() => onAddProducto(local.nombre)}>
                  {Icons.plus} Agregar producto
                </button>
              </div>

              {/* Pan (precio del local — siempre presente) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Badge variant="blue">Pan</Badge>
                    <span style={{ fontSize: 13 }}>Pan (precio base)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>{fmt(local.precio)}/kg</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Editar en → Editar local</span>
                  </div>
                </div>

                {/* Productos adicionales */}
                {misProductos.map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Badge variant="amber">Producto</Badge>
                      <span style={{ fontSize: 13 }}>{p.nombre}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>
                        {fmt(p.precio)}/{p.unidad === 'kg' ? 'kg' : 'u.'}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-outline btn-sm" onClick={() => onEditProducto(p)}>{Icons.edit}</button>
                        <button className="btn-danger" onClick={() => onDeleteProducto(p.id)}>{Icons.trash}</button>
                      </div>
                    </div>
                  </div>
                ))}

                {misProductos.length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-3)', padding: '4px 0' }}>
                    Solo pan configurado. Agrega empanadas, hallullas u otros productos.
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Modal: agregar producto a locales seleccionados ───────────────────────────
function ProductoGlobalModal({ open, onClose, localesActivos, onSave }) {
  const [nombre,    setNombre]    = useState('');
  const [unidad,    setUnidad]    = useState('unidad');
  const [precio,    setPrecio]    = useState('');
  const [saving,    setSaving]    = useState(false);
  const [selected,  setSelected]  = useState(new Set());

  // Al abrir, seleccionar todos por defecto
  useEffect(() => {
    if (open) setSelected(new Set(localesActivos.map(l => l.id)));
  }, [open, localesActivos]);

  function toggleLocal(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === localesActivos.length) setSelected(new Set());
    else setSelected(new Set(localesActivos.map(l => l.id)));
  }

  const destinos = localesActivos.filter(l => selected.has(l.id));

  async function handleSave() {
    if (!nombre.trim() || !precio) { toast.error('Nombre y precio son obligatorios'); return; }
    if (destinos.length === 0) { toast.error('Selecciona al menos un local'); return; }
    setSaving(true);
    try {
      await Promise.all(
        destinos.map(l => onSave({
          local:  l.nombre,
          nombre: nombre.trim(),
          unidad,
          precio: parseFloat(precio),
        }))
      );
      toast.success(`"${nombre.trim()}" agregado a ${destinos.length} local${destinos.length > 1 ? 'es' : ''}`);
      setNombre(''); setUnidad('unidad'); setPrecio('');
      onClose();
    } catch (e) {
      toast.error('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  const allSelected = selected.size === localesActivos.length;

  return (
    <Modal open={open} onClose={onClose}
      title="Agregar producto a locales"
      subtitle="Elige los locales que recibirán este producto. Luego puedes editar el precio de cada uno individualmente."
      actions={
        <>
          <button className="btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn" onClick={handleSave} disabled={saving || destinos.length === 0}>
            {saving ? 'Guardando...' : <>{Icons.plus} Agregar a {destinos.length} local{destinos.length !== 1 ? 'es' : ''}</>}
          </button>
        </>
      }
    >
      <Field label="Nombre del producto">
        <input type="text" value={nombre} placeholder="Ej: Empanadas de pino" onChange={e => setNombre(e.target.value)} />
      </Field>
      <Field label="Unidad de venta">
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: 'unidad', l: 'Por unidad (u.)' }, { v: 'kg', l: 'Por kilo (kg)' }].map(u => (
            <button key={u.v} type="button" onClick={() => setUnidad(u.v)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 'var(--r-md)',
                border: `1.5px solid ${unidad === u.v ? 'var(--text)' : 'var(--border-strong)'}`,
                background: unidad === u.v ? 'var(--text)' : 'var(--surface)',
                color: unidad === u.v ? 'var(--text-inv)' : 'var(--text-2)',
                fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'var(--t-fast)',
              }}
            >{u.l}</button>
          ))}
        </div>
      </Field>
      <Field label={`Precio base x ${unidad === 'kg' ? 'KG' : 'Unidad'} ($)`} hint="editable por local después">
        <input type="number" value={precio} min="0" placeholder="0" onChange={e => setPrecio(e.target.value)} />
      </Field>

      {/* Selección de locales */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Locales destino</span>
          <button type="button" onClick={toggleAll}
            style={{ fontSize: 11, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
            {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {localesActivos.map(l => {
            const on = selected.has(l.id);
            return (
              <button key={l.id} type="button" onClick={() => toggleLocal(l.id)}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--r-pill)',
                  border: `1.5px solid ${on ? 'var(--text)' : 'var(--border-strong)'}`,
                  background: on ? 'var(--text)' : 'var(--surface)',
                  color: on ? 'var(--text-inv)' : 'var(--text-2)',
                  fontFamily: 'var(--font)', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', transition: 'var(--t-fast)',
                }}
              >
                {on && <span style={{ marginRight: 4 }}>✓</span>}{l.nombre}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export function Configuracion({ locales, productos, onSave, onDelete, onSaveProducto, onDeleteProducto }) {
  const [showLocalModal,   setShowLocalModal]   = useState(false);
  const [editingLocal,     setEditingLocal]     = useState(null);
  const [confirmLocalId,   setConfirmLocalId]   = useState(null);
  const [showProdModal,    setShowProdModal]    = useState(false);
  const [prodLocalNombre,  setProdLocalNombre]  = useState('');
  const [editingProd,      setEditingProd]      = useState(null);
  const [confirmProdId,    setConfirmProdId]    = useState(null);
  const [showGlobalModal,  setShowGlobalModal]  = useState(false);

  function openNewLocal()     { setEditingLocal(null);  setShowLocalModal(true); }
  function openEditLocal(l)   { setEditingLocal(l);     setShowLocalModal(true); }
  function openAddProducto(nombre) { setProdLocalNombre(nombre); setEditingProd(null);  setShowProdModal(true); }
  function openEditProducto(p)     { setProdLocalNombre(p.local); setEditingProd(p);    setShowProdModal(true); }

  async function handleSaveLocal(data) {
    try { await onSave(data); toast.success(data.id ? 'Local actualizado' : 'Local creado'); setShowLocalModal(false); }
    catch (e) { toast.error(e.message); }
  }

  async function handleToggle(local) {
    const newEstado = local.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await onSave({ ...local, estado: newEstado });
      toast.success(newEstado === 'INACTIVO' ? `${local.nombre} desactivado` : `${local.nombre} reactivado`);
    } catch (e) { toast.error(e.message); }
  }

  async function handleDeleteLocal(id) {
    try { await onDelete(id); toast.success('Local eliminado'); }
    catch (e) { toast.error(e.message); }
  }

  async function handleSaveProducto(data) {
    try {
      await onSaveProducto(data);
      toast.success(data.id ? 'Producto actualizado' : 'Producto agregado');
      setShowProdModal(false);
    } catch (e) { toast.error(e.message); }
  }

  async function handleDeleteProducto(id) {
    try { await onDeleteProducto(id); toast.success('Producto eliminado'); }
    catch (e) { toast.error(e.message); }
  }

  const sorted    = [...locales].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const activos   = sorted.filter(l => l.estado === 'ACTIVO');
  const inactivos = sorted.filter(l => l.estado === 'INACTIVO');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Configuración</div>
          <div className="page-sub">
            {activos.length} locales activos
            {inactivos.length > 0 && ` · ${inactivos.length} inactivos`}
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn-outline" onClick={() => setShowGlobalModal(true)}>
            {Icons.plus} Producto a todos los locales
          </button>
          <button className="btn" onClick={openNewLocal}>{Icons.plus} Nuevo local</button>
        </div>
      </div>

      <div className="info-box" style={{ marginBottom: 20 }}>
        Cada local tiene un <strong>precio base de pan por kg</strong> y puede tener productos adicionales
        (empanadas, hallullas, etc.) con su propio precio y unidad. Haz clic en <strong>▶</strong> para ver y gestionar los productos de cada local.
      </div>

      {sorted.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state">{Icons.empty}<p><strong>Sin locales</strong><br />Agrega el primer local para comenzar.</p></div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Local</th>
                <th className="right">Precio pan</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activos.length > 0 && <>
                <tr className="table-section-row"><td colSpan={5}>Activos — {activos.length}</td></tr>
                {activos.map(l => (
                  <LocalRow key={l.id} local={l} productos={productos}
                    onEdit={openEditLocal} onToggle={handleToggle} onDelete={id => setConfirmLocalId(id)}
                    onAddProducto={openAddProducto} onEditProducto={openEditProducto} onDeleteProducto={id => setConfirmProdId(id)}
                  />
                ))}
              </>}
              {inactivos.length > 0 && <>
                <tr className="table-section-row"><td colSpan={5}>Inactivos — {inactivos.length}</td></tr>
                {inactivos.map(l => (
                  <LocalRow key={l.id} local={l} productos={productos}
                    onEdit={openEditLocal} onToggle={handleToggle} onDelete={id => setConfirmLocalId(id)}
                    onAddProducto={openAddProducto} onEditProducto={openEditProducto} onDeleteProducto={id => setConfirmProdId(id)}
                  />
                ))}
              </>}
            </tbody>
          </table>
        </div>
      )}

      <LocalModal open={showLocalModal} onClose={() => setShowLocalModal(false)} editing={editingLocal} onSave={handleSaveLocal} />
      <ProductoModal open={showProdModal} onClose={() => setShowProdModal(false)} localNombre={prodLocalNombre} editing={editingProd} onSave={handleSaveProducto} />
      <ProductoGlobalModal open={showGlobalModal} onClose={() => setShowGlobalModal(false)} localesActivos={activos} onSave={onSaveProducto} />
      <ConfirmDialog open={confirmLocalId !== null} onClose={() => setConfirmLocalId(null)} onConfirm={() => handleDeleteLocal(confirmLocalId)} title="Eliminar local" message="¿Estás seguro de que quieres eliminar este local?" />
      <ConfirmDialog open={confirmProdId !== null} onClose={() => setConfirmProdId(null)} onConfirm={() => handleDeleteProducto(confirmProdId)} title="Eliminar producto" message="¿Eliminar este producto del local?" />
    </div>
  );
}

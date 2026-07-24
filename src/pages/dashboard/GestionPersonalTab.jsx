import { useCallback, useEffect, useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icons'
import { api } from '../../lib/api'

function RolBadge({ rol }) {
  const styles = {
    rrpp: 'border-strobe text-strobe',
    guardia: 'border-cyan-400 text-cyan-400',
    cajera: 'border-emerald-400 text-emerald-400',
  }
  return (
    <span className={`border px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${styles[rol] || 'border-gray-400 text-gray-400'}`}>
      {rol}
    </span>
  )
}

export default function GestionPersonalTab({ onCreatePersonal, onAsignarPersonal }) {
  const [personalList, setPersonalList] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, nombre }

  const fetchPersonal = useCallback(async () => {
    try {
      const data = await api.get('/personal/')
      setPersonalList(Array.isArray(data) ? data : [])
    } catch {
      setPersonalList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPersonal() }, [fetchPersonal])

  const startEdit = (p) => {
    setEditingId(p.id)
    setEditForm({ nombre: p.nombre?.split(' ')[0] || '', apellido: p.nombre?.split(' ').slice(1).join(' ') || '' })
  }
  const cancelEdit = () => { setEditingId(null); setEditForm({}) }
  const saveEdit = async (id) => {
    setBusy(true)
    try { await api.patch(`/personal/${id}/`, editForm); setEditingId(null); fetchPersonal() }
    catch { /* */ }
    finally { setBusy(false) }
  }
  const handleDelete = (id, nombre) => {
    setDeleteTarget({ id, nombre })
  }
  const confirmDelete = async () => {
    const { id } = deleteTarget
    setDeleteTarget(null)
    setBusy(true)
    try { await api.delete(`/personal/${id}/`); fetchPersonal() }
    catch { /* */ }
    finally { setBusy(false) }
  }

  if (loading) return <div className="grid min-h-48 place-items-center"><div className="size-8 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" /></div>

  return (
    <div data-testid="gestion-personal-tab">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Equipo completo</p>
          <h2 className="display-title mt-2 text-3xl">MI PERSONAL</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={onCreatePersonal} className="btn-primary"><Icon name="plus" size={15} /> Crear Personal</button>
          <button onClick={onAsignarPersonal} className="btn-secondary"><Icon name="users" size={15} /> Asignar a evento</button>
        </div>
      </div>

      <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
        {personalList.length} persona{personalList.length !== 1 ? 's' : ''} registrada{personalList.length !== 1 ? 's' : ''}
      </p>

      {personalList.length === 0 ? (
        <div className="panel grid min-h-48 place-items-center p-8 text-center">
          <div>
            <Icon name="users" size={38} className="mx-auto text-gray-400 dark:text-muted" />
            <p className="display-title mt-5 text-2xl">SIN PERSONAL</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-muted">Creá tu primer RRPP, guardia o cajera.</p>
          </div>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px] text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Nombre</th>
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Usuario</th>
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Rol</th>
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Eventos</th>
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {personalList.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-white/5">
                    {editingId === p.id ? (
                      <>
                        <td className="p-3"><div className="flex gap-1"><input className="field min-h-8 w-24 text-xs" value={editForm.nombre} onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))} /><input className="field min-h-8 w-24 text-xs" value={editForm.apellido} onChange={(e) => setEditForm((f) => ({ ...f, apellido: e.target.value }))} /></div></td>
                        <td className="p-3 font-mono text-xs text-gray-500 dark:text-muted">@{p.username}</td>
                        <td className="p-3"><RolBadge rol={p.rol} /></td>
                        <td className="p-3" />
                        <td className="p-3 text-right"><div className="flex justify-end gap-1"><button disabled={busy} onClick={() => saveEdit(p.id)} className="border border-strobe px-2 py-1 font-mono text-[9px] font-bold uppercase text-strobe hover:bg-strobe/10">Guardar</button><button onClick={cancelEdit} className="border border-white/15 px-2 py-1 font-mono text-[9px] font-bold uppercase text-muted">Cancelar</button></div></td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 text-sm font-semibold">{p.nombre}</td>
                        <td className="p-3 font-mono text-xs text-gray-500 dark:text-muted">@{p.username}</td>
                        <td className="p-3"><RolBadge rol={p.rol} /></td>
                        <td className="p-3 font-mono text-xs">{p.eventos_asignados || 0} eventos</td>
                        <td className="p-3 text-right"><div className="flex justify-end gap-1"><button onClick={() => startEdit(p)} className="grid size-8 place-items-center border border-white/15 text-gray-400 hover:border-strobe hover:text-strobe dark:text-muted" aria-label="Editar"><Icon name="edit" size={14} /></button><button disabled={busy} onClick={() => handleDelete(p.id, p.nombre)} className="grid size-8 place-items-center border border-white/15 text-gray-400 hover:border-door-red hover:text-door-red dark:text-muted" aria-label="Eliminar"><Icon name="close" size={14} /></button></div></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Desactivar personal"
        message={`¿Desactivar a "${deleteTarget?.nombre || ''}"?`}
        confirmText="Desactivar"
        cancelText="Cancelar"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

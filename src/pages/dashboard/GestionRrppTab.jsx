import { useCallback, useEffect, useState } from 'react'
import Icon from '../../components/Icons'
import { api } from '../../lib/api'

/**
 * GestionRrppTab — Panel for the owner to manage their RRPP: list, create, edit, delete.
 * Commission is defined per-event at assignment time, not shown here.
 *
 * Props:
 *   onCreateRrpp: () => void — opens RrppFormModal from parent
 *   onAsignarRrpp: () => void — opens AsignarRrppModal from parent
 */

export default function GestionRrppTab({ onCreateRrpp, onAsignarRrpp }) {
  const [rrppList, setRrppList] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [busy, setBusy] = useState(false)

  const fetchRrpp = useCallback(async () => {
    try {
      const data = await api.get('/rrpp/')
      setRrppList(Array.isArray(data) ? data : [])
    } catch {
      setRrppList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRrpp() }, [fetchRrpp])

  const startEdit = (rrpp) => {
    setEditingId(rrpp.id)
    setEditForm({
      nombre: rrpp.nombre?.split(' ')[0] || '',
      apellido: rrpp.nombre?.split(' ').slice(1).join(' ') || '',
    })
  }

  const cancelEdit = () => { setEditingId(null); setEditForm({}) }

  const saveEdit = async (id) => {
    setBusy(true)
    try {
      await api.patch(`/rrpp/${id}/`, editForm)
      setEditingId(null)
      fetchRrpp()
    } catch {
      // silently fail
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar al RRPP "${nombre}"? Se desactivará su cuenta.`)) return
    setBusy(true)
    try {
      await api.delete(`/rrpp/${id}/`)
      fetchRrpp()
    } catch {
      // silently fail
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-48 place-items-center">
        <div className="size-8 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" />
      </div>
    )
  }

  return (
    <div data-testid="gestion-rrpp-tab">
      {/* Header with actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Gestión de RRPP</p>
          <h2 className="display-title mt-2 text-3xl">MIS RRPP</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={onCreateRrpp} className="btn-primary" data-testid="btn-crear-rrpp">
            <Icon name="plus" size={15} /> Crear RRPP
          </button>
          <button onClick={onAsignarRrpp} className="btn-secondary" data-testid="btn-asignar-rrpp">
            <Icon name="users" size={15} /> Asignar a evento
          </button>
        </div>
      </div>

      {/* Counter */}
      <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
        {rrppList.length} RRPP registrado{rrppList.length !== 1 ? 's' : ''}
      </p>

      {rrppList.length === 0 ? (
        <div className="panel grid min-h-48 place-items-center p-8 text-center" data-testid="rrpp-empty">
          <div>
            <Icon name="users" size={38} className="mx-auto text-gray-400 dark:text-muted" />
            <p className="display-title mt-5 text-2xl">SIN RRPP</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-muted">Creá tu primer RRPP con el botón de arriba.</p>
          </div>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left" data-testid="rrpp-table">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Nombre</th>
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Usuario</th>
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Eventos</th>
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rrppList.map((rrpp) => (
                  <tr key={rrpp.id} className="border-b border-gray-100 dark:border-white/5" data-testid="rrpp-row">
                    {editingId === rrpp.id ? (
                      <>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <input className="field min-h-8 w-24 text-xs" value={editForm.nombre} onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" />
                            <input className="field min-h-8 w-24 text-xs" value={editForm.apellido} onChange={(e) => setEditForm((f) => ({ ...f, apellido: e.target.value }))} placeholder="Apellido" />
                          </div>
                        </td>
                        <td className="p-3 font-mono text-xs text-gray-500 dark:text-muted">@{rrpp.username}</td>
                        <td className="p-3" />
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button disabled={busy} onClick={() => saveEdit(rrpp.id)} className="border border-strobe px-2 py-1 font-mono text-[9px] font-bold uppercase text-strobe hover:bg-strobe/10">Guardar</button>
                            <button onClick={cancelEdit} className="border border-white/15 px-2 py-1 font-mono text-[9px] font-bold uppercase text-muted">Cancelar</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 text-sm font-semibold">{rrpp.nombre}</td>
                        <td className="p-3 font-mono text-xs text-gray-500 dark:text-muted">@{rrpp.username}</td>
                        <td className="p-3 font-mono text-xs">{rrpp.asignaciones?.length || 0} eventos</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => startEdit(rrpp)} className="grid size-8 place-items-center border border-white/15 text-gray-400 hover:border-strobe hover:text-strobe dark:text-muted" aria-label="Editar">
                              <Icon name="edit" size={14} />
                            </button>
                            <button disabled={busy} onClick={() => handleDelete(rrpp.id, rrpp.nombre)} className="grid size-8 place-items-center border border-white/15 text-gray-400 hover:border-door-red hover:text-door-red dark:text-muted" aria-label="Eliminar">
                              <Icon name="close" size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

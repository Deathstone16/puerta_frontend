import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const EMPTY_FORM = { nombre: '', apellido: '', dni: '' }

export default function RrppListaPage() {
  const { eventoId } = useParams()
  const { session } = useAuth()
  const [evento, setEvento] = useState(null)
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)

  // Load data
  const loadData = useCallback(async () => {
    try {
      const data = await api.get('/rrpp/mi-panel/')
      const events = Array.isArray(data) ? data : (data?.eventos || data?.results || [])
      const ev = events.find((e) => String(e.id || e.evento_id) === String(eventoId))
      if (ev) {
        setEvento(ev)
        setGuests(ev.estadisticas?.invitados_recientes || ev.invitados_recientes || ev.invitados || [])
      }
    } catch {
      // API unavailable — keep empty state
    } finally {
      setLoading(false)
    }
  }, [eventoId])

  useEffect(() => { loadData() }, [loadData])

  // Split guests
  const listaGuests = guests.filter((g) => g.estado !== 'pendiente')
  const pendingGuests = guests.filter((g) => g.estado === 'pendiente')

  // Approve
  const handleApprove = async (guestId) => {
    setBusy(true)
    try { await api.post(`/rrpp/aprobar-invitado/${guestId}/`, {}) } catch { /* demo */ }
    setGuests((prev) => prev.map((g) => g.id === guestId ? { ...g, estado: 'aprobado' } : g))
    setBusy(false)
  }

  // Reject (remove completely)
  const handleReject = async (guestId) => {
    setBusy(true)
    try { await api.post(`/rrpp/rechazar-invitado/${guestId}/`, {}) } catch { /* demo */ }
    setGuests((prev) => prev.filter((g) => g.id !== guestId))
    setBusy(false)
  }

  // Delete from list
  const handleDelete = async (guestId) => {
    if (!window.confirm('¿Eliminar este invitado de la lista?')) return
    setBusy(true)
    try { await api.post(`/rrpp/eliminar-invitado/${guestId}/`, {}) } catch { /* demo */ }
    setGuests((prev) => prev.filter((g) => g.id !== guestId))
    setBusy(false)
  }

  // Add manual
  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addForm.nombre.trim() || !addForm.apellido.trim() || !/^\d{7,8}$/.test(addForm.dni)) return
    setBusy(true)
    try {
      // Use slug from event links for the anotar endpoint
      const slug = evento?.links?.[0]?.slug || evento?.slug || ''
      const result = await api.post('/rrpp/anotar-invitado/', { slug_lista: slug, ...addForm })
      // Backend returns "pendiente" but RRPP added it manually → treat as "aprobado" in UI
      const newGuest = result?.invitado
        ? { ...result.invitado, estado: 'aprobado' }
        : { id: `manual-${Date.now()}`, ...addForm, estado: 'aprobado' }
      setGuests((prev) => [newGuest, ...prev])
    } catch {
      const newGuest = { id: `demo-${Date.now()}`, ...addForm, estado: 'aprobado' }
      setGuests((prev) => [newGuest, ...prev])
    }
    setAddForm(EMPTY_FORM)
    setAddOpen(false)
    setBusy(false)
  }

  // Start edit
  const startEdit = (guest) => {
    setEditingId(guest.id)
    setEditForm({ nombre: guest.nombre || '', apellido: guest.apellido || '', dni: guest.dni || '' })
  }

  // Save edit — persist to backend
  const saveEdit = async (guestId) => {
    setBusy(true)
    try {
      await api.patch(`/rrpp/editar-invitado/${guestId}/`, editForm)
    } catch { /* demo mode — still update locally */ }
    setGuests((prev) => prev.map((g) => g.id === guestId ? { ...g, ...editForm } : g))
    setEditingId(null)
    setBusy(false)
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-white dark:bg-void">
        <div className="mx-auto size-10 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white dark:bg-void">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-void/95">
        <div className="container-page flex min-h-16 items-center gap-4 py-3">
          <Link to="/rrpp" className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-gray-500 hover:text-strobe dark:text-muted">
            <Icon name="back" size={16} /> Volver al panel
          </Link>
          <div className="ml-auto text-right">
            <p className="font-display text-lg uppercase">{evento?.nombre || evento?.nombre_evento || 'Evento'}</p>
            <p className="font-mono text-[9px] uppercase text-gray-500 dark:text-muted">
              {listaGuests.length} en lista · {pendingGuests.length} pendientes
            </p>
          </div>
        </div>
      </header>

      {/* Content — split layout */}
      <div className="container-page py-6">
        <div className="grid gap-6 lg:grid-cols-2">

          {/* LEFT: MI LISTA */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="display-title text-2xl">MI LISTA</h2>
              <button onClick={() => setAddOpen(!addOpen)} className="btn-primary text-[10px]">
                <Icon name="plus" size={14} /> Agregar
              </button>
            </div>

            {/* Add manual form */}
            {addOpen && (
              <form onSubmit={handleAdd} className="mb-4 border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-floor">
                <div className="grid gap-2 sm:grid-cols-3">
                  <input className="field text-xs" placeholder="Nombre" value={addForm.nombre} onChange={(e) => setAddForm((p) => ({ ...p, nombre: e.target.value }))} required />
                  <input className="field text-xs" placeholder="Apellido" value={addForm.apellido} onChange={(e) => setAddForm((p) => ({ ...p, apellido: e.target.value }))} required />
                  <input className="field text-xs" placeholder="DNI" inputMode="numeric" value={addForm.dni} onChange={(e) => setAddForm((p) => ({ ...p, dni: e.target.value.replace(/\D/g, '').slice(0, 8) }))} required />
                </div>
                <div className="mt-3 flex gap-2">
                  <button disabled={busy} className="btn-primary text-[10px]">Confirmar</button>
                  <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary text-[10px]">Cancelar</button>
                </div>
              </form>
            )}

            {/* Guest list */}
            {listaGuests.length === 0 ? (
              <div className="panel p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-muted">La lista está vacía. Agregá invitados o aprobá solicitudes.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 dark:divide-white/5 dark:border-white/10">
                {listaGuests.map((guest) => (
                  <div key={guest.id} className="flex items-center gap-3 bg-white p-3 dark:bg-floor">
                    {editingId === guest.id ? (
                      /* Inline edit */
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <input className="field min-h-8 w-24 text-xs" value={editForm.nombre} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} />
                        <input className="field min-h-8 w-24 text-xs" value={editForm.apellido} onChange={(e) => setEditForm((p) => ({ ...p, apellido: e.target.value }))} />
                        <input className="field min-h-8 w-20 text-xs" value={editForm.dni} onChange={(e) => setEditForm((p) => ({ ...p, dni: e.target.value }))} />
                        <button onClick={() => saveEdit(guest.id)} className="text-xs font-bold text-strobe">Guardar</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400">Cancelar</button>
                      </div>
                    ) : (
                      /* Display */
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{guest.nombre} {guest.apellido}</p>
                          <p className="font-mono text-[9px] text-gray-500 dark:text-muted">DNI {guest.dni || '—'}</p>
                        </div>
                        <button onClick={() => startEdit(guest)} className="grid size-8 place-items-center text-gray-400 hover:text-strobe dark:text-muted" aria-label="Editar">
                          <Icon name="edit" size={14} />
                        </button>
                        <button onClick={() => handleDelete(guest.id)} disabled={busy} className="grid size-8 place-items-center text-gray-400 hover:text-door-red dark:text-muted" aria-label="Eliminar">
                          <Icon name="close" size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RIGHT: PENDIENTES */}
          <section>
            <h2 className="mb-4 display-title text-2xl">PENDIENTES</h2>

            {pendingGuests.length === 0 ? (
              <div className="panel p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-muted">No hay solicitudes pendientes.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 dark:divide-white/5 dark:border-white/10">
                {pendingGuests.map((guest) => (
                  <div key={guest.id} className="flex items-center gap-3 bg-white p-3 dark:bg-floor">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{guest.nombre} {guest.apellido}</p>
                      <p className="font-mono text-[9px] text-gray-500 dark:text-muted">DNI {guest.dni || '—'}</p>
                    </div>
                    <button onClick={() => handleApprove(guest.id)} disabled={busy} className="grid size-9 place-items-center border border-emerald-400 text-emerald-500 hover:bg-emerald-400/10" aria-label="Aprobar">
                      <Icon name="check" size={16} />
                    </button>
                    <button onClick={() => handleReject(guest.id)} disabled={busy} className="grid size-9 place-items-center border border-door-red text-door-red hover:bg-door-red/10" aria-label="Rechazar">
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

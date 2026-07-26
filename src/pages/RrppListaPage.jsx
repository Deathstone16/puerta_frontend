import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import Icon from '../components/Icons'
import { api } from '../lib/api'
import { filterDni, filterName } from '../lib/inputFilters'

const EMPTY_FORM = { nombre: '', apellido: '', dni: '' }

const TABS = [
  { id: 'todos', label: 'Todos' },
  { id: 'aprobados', label: 'Aprobados' },
  { id: 'pendientes', label: 'Pendientes' },
]

/** Un invitado está aprobado si el RRPP lo validó o si ya avanzó en el flujo de puerta. */
function isApproved(guest) {
  return Boolean(guest.aprobado_rrpp) || guest.estado !== 'pendiente'
}

function estadoBadge(guest) {
  if (guest.estado === 'ingresado_final') return { label: 'ingresó', className: 'border-strobe text-strobe' }
  if (guest.estado === 'rebotado_guardia') return { label: 'rebotado', className: 'border-door-red text-door-red' }
  if (isApproved(guest)) return { label: 'aprobado', className: 'border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-300' }
  return { label: 'pendiente', className: 'border-amber-500 text-amber-600 dark:border-amber-300 dark:text-amber-300' }
}

export default function RrppListaPage() {
  const { eventoId } = useParams()
  const [evento, setEvento] = useState(null)
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [tab, setTab] = useState('todos')
  const [search, setSearch] = useState('')
  const [formError, setFormError] = useState('')

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
      // API no disponible — se mantiene el estado vacío
    } finally {
      setLoading(false)
    }
  }, [eventoId])

  useEffect(() => { loadData() }, [loadData])

  const counts = useMemo(() => ({
    todos: guests.length,
    aprobados: guests.filter(isApproved).length,
    pendientes: guests.filter((g) => !isApproved(g)).length,
  }), [guests])

  const visibleGuests = useMemo(() => {
    const query = search.trim().toLowerCase()
    return guests.filter((guest) => {
      if (tab === 'aprobados' && !isApproved(guest)) return false
      if (tab === 'pendientes' && isApproved(guest)) return false
      if (!query) return true
      const haystack = `${guest.nombre || ''} ${guest.apellido || ''} ${guest.dni || ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [guests, tab, search])

  const handleApprove = async (guestId) => {
    setBusy(true)
    try { await api.post(`/rrpp/aprobar-invitado/${guestId}/`, {}) } catch { /* optimista */ }
    setGuests((prev) => prev.map((g) => g.id === guestId ? { ...g, aprobado_rrpp: true } : g))
    setBusy(false)
  }

  const handleReject = async (guestId) => {
    setBusy(true)
    try { await api.post(`/rrpp/rechazar-invitado/${guestId}/`, {}) } catch { /* optimista */ }
    setGuests((prev) => prev.filter((g) => g.id !== guestId))
    setBusy(false)
  }

  const confirmDelete = async () => {
    const guestId = deleteConfirmId
    setDeleteConfirmId(null)
    setBusy(true)
    try { await api.post(`/rrpp/eliminar-invitado/${guestId}/`, {}) } catch { /* optimista */ }
    setGuests((prev) => prev.filter((g) => g.id !== guestId))
    setBusy(false)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!addForm.nombre.trim() || !addForm.apellido.trim() || !/^\d{7,8}$/.test(addForm.dni)) {
      setFormError('Completá nombre, apellido y un DNI de 7 u 8 dígitos.')
      return
    }
    if (guests.some((g) => String(g.dni) === addForm.dni)) {
      setFormError('Ese DNI ya está en la lista de este evento.')
      return
    }
    setBusy(true)
    try {
      const listaLink = (evento?.links || []).find((l) => l.tipo === 'lista')
      const slug = listaLink?.slug || evento?.slug || ''
      const result = await api.post('/rrpp/anotar-invitado/', { slug_lista: slug, ...addForm })
      const newGuest = { id: result?.id ?? `manual-${Date.now()}`, ...addForm, estado: 'pendiente', aprobado_rrpp: true }
      setGuests((prev) => [newGuest, ...prev])
      setAddForm(EMPTY_FORM)
      setAddOpen(false)
    } catch (error) {
      if (error.status === 409) setFormError('Ese DNI ya está registrado en el evento.')
      else setFormError(error.message || 'No pudimos anotar al invitado.')
    }
    setBusy(false)
  }

  const startEdit = (guest) => {
    setEditingId(guest.id)
    setEditForm({ nombre: guest.nombre || '', apellido: guest.apellido || '', dni: String(guest.dni || '') })
  }

  const saveEdit = async (guestId) => {
    setBusy(true)
    try { await api.patch(`/rrpp/editar-invitado/${guestId}/`, editForm) } catch { /* optimista */ }
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
    <>
      <main className="min-h-screen bg-white dark:bg-void">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-void/95">
          <div className="container-page flex min-h-16 items-center gap-4 py-3">
            <Link to="/rrpp" className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-gray-500 hover:text-strobe dark:text-muted">
              <Icon name="back" size={16} /> Volver al panel
            </Link>
            <div className="ml-auto text-right">
              <p className="truncate font-display text-lg uppercase text-gray-900 dark:text-paper-text">{evento?.evento_nombre || evento?.nombre || 'Evento'}</p>
              <p className="font-mono text-[9px] uppercase text-gray-500 dark:text-muted">
                {counts.aprobados} en lista · {counts.pendientes} pendientes
              </p>
            </div>
          </div>
        </header>

        <div className="container-page py-6">
          {/* Toolbar: agregar + búsqueda */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="eyebrow">Gestión de lista</p>
              <h1 className="display-title mt-1 text-3xl text-gray-900 dark:text-paper-text">MI LISTA</h1>
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <label className="relative flex-1 sm:max-w-xs">
                <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="field min-h-11 w-full pl-10 text-xs"
                  placeholder="BUSCAR POR NOMBRE O DNI"
                  aria-label="Buscar invitado por nombre o DNI"
                />
              </label>
              <button onClick={() => setAddOpen((v) => !v)} className="btn-primary min-h-11 shrink-0 px-4 text-[10px]">
                <Icon name="plus" size={15} /> Agregar
              </button>
            </div>
          </div>

          {/* Alta manual */}
          {addOpen && (
            <form onSubmit={handleAdd} className="mb-4 border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-floor">
              <div className="grid gap-2 sm:grid-cols-3">
                <input className="field text-xs" maxLength={80} placeholder="Nombre" value={addForm.nombre} onChange={(e) => setAddForm((p) => ({ ...p, nombre: filterName(e.target.value) }))} required />
                <input className="field text-xs" maxLength={80} placeholder="Apellido" value={addForm.apellido} onChange={(e) => setAddForm((p) => ({ ...p, apellido: filterName(e.target.value) }))} required />
                <input className="field text-xs" inputMode="numeric" maxLength={8} placeholder="DNI" value={addForm.dni} onChange={(e) => setAddForm((p) => ({ ...p, dni: filterDni(e.target.value) }))} required />
              </div>
              {formError && <p className="mt-3 border-l-2 border-door-red bg-door-red/10 p-2 text-xs text-door-red">{formError}</p>}
              <div className="mt-3 flex gap-2">
                <button disabled={busy} className="btn-primary text-[10px]">Confirmar</button>
                <button type="button" onClick={() => { setAddOpen(false); setFormError('') }} className="btn-secondary text-[10px]">Cancelar</button>
              </div>
            </form>
          )}

          {/* Filtros por estado */}
          <div className="mb-4 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-white/10" role="tablist" aria-label="Filtrar invitados">
            {TABS.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`min-h-11 whitespace-nowrap border-b-2 px-4 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
                  tab === item.id
                    ? 'border-uv text-gray-900 dark:text-paper-text'
                    : 'border-transparent text-gray-400 hover:text-gray-700 dark:text-muted dark:hover:text-paper-text'
                }`}
              >
                {item.label} <span className="ml-1 text-gray-400 dark:text-muted">{counts[item.id]}</span>
              </button>
            ))}
          </div>

          {/* Lista full-width */}
          {visibleGuests.length === 0 ? (
            <div className="panel p-10 text-center">
              <Icon name="users" size={32} className="mx-auto text-gray-400 dark:text-muted" />
              <p className="mt-4 text-sm text-gray-500 dark:text-muted">
                {search ? 'No encontramos invitados con ese nombre o DNI.' : tab === 'pendientes' ? 'No hay solicitudes pendientes.' : 'La lista está vacía. Agregá invitados o aprobá solicitudes.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 dark:divide-white/5 dark:border-white/10">
              {visibleGuests.map((guest) => {
                const badge = estadoBadge(guest)
                const approved = isApproved(guest)
                return (
                  <div key={guest.id} className="flex flex-wrap items-center gap-3 bg-white p-3 sm:flex-nowrap dark:bg-floor">
                    {editingId === guest.id ? (
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <input className="field min-h-9 w-28 text-xs" maxLength={80} value={editForm.nombre} onChange={(e) => setEditForm((p) => ({ ...p, nombre: filterName(e.target.value) }))} />
                        <input className="field min-h-9 w-28 text-xs" maxLength={80} value={editForm.apellido} onChange={(e) => setEditForm((p) => ({ ...p, apellido: filterName(e.target.value) }))} />
                        <input className="field min-h-9 w-24 text-xs" inputMode="numeric" maxLength={8} value={editForm.dni} onChange={(e) => setEditForm((p) => ({ ...p, dni: filterDni(e.target.value) }))} />
                        <button onClick={() => saveEdit(guest.id)} disabled={busy} className="min-h-9 px-2 text-xs font-bold text-strobe">Guardar</button>
                        <button onClick={() => setEditingId(null)} className="min-h-9 px-2 text-xs text-gray-400 dark:text-muted">Cancelar</button>
                      </div>
                    ) : (
                      <>
                        <div className="grid size-10 shrink-0 place-items-center border border-gray-200 font-display text-sm text-gray-500 dark:border-white/15 dark:text-muted">
                          {(guest.nombre?.[0] || '?')}{guest.apellido?.[0] || ''}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-paper-text">{[guest.nombre, guest.apellido].filter(Boolean).join(' ') || 'Invitado'}</p>
                          <p className="font-mono text-[9px] uppercase text-gray-500 dark:text-muted">DNI {guest.dni || '—'}</p>
                        </div>
                        <span className={`shrink-0 border px-2 py-1 font-mono text-[8px] font-bold uppercase leading-none ${badge.className}`}>{badge.label}</span>
                        <div className="flex shrink-0 items-center gap-1">
                          {!approved ? (
                            <>
                              <button onClick={() => handleApprove(guest.id)} disabled={busy} title="Aprobar" className="inline-flex size-9 items-center justify-center border border-emerald-500 text-emerald-600 transition hover:bg-emerald-500/10 disabled:opacity-40 dark:border-emerald-400 dark:text-emerald-300" aria-label={`Aprobar a ${guest.nombre || 'invitado'}`}>
                                <Icon name="check" size={16} />
                              </button>
                              <button onClick={() => handleReject(guest.id)} disabled={busy} title="Rechazar" className="inline-flex size-9 items-center justify-center border border-door-red text-door-red transition hover:bg-door-red/10 disabled:opacity-40" aria-label={`Rechazar a ${guest.nombre || 'invitado'}`}>
                                <Icon name="close" size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(guest)} disabled={busy} title="Editar" className="inline-flex size-9 items-center justify-center border border-gray-200 text-gray-400 transition hover:border-strobe hover:text-strobe disabled:opacity-40 dark:border-white/15 dark:text-muted" aria-label={`Editar a ${guest.nombre || 'invitado'}`}>
                                <Icon name="edit" size={14} />
                              </button>
                              <button onClick={() => setDeleteConfirmId(guest.id)} disabled={busy} title="Eliminar" className="inline-flex size-9 items-center justify-center border border-gray-200 text-gray-400 transition hover:border-door-red hover:text-door-red disabled:opacity-40 dark:border-white/15 dark:text-muted" aria-label={`Eliminar a ${guest.nombre || 'invitado'}`}>
                                <Icon name="close" size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <ConfirmDialog
        open={Boolean(deleteConfirmId)}
        title="Eliminar invitado"
        message="¿Eliminar este invitado de la lista?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </>
  )
}

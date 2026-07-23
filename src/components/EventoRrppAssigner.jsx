import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icons'
import { api } from '../lib/api'

/**
 * EventoRrppAssigner — Autocomplete input with pills for assigning RRPP to an event.
 * Shows currently assigned RRPP as pills and allows adding/removing.
 *
 * Props:
 *   eventoId: number
 *   eventoNombre: string
 *   onClose: () => void
 */

export default function EventoRrppAssigner({ eventoId, eventoNombre, onClose }) {
  const [allRrpp, setAllRrpp] = useState([])
  const [assigned, setAssigned] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const wrapRef = useRef(null)

  // Fetch all RRPP and find which are assigned to this event
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/rrpp/')
      const list = Array.isArray(data) ? data : []
      setAllRrpp(list)

      // Find RRPP assigned to this event
      const assignedToEvent = list.filter((rrpp) =>
        rrpp.asignaciones?.some((a) => a.evento_id === eventoId && a.activa)
      )
      setAssigned(assignedToEvent)
    } catch {
      setAllRrpp([])
      setAssigned([])
    } finally {
      setLoading(false)
    }
  }, [eventoId])

  useEffect(() => { loadData() }, [loadData])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Available RRPP (not already assigned)
  const suggestions = useMemo(() => {
    const assignedIds = new Set(assigned.map((r) => r.id))
    let available = allRrpp.filter((r) => !assignedIds.has(r.id))
    if (search.trim()) {
      const q = search.toLowerCase()
      available = available.filter((r) =>
        r.nombre?.toLowerCase().includes(q) || r.username?.toLowerCase().includes(q)
      )
    }
    return available.slice(0, 6)
  }, [allRrpp, assigned, search])

  const handleAssign = async (rrpp) => {
    setBusy(true)
    try {
      await api.post(`/rrpp/${rrpp.id}/asignar-evento/`, { evento_id: eventoId })
      setAssigned((prev) => [...prev, rrpp])
      setSearch('')
      setOpen(false)
    } catch {
      // silently fail
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (rrppId) => {
    // Note: backend doesn't have a dedicated unassign endpoint yet
    // For now we just update the UI - a full implementation would need DELETE /asignacion/:id/
    setAssigned((prev) => prev.filter((r) => r.id !== rrppId))
  }

  if (loading) {
    return (
      <div className="border-t border-gray-200 bg-gray-100 p-4 dark:border-white/10 dark:bg-void/50">
        <div className="flex items-center gap-3">
          <div className="size-5 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" />
          <span className="font-mono text-[10px] uppercase text-gray-500 dark:text-muted">Cargando RRPP...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 bg-gray-100 p-4 dark:border-white/10 dark:bg-void/50">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
          RRPP asignados a {eventoNombre}
        </p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-muted dark:hover:text-white" aria-label="Cerrar">
          <Icon name="close" size={14} />
        </button>
      </div>

      {/* Pills of assigned RRPP */}
      <div className="flex flex-wrap gap-2 mb-3">
        {assigned.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-muted">Ningún RRPP asignado aún.</p>
        )}
        {assigned.map((rrpp) => (
          <span
            key={rrpp.id}
            className="inline-flex items-center gap-1.5 border border-strobe/50 bg-strobe/10 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase text-strobe"
          >
            {rrpp.nombre || rrpp.username}
            <button
              type="button"
              onClick={() => handleRemove(rrpp.id)}
              className="ml-0.5 text-strobe/60 hover:text-strobe"
              aria-label={`Quitar ${rrpp.nombre}`}
            >
              <Icon name="close" size={10} />
            </button>
          </span>
        ))}
      </div>

      {/* Autocomplete input */}
      <div ref={wrapRef} className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar RRPP para agregar..."
          className="field min-h-10 w-full max-w-xs font-mono text-xs"
          autoComplete="off"
          disabled={busy}
        />
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-72 border border-gray-200 bg-white shadow-lg dark:border-white/15 dark:bg-void">
            {suggestions.length > 0 ? (
              suggestions.map((rrpp) => (
                <button
                  key={rrpp.id}
                  type="button"
                  disabled={busy}
                  onClick={() => handleAssign(rrpp)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-white/5"
                >
                  <div className="grid size-7 shrink-0 place-items-center border border-strobe/40 font-mono text-[9px] font-bold text-strobe">
                    {(rrpp.nombre || rrpp.username || '?')[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-gray-900 dark:text-paper-text">{rrpp.nombre}</p>
                    <p className="font-mono text-[9px] text-gray-400 dark:text-muted">@{rrpp.username}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="px-3 py-3 font-mono text-[10px] text-gray-400 dark:text-muted">
                {search.trim() ? 'Sin coincidencias' : 'Todos los RRPP ya están asignados'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

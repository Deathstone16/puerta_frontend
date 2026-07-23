import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icons'
import { formatMoney } from '../lib/format'
import { api } from '../lib/api'

/**
 * EventoRrppAssigner — Autocomplete input with pills for assigning RRPP to an event.
 * When selecting a RRPP, shows a mini-form to define commission before confirming.
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
  const [pendingRrpp, setPendingRrpp] = useState(null)
  const [comisionForm, setComisionForm] = useState({ tipo: 'fijo', valor: '' })
  const [successMsg, setSuccessMsg] = useState('')
  const wrapRef = useRef(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/rrpp/')
      const list = Array.isArray(data) ? data : []
      setAllRrpp(list)
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

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Clear success message after 3s
  useEffect(() => {
    if (!successMsg) return
    const timer = setTimeout(() => setSuccessMsg(''), 3000)
    return () => clearTimeout(timer)
  }, [successMsg])

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

  const selectRrpp = (rrpp) => {
    setPendingRrpp(rrpp)
    setComisionForm({ tipo: 'fijo', valor: '' })
    setSearch('')
    setOpen(false)
  }

  const cancelPending = () => {
    setPendingRrpp(null)
    setComisionForm({ tipo: 'fijo', valor: '' })
  }

  const confirmAssign = async () => {
    if (!pendingRrpp || !comisionForm.valor) return
    setBusy(true)
    try {
      const result = await api.post(`/rrpp/${pendingRrpp.id}/asignar-evento/`, {
        evento_id: eventoId,
        tipo_comision: comisionForm.tipo,
        valor_comision: Number(comisionForm.valor),
      })
      setAssigned((prev) => [...prev, { ...pendingRrpp, _comision: { tipo: comisionForm.tipo, valor: comisionForm.valor } }])
      setSuccessMsg(result.ya_asignado
        ? `${pendingRrpp.nombre} ya estaba asignado a ${eventoNombre}`
        : `${result.rrpp_nombre || pendingRrpp.nombre} asignado con éxito a ${eventoNombre}`)
      setPendingRrpp(null)
      setComisionForm({ tipo: 'fijo', valor: '' })
      loadData()
    } catch (error) {
      const detail = error.data?.detail || error.data?.error || error.message || 'No se pudo asignar'
      setSuccessMsg('')
      setPendingRrpp(null)
      setComisionForm({ tipo: 'fijo', valor: '' })
      // Show error briefly in a simple alert — could improve later
      window.alert(detail)
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = (rrppId) => {
    setAssigned((prev) => prev.filter((r) => r.id !== rrppId))
  }

  // Get commission info for an assigned RRPP
  const getComision = (rrpp) => {
    const asig = rrpp.asignaciones?.find((a) => a.evento_id === eventoId && a.activa)
    if (asig?.tipo_comision && asig?.valor_comision != null) {
      return { tipo: asig.tipo_comision, valor: asig.valor_comision }
    }
    if (rrpp._comision) return rrpp._comision
    return null
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
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
          RRPP asignados a {eventoNombre}
        </p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-muted dark:hover:text-white" aria-label="Cerrar">
          <Icon name="close" size={14} />
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="mb-3 flex items-center gap-2 border border-emerald-400/50 bg-emerald-400/10 p-3">
          <Icon name="check" size={16} className="text-emerald-400" />
          <p className="font-mono text-[10px] font-bold uppercase text-emerald-300">{successMsg}</p>
        </div>
      )}

      {/* Pills of assigned RRPP */}
      <div className="mb-3 flex flex-wrap gap-2">
        {assigned.length === 0 && !pendingRrpp && (
          <p className="text-xs text-gray-400 dark:text-muted">Ningún RRPP asignado aún.</p>
        )}
        {assigned.map((rrpp) => {
          const comision = getComision(rrpp)
          return (
            <span
              key={rrpp.id}
              className="inline-flex items-center gap-1.5 border border-strobe/50 bg-strobe/10 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase text-strobe"
            >
              {rrpp.nombre || rrpp.username}
              {comision && (
                <span className="ml-1 text-[9px] font-normal normal-case text-gray-400 dark:text-muted">
                  ({comision.tipo === 'fijo' ? formatMoney(comision.valor) : `${comision.valor}%`})
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(rrpp.id)}
                className="ml-0.5 text-strobe/60 hover:text-strobe"
                aria-label={`Quitar ${rrpp.nombre}`}
              >
                <Icon name="close" size={10} />
              </button>
            </span>
          )
        })}
      </div>

      {/* Pending RRPP: commission mini-form */}
      {pendingRrpp && (
        <div className="mb-3 border border-uv/30 bg-uv/5 p-3">
          <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
            Comisión para <span className="text-strobe">{pendingRrpp.nombre}</span> <span className="text-door-red">*</span>
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <select
              className="field min-h-9 w-32 text-[10px]"
              value={comisionForm.tipo}
              onChange={(e) => setComisionForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              <option value="fijo">$ Fijo /ingresado</option>
              <option value="porcentaje">% del recaudado</option>
            </select>
            <input
              type="number"
              min="0"
              className="field min-h-9 w-24 text-xs"
              value={comisionForm.valor}
              onChange={(e) => setComisionForm((f) => ({ ...f, valor: e.target.value }))}
              placeholder={comisionForm.tipo === 'fijo' ? '1500' : '10'}
            />
            <button
              disabled={busy || !comisionForm.valor}
              onClick={confirmAssign}
              className="min-h-9 border border-strobe bg-strobe/10 px-3 font-mono text-[9px] font-bold uppercase text-strobe transition hover:bg-strobe/20 disabled:opacity-40"
            >
              {busy ? 'Asignando...' : 'Confirmar'}
            </button>
            <button
              onClick={cancelPending}
              className="min-h-9 border border-white/15 px-3 font-mono text-[9px] font-bold uppercase text-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Autocomplete input (hidden while pending) */}
      {!pendingRrpp && (
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
                    onClick={() => selectRrpp(rrpp)}
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
      )}
    </div>
  )
}

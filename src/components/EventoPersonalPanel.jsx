import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icons'
import { formatMoney } from '../lib/format'
import { api } from '../lib/api'

/**
 * EventoPersonalPanel — Unified panel showing all personnel assigned to an event.
 * Shows 3 sections: RRPP (with commission), Guardias, Cajeras.
 * Each section has pills + autocomplete to add more.
 *
 * Props:
 *   eventoId: number
 *   eventoNombre: string
 *   onClose: () => void
 */

function PillSection({ title, items, color, onRemove, onAdd, addPlaceholder, children }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const suggestions = useMemo(() => {
    if (!onAdd) return []
    let available = onAdd.available || []
    if (search.trim()) {
      const q = search.toLowerCase()
      available = available.filter((p) => p.nombre?.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q))
    }
    return available.slice(0, 5)
  }, [onAdd, search])

  return (
    <div className="mb-3">
      <p className="mb-1.5 font-mono text-[8px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">{title}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.length === 0 && <span className="text-[10px] text-gray-400 dark:text-muted">Ninguno asignado</span>}
        {items.map((item) => (
          <span key={item.id} className={`inline-flex items-center gap-1 border px-2 py-1 font-mono text-[9px] font-bold uppercase ${color}`}>
            {item.nombre || item.username}
            {item.comisionLabel && <span className="ml-1 text-[8px] font-normal normal-case text-gray-400 dark:text-muted">({item.comisionLabel})</span>}
            {onRemove && <button type="button" onClick={() => onRemove(item.id)} className="ml-0.5 opacity-60 hover:opacity-100"><Icon name="close" size={9} /></button>}
          </span>
        ))}
      </div>
      {children}
      {onAdd && (
        <div ref={wrapRef} className="relative">
          <input
            type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={addPlaceholder}
            className="field min-h-8 w-full max-w-xs text-[10px]"
            autoComplete="off"
          />
          {open && (
            <div className="absolute left-0 top-full z-50 mt-1 w-60 border border-gray-200 bg-white shadow-lg dark:border-white/15 dark:bg-void">
              {suggestions.length > 0 ? suggestions.map((p) => (
                <button key={p.id} type="button" onClick={() => { onAdd.onSelect(p); setSearch(''); setOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-gray-50 dark:hover:bg-white/5">
                  <span className="font-semibold">{p.nombre}</span>
                  <span className="text-[9px] text-gray-400">@{p.username}</span>
                </button>
              )) : (
                <p className="px-3 py-2 text-[10px] text-gray-400 dark:text-muted">{search.trim() ? 'Sin coincidencias' : 'Todos asignados'}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function EventoPersonalPanel({ eventoId, eventoNombre, onClose }) {
  const [allPersonal, setAllPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [pendingRrpp, setPendingRrpp] = useState(null)
  const [comisionForm, setComisionForm] = useState({ tipo: 'fijo', valor: '' })
  const [successMsg, setSuccessMsg] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/personal/')
      setAllPersonal(Array.isArray(data) ? data : [])
    } catch { setAllPersonal([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { if (successMsg) { const t = setTimeout(() => setSuccessMsg(''), 3000); return () => clearTimeout(t) } }, [successMsg])

  // Split by role and assigned status
  const assignedRrpp = useMemo(() => allPersonal.filter((p) => p.rol === 'rrpp' && p.eventos?.some((e) => e.id === eventoId)).map((p) => {
    const ev = p.eventos.find((e) => e.id === eventoId)
    return { ...p, comisionLabel: ev?.tipo_comision === 'fijo' ? formatMoney(ev.valor_comision) + '/ing' : (ev?.valor_comision || 0) + '%' }
  }), [allPersonal, eventoId])

  const assignedGuardias = useMemo(() => allPersonal.filter((p) => p.rol === 'guardia' && p.eventos?.some((e) => e.id === eventoId)), [allPersonal, eventoId])
  const assignedCajeras = useMemo(() => allPersonal.filter((p) => p.rol === 'cajera' && p.eventos?.some((e) => e.id === eventoId)), [allPersonal, eventoId])

  const availableRrpp = useMemo(() => allPersonal.filter((p) => p.rol === 'rrpp' && !p.eventos?.some((e) => e.id === eventoId)), [allPersonal, eventoId])
  const availableGuardias = useMemo(() => allPersonal.filter((p) => p.rol === 'guardia' && !p.eventos?.some((e) => e.id === eventoId)), [allPersonal, eventoId])
  const availableCajeras = useMemo(() => allPersonal.filter((p) => p.rol === 'cajera' && !p.eventos?.some((e) => e.id === eventoId)), [allPersonal, eventoId])

  const assignDirect = async (person) => {
    setBusy(true)
    try {
      await api.post(`/personal/${person.id}/asignar-evento/`, { evento_id: eventoId })
      setSuccessMsg(`${person.nombre} asignado a ${eventoNombre}`)
      loadData()
    } catch { /* */ }
    finally { setBusy(false) }
  }

  const selectRrpp = (person) => { setPendingRrpp(person); setComisionForm({ tipo: 'fijo', valor: '' }) }
  const cancelPending = () => { setPendingRrpp(null) }
  const confirmRrpp = async () => {
    if (!pendingRrpp || !comisionForm.valor) return
    setBusy(true)
    try {
      await api.post(`/personal/${pendingRrpp.id}/asignar-evento/`, {
        evento_id: eventoId, tipo_comision: comisionForm.tipo, valor_comision: Number(comisionForm.valor),
      })
      setSuccessMsg(`${pendingRrpp.nombre} asignado a ${eventoNombre}`)
      setPendingRrpp(null)
      loadData()
    } catch { /* */ }
    finally { setBusy(false) }
  }

  if (loading) return <div className="flex items-center gap-3 py-3"><div className="size-4 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" /><span className="font-mono text-[9px] text-muted">Cargando...</span></div>

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Personal de {eventoNombre}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-muted dark:hover:text-white"><Icon name="close" size={14} /></button>
      </div>

      {successMsg && <div className="mb-3 flex items-center gap-2 border border-emerald-400/50 bg-emerald-400/10 p-2"><Icon name="check" size={14} className="text-emerald-400" /><p className="font-mono text-[9px] font-bold uppercase text-emerald-300">{successMsg}</p></div>}

      {/* RRPP Section */}
      <PillSection title="RRPP" items={assignedRrpp} color="border-strobe/50 bg-strobe/10 text-strobe"
        onAdd={!pendingRrpp ? { available: availableRrpp, onSelect: selectRrpp } : null}
        addPlaceholder="Agregar RRPP..."
      >
        {pendingRrpp && (
          <div className="mb-2 border border-uv/30 bg-uv/5 p-2">
            <p className="mb-1 font-mono text-[8px] font-bold uppercase text-muted">Comisión para <span className="text-strobe">{pendingRrpp.nombre}</span> *</p>
            <div className="flex flex-wrap items-end gap-2">
              <select className="field min-h-8 w-28 text-[10px]" value={comisionForm.tipo} onChange={(e) => setComisionForm((f) => ({ ...f, tipo: e.target.value }))}>
                <option value="fijo">$ Fijo /ing</option>
                <option value="porcentaje">% recaudado</option>
              </select>
              <input type="number" min="0" className="field min-h-8 w-20 text-[10px]" value={comisionForm.valor} onChange={(e) => setComisionForm((f) => ({ ...f, valor: e.target.value }))} placeholder={comisionForm.tipo === 'fijo' ? '1500' : '10'} />
              <button disabled={busy || !comisionForm.valor} onClick={confirmRrpp} className="min-h-8 border border-strobe px-2 font-mono text-[8px] font-bold uppercase text-strobe hover:bg-strobe/10 disabled:opacity-40">OK</button>
              <button onClick={cancelPending} className="min-h-8 border border-white/15 px-2 font-mono text-[8px] font-bold uppercase text-muted">X</button>
            </div>
          </div>
        )}
      </PillSection>

      {/* Guardias Section */}
      <PillSection title="Guardias" items={assignedGuardias} color="border-cyan-400/50 bg-cyan-400/10 text-cyan-400"
        onAdd={{ available: availableGuardias, onSelect: assignDirect }}
        addPlaceholder="Agregar guardia..."
      />

      {/* Cajeras Section */}
      <PillSection title="Cajeras" items={assignedCajeras} color="border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
        onAdd={{ available: availableCajeras, onSelect: assignDirect }}
        addPlaceholder="Agregar cajera..."
      />
    </div>
  )
}

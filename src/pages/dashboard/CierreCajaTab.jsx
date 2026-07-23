import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../../components/Icons'
import { formatMoney } from '../../lib/format'
import { api } from '../../lib/api'

/**
 * CierreCajaTab — Cierre de caja: recaudación por método, distribución, desglose por noche.
 *
 * Props:
 *   eventos: Evento[] — list of owner's events
 */

function BigCard({ icon, label, sublabel, value, color = 'text-strobe' }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 text-gray-500 dark:text-muted">
        <Icon name={icon} size={16} />
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em]">{label}</p>
          <p className="font-mono text-[8px] uppercase tracking-wider">{sublabel}</p>
        </div>
      </div>
      <p className={`mt-4 font-display text-3xl sm:text-4xl ${color}`}>{value}</p>
    </div>
  )
}

function DistributionBar({ label, percent, color }) {
  return (
    <div className="flex items-center gap-3">
      <p className="w-28 shrink-0 font-mono text-[10px] uppercase text-gray-500 dark:text-muted">{label}</p>
      <div className="h-3 flex-1 bg-gray-100 dark:bg-white/5">
        <div className={`h-full transition-[width] duration-500 ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="w-10 text-right font-mono text-[10px] font-bold text-strobe">{percent}%</p>
    </div>
  )
}

export default function CierreCajaTab({ eventos = [] }) {
  const [selectedEventId, setSelectedEventId] = useState('todos')
  const [search, setSearch] = useState('')
  const [recaudacionPorEvento, setRecaudacionPorEvento] = useState([])
  const [loading, setLoading] = useState(false)

  const filteredEventos = useMemo(() => {
    if (!search.trim()) return eventos
    const q = search.toLowerCase()
    return eventos.filter((ev) => ev.nombre?.toLowerCase().includes(q))
  }, [eventos, search])

  const eventosToFetch = useMemo(() => {
    if (selectedEventId === 'todos') return filteredEventos
    const ev = filteredEventos.find((e) => String(e.id) === String(selectedEventId))
    return ev ? [ev] : []
  }, [selectedEventId, filteredEventos])

  const fetchRecaudacion = useCallback(async (eventoId) => {
    try {
      return await api.get(`/dashboard/recaudacion/${eventoId}/`)
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (eventosToFetch.length === 0) {
      setRecaudacionPorEvento([])
      return
    }
    let active = true
    setLoading(true)
    Promise.all(
      eventosToFetch.map((ev) => fetchRecaudacion(ev.id).then((data) => ({ evento: ev, data })))
    ).then((results) => {
      if (!active) return
      setRecaudacionPorEvento(results.filter((r) => r.data))
      setLoading(false)
    })
    return () => { active = false }
  }, [eventosToFetch, fetchRecaudacion])

  // Aggregated totals
  const totals = useMemo(() => {
    const t = recaudacionPorEvento.reduce((acc, { data }) => ({
      web_monto: acc.web_monto + (data.web?.monto_bruto || 0),
      web_cantidad: acc.web_cantidad + (data.web?.cantidad || 0),
      efectivo_monto: acc.efectivo_monto + (data.efectivo?.monto || 0),
      efectivo_cantidad: acc.efectivo_cantidad + (data.efectivo?.cantidad || 0),
      transferencia_monto: acc.transferencia_monto + (data.transferencia?.monto || 0),
      transferencia_cantidad: acc.transferencia_cantidad + (data.transferencia?.cantidad || 0),
      total: acc.total + (data.total_recaudado || 0),
    }), { web_monto: 0, web_cantidad: 0, efectivo_monto: 0, efectivo_cantidad: 0, transferencia_monto: 0, transferencia_cantidad: 0, total: 0 })

    const entradas = t.web_cantidad + t.efectivo_cantidad + t.transferencia_cantidad
    const pctWeb = t.total > 0 ? Math.round((t.web_monto / t.total) * 100) : 0
    const pctEfectivo = t.total > 0 ? Math.round((t.efectivo_monto / t.total) * 100) : 0
    const pctTransferencia = t.total > 0 ? Math.round((t.transferencia_monto / t.total) * 100) : 0

    return { ...t, entradas, pctWeb, pctEfectivo, pctTransferencia }
  }, [recaudacionPorEvento])

  // Format date short
  const fmtDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: '2-digit', month: 'short' }).format(d)
  }

  return (
    <div data-testid="cierre-caja-tab">
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar fecha, noche"
          className="field min-h-10 w-48 font-mono text-xs"
        />
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="field min-h-10 min-w-[180px] font-mono text-xs"
        >
          <option value="todos">Todas las noches</option>
          {filteredEventos.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.nombre}</option>
          ))}
        </select>
        {loading && <span className="size-4 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" />}
      </div>

      {recaudacionPorEvento.length === 0 ? (
        <section className="panel p-10 text-center">
          <p className="font-display text-lg text-gray-400 dark:text-muted">Sin datos de caja</p>
          <p className="mt-2 text-sm text-gray-400 dark:text-muted/70">Los datos aparecerán cuando haya ventas registradas.</p>
        </section>
      ) : (
        <>
          {/* Big cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <BigCard icon="ticket" label="Recaudación Web" sublabel="Mercado Pago" value={formatMoney(totals.web_monto)} />
            <BigCard icon="cash" label="Caja Puerta" sublabel="Efectivo" value={formatMoney(totals.efectivo_monto)} color="text-cyan-300" />
            <BigCard icon="share" label="Caja Puerta" sublabel="Transferencias" value={formatMoney(totals.transferencia_monto)} color="text-cyan-300" />
          </div>

          {/* Total + entradas */}
          <div className="mt-3 panel p-5 flex items-end justify-between">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-gray-500 dark:text-muted">Total</p>
              <p className="mt-2 font-display text-4xl text-strobe">{formatMoney(totals.total)}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-gray-500 dark:text-muted">Entradas</p>
              <p className="mt-2 font-display text-4xl">{totals.entradas}</p>
            </div>
          </div>

          {/* Distribution */}
          <section className="mt-5 panel p-5">
            <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Distribución</p>
            <div className="space-y-3">
              <DistributionBar label="Web / MP" percent={totals.pctWeb} color="bg-uv" />
              <DistributionBar label="Efectivo" percent={totals.pctEfectivo} color="bg-cyan-400" />
              <DistributionBar label="Transferencia" percent={totals.pctTransferencia} color="bg-cyan-300" />
            </div>
          </section>

          {/* Desglose por noche */}
          <section className="mt-5 panel p-5">
            <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Desglose por noche</p>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {recaudacionPorEvento.map(({ evento, data }) => {
                const webMonto = data.web?.monto_bruto || 0
                const puertaMonto = (data.efectivo?.monto || 0) + (data.transferencia?.monto || 0)
                const nocheTotal = data.total_recaudado || 0
                return (
                  <div key={evento.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{evento.nombre}</p>
                      <p className="font-mono text-[9px] text-gray-500 dark:text-muted">{fmtDate(evento.fecha)}</p>
                    </div>
                    <div className="flex items-center gap-6 font-mono text-xs">
                      <div className="text-right">
                        <p className="text-[8px] uppercase text-gray-500 dark:text-muted">Web</p>
                        <p className="font-bold text-strobe">{formatMoney(webMonto)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] uppercase text-gray-500 dark:text-muted">Puerta</p>
                        <p className="font-bold text-cyan-300">{formatMoney(puertaMonto)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] uppercase text-gray-500 dark:text-muted">Total</p>
                        <p className="font-bold">{formatMoney(nocheTotal)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

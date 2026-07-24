import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatMoney } from '../../lib/format'
import { api } from '../../lib/api'

/**
 * CierreNocheTab — Per-event closing: revenue summary, RRPP effectiveness, rebotados.
 *
 * Props:
 *   eventos: Evento[] — list of owner's events
 */

function SummaryCard({ label, value, color = '' }) {
  return (
    <div className="panel p-4">
      <p className="font-mono text-[8px] font-bold uppercase tracking-[.14em] text-gray-500 dark:text-muted">{label}</p>
      <p className={`mt-2 font-display text-2xl sm:text-3xl ${color}`}>{value}</p>
    </div>
  )
}

export default function CierreNocheTab({ eventos = [] }) {
  const [selectedEventId, setSelectedEventId] = useState(eventos[0]?.id || '')
  const [recaudacion, setRecaudacion] = useState(null)
  const [ranking, setRanking] = useState([])
  const [aforo, setAforo] = useState(null)
  const [loading, setLoading] = useState(false)

  // Update selected when eventos change
  useEffect(() => {
    if (eventos.length > 0 && !eventos.find((e) => String(e.id) === String(selectedEventId))) {
      setSelectedEventId(eventos[0].id)
    }
  }, [eventos, selectedEventId])

  const loadData = useCallback(async (eventoId) => {
    if (!eventoId) return
    setLoading(true)
    try {
      const [rec, rank, af] = await Promise.all([
        api.get(`/dashboard/recaudacion/${eventoId}/`).catch(() => null),
        api.get(`/dashboard/ranking-rrpp/${eventoId}/`).catch(() => []),
        api.get(`/dashboard/aforo/${eventoId}/`).catch(() => null),
      ])
      setRecaudacion(rec)
      setRanking(Array.isArray(rank) ? rank : [])
      setAforo(af)
    } catch {
      setRecaudacion(null)
      setRanking([])
      setAforo(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedEventId) loadData(selectedEventId)
  }, [selectedEventId, loadData])

  const selectedEvento = useMemo(
    () => eventos.find((e) => String(e.id) === String(selectedEventId)),
    [eventos, selectedEventId],
  )

  // Totals from ranking
  const rrppTotals = useMemo(() => {
    const t = ranking.reduce((acc, r) => ({
      anotados: acc.anotados + (r.anotados || 0),
      ingresados: acc.ingresados + (r.ingresados || 0),
      rebotados: acc.rebotados + (r.rebotados || 0),
    }), { anotados: 0, ingresados: 0, rebotados: 0 })
    t.efectividad = t.anotados > 0 ? Math.round((t.ingresados / t.anotados) * 100) : 0
    return t
  }, [ranking])

  const webMonto = recaudacion?.web?.monto_bruto || 0
  const efectivoMonto = recaudacion?.efectivo?.monto || 0
  const transferenciaMonto = recaudacion?.transferencia?.monto || 0

  const fmtDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: '2-digit', month: 'short' }).format(d)
  }

  if (eventos.length === 0) {
    return (
      <div className="panel p-10 text-center">
        <p className="font-display text-lg text-gray-400 dark:text-muted">Sin eventos</p>
        <p className="mt-2 text-sm text-gray-400 dark:text-muted/70">Creá un evento para ver el cierre de noche.</p>
      </div>
    )
  }

  return (
    <div data-testid="cierre-noche-tab">
      {/* Event selector */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="field min-h-10 min-w-[220px] font-mono text-xs"
        >
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.nombre} — {fmtDate(ev.fecha)}</option>
          ))}
        </select>
        {loading && <span className="size-4 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" />}
      </div>

      {/* Event header */}
      {selectedEvento && (
        <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
          {selectedEvento.nombre} — {fmtDate(selectedEvento.fecha)} · Rendimiento de RRPP
        </p>
      )}

      {/* Summary cards */}
      <section className="panel p-5 mb-5">
        <p className="mb-4 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
          Resumen final de la noche
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Web / MP" value={formatMoney(webMonto)} color="text-strobe" />
          <SummaryCard label="Efectivo" value={formatMoney(efectivoMonto)} color="text-cyan-300" />
          <SummaryCard label="Transferencias" value={formatMoney(transferenciaMonto)} color="text-cyan-300" />
          <SummaryCard label="Aforo máx." value={aforo ? `${aforo.ingresados}/${aforo.aforo_max}` : '—'} />
        </div>
      </section>

      {/* RRPP Effectiveness */}
      {ranking.length > 0 && (
        <section className="panel p-5 mb-5">
          <p className="mb-4 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
            Efectividad RRPP
          </p>
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {ranking.map((r) => (
              <div key={r.rrpp_id} className="flex items-center justify-between py-3">
                <p className="text-sm font-semibold">{r.nombre}</p>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-gray-500 dark:text-muted">{r.anotados} → {r.ingresados}</span>
                  <span className={`font-bold ${r.tasa_conversion >= 70 ? 'text-emerald-400' : r.tasa_conversion >= 40 ? 'text-amber-300' : 'text-door-red'}`}>
                    {r.tasa_conversion}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 grid gap-3 border-t border-gray-200 pt-4 sm:grid-cols-4 dark:border-white/10">
            <div>
              <p className="font-mono text-[8px] font-bold uppercase text-gray-500 dark:text-muted">Total anotados</p>
              <p className="mt-1 font-display text-xl">{rrppTotals.anotados}</p>
            </div>
            <div>
              <p className="font-mono text-[8px] font-bold uppercase text-gray-500 dark:text-muted">Total ingresados</p>
              <p className="mt-1 font-display text-xl text-strobe">{rrppTotals.ingresados}</p>
            </div>
            <div>
              <p className="font-mono text-[8px] font-bold uppercase text-gray-500 dark:text-muted">Efectividad</p>
              <p className={`mt-1 font-display text-xl ${rrppTotals.efectividad >= 70 ? 'text-emerald-400' : rrppTotals.efectividad >= 40 ? 'text-amber-300' : 'text-door-red'}`}>
                {rrppTotals.efectividad}%
              </p>
            </div>
            <div>
              <p className="font-mono text-[8px] font-bold uppercase text-gray-500 dark:text-muted">Ventas web total</p>
              <p className="mt-1 font-display text-xl">{recaudacion?.web?.cantidad || 0}</p>
            </div>
          </div>
        </section>
      )}

      {/* Rebotados */}
      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
            Rebotados por guardia
          </p>
          <p className="font-display text-2xl text-door-red">{rrppTotals.rebotados}</p>
        </div>
      </section>
    </div>
  )
}

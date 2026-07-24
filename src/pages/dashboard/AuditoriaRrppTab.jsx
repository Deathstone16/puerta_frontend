import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../../components/Icons'
import { formatMoney } from '../../lib/format'
import { api } from '../../lib/api'

/**
 * AuditoriaRrppTab — RRPP performance per event with commission to pay and paid status.
 *
 * Props:
 *   eventos: Evento[] — list of owner's events
 *   onCreateRrpp: () => void
 *   onAsignarRrpp: () => void
 */

function getConversionColor(tasa) {
  if (tasa >= 70) return 'text-emerald-400'
  if (tasa >= 40) return 'text-amber-300'
  return 'text-door-red'
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(d)
}

export default function AuditoriaRrppTab({ eventos = [], onCreateRrpp, onAsignarRrpp }) {
  const [selectedEventId, setSelectedEventId] = useState(eventos[0]?.id || '')
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [paidMap, setPaidMap] = useState({}) // { rrpp_id: true }

  // Update selected when eventos change
  useEffect(() => {
    if (eventos.length > 0 && !eventos.find((e) => String(e.id) === String(selectedEventId))) {
      setSelectedEventId(eventos[0].id)
    }
  }, [eventos, selectedEventId])

  const loadRanking = useCallback(async (eventoId) => {
    if (!eventoId) { setRanking([]); setLoading(false); return }
    setLoading(true)
    try {
      const data = await api.get(`/dashboard/ranking-rrpp/${eventoId}/`)
      setRanking(Array.isArray(data) ? data : [])
    } catch {
      setRanking([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedEventId) loadRanking(selectedEventId)
  }, [selectedEventId, loadRanking])

  // Reset paid status when event changes
  useEffect(() => { setPaidMap({}) }, [selectedEventId])

  const togglePaid = (rrppId) => {
    setPaidMap((prev) => ({ ...prev, [rrppId]: !prev[rrppId] }))
  }

  // Sort by comision_a_pagar descending
  const sorted = useMemo(() =>
    [...ranking].sort((a, b) => (b.comision_a_pagar || 0) - (a.comision_a_pagar || 0)),
    [ranking],
  )

  // Totals
  const totals = useMemo(() => {
    const t = sorted.reduce((acc, row) => ({
      anotados: acc.anotados + (row.anotados || 0),
      ingresados: acc.ingresados + (row.ingresados || 0),
      comision: acc.comision + (row.comision_a_pagar || 0),
    }), { anotados: 0, ingresados: 0, comision: 0 })
    t.efectividad = t.anotados > 0 ? Math.round((t.ingresados / t.anotados) * 100) : 0
    return t
  }, [sorted])

  const selectedEvento = eventos.find((e) => String(e.id) === String(selectedEventId))

  return (
    <div data-testid="auditoria-tab">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Rendimiento de RRPP</p>
          <h2 className="display-title mt-2 text-3xl">AUDITORÍA RRPP</h2>
        </div>
        <div className="flex gap-2">
          {onCreateRrpp && (
            <button onClick={onCreateRrpp} className="btn-secondary" data-testid="btn-alta-rrpp">
              <Icon name="plus" size={15} /> Alta RRPP
            </button>
          )}
          {onAsignarRrpp && (
            <button onClick={onAsignarRrpp} className="btn-secondary" data-testid="btn-asignar-rrpp">
              <Icon name="users" size={15} /> Asignar RRPP
            </button>
          )}
        </div>
      </div>

      {/* Event selector */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="field min-h-10 min-w-[220px] font-mono text-xs"
        >
          {eventos.length === 0 && <option value="">Sin eventos</option>}
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.nombre} — {fmtDate(ev.fecha)}</option>
          ))}
        </select>
        {loading && <span className="size-4 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" />}
      </div>

      {/* Subtitle */}
      {selectedEvento && (
        <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
          {selectedEvento.nombre} — {fmtDate(selectedEvento.fecha)} · Rendimiento de RRPP
        </p>
      )}

      {/* Content */}
      {eventos.length === 0 ? (
        <div className="panel grid min-h-48 place-items-center p-8 text-center">
          <div>
            <Icon name="calendar" size={38} className="mx-auto text-gray-400 dark:text-muted" />
            <p className="display-title mt-5 text-2xl">SIN EVENTOS</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-muted">Creá un evento y asigná RRPP para ver la auditoría.</p>
          </div>
        </div>
      ) : loading ? (
        <div className="panel grid min-h-48 place-items-center p-8">
          <div className="size-8 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="panel p-8 text-center" data-testid="empty-state">
          <Icon name="users" size={38} className="mx-auto text-gray-400 dark:text-muted" />
          <p className="display-title mt-5 text-2xl">SIN RRPP ASIGNADOS</p>
          <p className="mt-3 text-sm text-gray-500 dark:text-muted">
            Este evento no tiene RRPP asignados. Asigná uno desde la tab "Noches" o con el botón de arriba.
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="panel overflow-x-auto" data-testid="ranking-table-container">
            <table className="w-full min-w-[700px] text-left" data-testid="ranking-table">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">RRPP</th>
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Anotados</th>
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Ingresados</th>
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Efectividad</th>
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted text-right">A pagar</th>
                  <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const isPaid = paidMap[row.rrpp_id] || false
                  return (
                    <tr key={row.rrpp_id} className={`border-b border-gray-100 dark:border-white/5 ${isPaid ? 'opacity-50' : ''}`} data-testid="ranking-row">
                      <td className="p-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-paper-text">{row.nombre}</p>
                        <p className="font-mono text-[9px] text-gray-400 dark:text-muted">
                          {row.tipo_comision === 'fijo' ? `${formatMoney(row.valor_comision)}/ingresado` : `${row.valor_comision}% recaudado`}
                        </p>
                      </td>
                      <td className="p-3 font-mono text-sm text-gray-700 dark:text-paper-text">{row.anotados}</td>
                      <td className="p-3 font-mono text-sm text-strobe">{row.ingresados}</td>
                      <td className={`p-3 font-mono text-sm font-bold ${getConversionColor(row.tasa_conversion)}`}>
                        {row.tasa_conversion}%
                      </td>
                      <td className="p-3 text-right font-mono text-sm font-bold text-strobe">
                        {formatMoney(row.comision_a_pagar)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => togglePaid(row.rrpp_id)}
                          className={`min-h-8 border px-3 font-mono text-[9px] font-bold uppercase transition ${
                            isPaid
                              ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400'
                              : 'border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-400 dark:border-white/15 dark:text-muted'
                          }`}
                        >
                          {isPaid ? 'Pagado' : 'Marcar pagado'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-100 dark:border-white/15 dark:bg-floor" data-testid="totals-row">
                  <td className="p-3 font-mono text-[10px] font-bold uppercase text-gray-900 dark:text-paper-text">Total</td>
                  <td className="p-3 font-mono text-sm font-bold text-gray-900 dark:text-paper-text">{totals.anotados}</td>
                  <td className="p-3 font-mono text-sm font-bold text-strobe">{totals.ingresados}</td>
                  <td className={`p-3 font-mono text-sm font-bold ${getConversionColor(totals.efectividad)}`}>
                    {totals.efectividad}%
                  </td>
                  <td className="p-3 text-right font-mono text-sm font-bold text-strobe">{formatMoney(totals.comision)}</td>
                  <td className="p-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import Icon from '../../components/Icons'
import { formatMoney } from '../../data/mockData'
import { mockRankingRrpp } from '../../data/dashboardMockData'
import { api } from '../../lib/api'

/**
 * AuditoriaRrppTab — Ranked table of RRPP performance with color-coded effectiveness.
 *
 * Props:
 *   eventoId: number | null — active event to fetch ranking for
 *   onCreateRrpp: () => void — opens RrppFormModal
 *   onAsignarRrpp: () => void — opens AsignarRrppModal
 */

function getConversionColor(tasa) {
  if (tasa >= 70) return 'text-emerald-400'
  if (tasa >= 40) return 'text-amber-300'
  return 'text-door-red'
}

export default function AuditoriaRrppTab({ eventoId, onCreateRrpp, onAsignarRrpp }) {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventoId) { setLoading(false); return }
    let active = true
    setLoading(true)

    api.get(`/dashboard/ranking-rrpp/${eventoId}/`)
      .then((data) => { if (active) setRanking(Array.isArray(data) ? data : []) })
      .catch((error) => { if (active && error.status === 0) setRanking(mockRankingRrpp) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [eventoId])

  // Sort by recaudado_total descending
  const sorted = [...ranking].sort((a, b) => (b.recaudado_total || 0) - (a.recaudado_total || 0))

  // Totals
  const totals = sorted.reduce(
    (acc, row) => ({
      anotados: acc.anotados + (row.anotados || 0),
      ingresados: acc.ingresados + (row.ingresados || 0),
      recaudado: acc.recaudado + (row.recaudado_total || 0),
    }),
    { anotados: 0, ingresados: 0, recaudado: 0 }
  )
  const totalConversion = totals.anotados > 0 ? Math.round((totals.ingresados / totals.anotados) * 100) : 0

  return (
    <div data-testid="auditoria-tab">
      {/* Header with RRPP action buttons */}
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

      {/* Content */}
      {loading ? (
        <div className="panel grid min-h-48 place-items-center p-8">
          <div className="size-8 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="panel grid min-h-48 place-items-center p-8 text-center" data-testid="empty-state">
          <div>
            <Icon name="users" size={38} className="mx-auto text-gray-400 dark:text-muted" />
            <p className="display-title mt-5 text-2xl">SIN DATOS</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-muted">No hay datos de RRPP para este evento.</p>
          </div>
        </div>
      ) : (
        <div className="panel overflow-x-auto" data-testid="ranking-table-container">
          <table className="w-full min-w-[600px] text-left" data-testid="ranking-table">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">RRPP</th>
                <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Anotados</th>
                <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Ingresados</th>
                <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Efectividad</th>
                <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted text-right">Recaudado</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.rrpp_id} className="border-b border-gray-100 dark:border-white/5" data-testid="ranking-row">
                  <td className="p-3 text-sm font-semibold text-gray-900 dark:text-paper-text">{row.nombre}</td>
                  <td className="p-3 font-mono text-sm text-gray-700 dark:text-paper-text">{row.anotados}</td>
                  <td className="p-3 font-mono text-sm text-strobe">{row.ingresados}</td>
                  <td className={`p-3 font-mono text-sm font-bold ${getConversionColor(row.tasa_conversion)}`}>
                    {row.tasa_conversion}%
                  </td>
                  <td className="p-3 text-right font-mono text-sm text-gray-700 dark:text-paper-text">{formatMoney(row.recaudado_total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-100 dark:border-white/15 dark:bg-floor" data-testid="totals-row">
                <td className="p-3 font-mono text-[10px] font-bold uppercase text-gray-900 dark:text-paper-text">Total</td>
                <td className="p-3 font-mono text-sm font-bold text-gray-900 dark:text-paper-text">{totals.anotados}</td>
                <td className="p-3 font-mono text-sm font-bold text-strobe">{totals.ingresados}</td>
                <td className={`p-3 font-mono text-sm font-bold ${getConversionColor(totalConversion)}`}>
                  {totalConversion}%
                </td>
                <td className="p-3 text-right font-mono text-sm font-bold text-gray-900 dark:text-paper-text">{formatMoney(totals.recaudado)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

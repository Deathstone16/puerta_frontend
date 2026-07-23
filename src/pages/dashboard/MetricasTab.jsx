import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useTheme } from '../../context/ThemeContext'
import { formatMoney } from '../../lib/format'
import { api } from '../../lib/api'

function KpiCard({ label, value, accent = false }) {
  return (
    <div className="panel p-5" data-testid="kpi-card">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-gray-500 dark:text-muted">
        {label}
      </p>
      <p className={`mt-3 font-display text-3xl sm:text-4xl ${accent ? 'text-strobe' : 'text-gray-900 dark:text-paper-text'}`}>
        {value}
      </p>
    </div>
  )
}

function SearchAutocomplete({ eventos, value, onChange, onSelect }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const suggestions = useMemo(() => {
    if (!value.trim()) return []
    const q = value.toLowerCase()
    return eventos.filter((ev) => ev.nombre?.toLowerCase().includes(q)).slice(0, 6)
  }, [eventos, value])

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => value.trim() && setOpen(true)}
        placeholder="Buscar noche..."
        className="field min-h-10 w-52 font-mono text-xs"
        autoComplete="off"
      />
      {open && value.trim() && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 border border-gray-200 bg-white shadow-lg dark:border-white/15 dark:bg-void">
          {suggestions.length > 0 ? (
            suggestions.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => { onSelect(ev); setOpen(false) }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <div className="size-2 shrink-0 bg-uv" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-gray-900 dark:text-paper-text">{ev.nombre}</p>
                  <p className="font-mono text-[9px] text-gray-400 dark:text-muted">
                    {ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : ''}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <p className="px-3 py-3 font-mono text-[10px] text-gray-400 dark:text-muted">Sin coincidencias</p>
          )}
        </div>
      )}
    </div>
  )
}

const RANGOS = [
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes', label: 'Este mes' },
  { id: 'total', label: 'Total' },
]

function isThisWeek(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)
  return d >= start
}

function isThisMonth(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export default function MetricasTab({ eventos = [] }) {
  const { isDark } = useTheme()
  const [selectedEventId, setSelectedEventId] = useState('todos')
  const [rango, setRango] = useState('total')
  const [search, setSearch] = useState('')
  const [recaudacion, setRecaudacion] = useState(null)
  const [recaudacionPorEvento, setRecaudacionPorEvento] = useState([])
  const [loading, setLoading] = useState(false)

  const filteredEventos = useMemo(() => {
    let filtered = eventos
    if (rango === 'semana') filtered = filtered.filter((ev) => isThisWeek(ev.fecha))
    else if (rango === 'mes') filtered = filtered.filter((ev) => isThisMonth(ev.fecha))
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter((ev) => ev.nombre?.toLowerCase().includes(q))
    }
    return filtered
  }, [eventos, rango, search])

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
      setRecaudacion(null)
      setRecaudacionPorEvento([])
      return
    }
    let active = true
    setLoading(true)
    Promise.all(
      eventosToFetch.map((ev) => fetchRecaudacion(ev.id).then((data) => ({ evento: ev, data })))
    ).then((results) => {
      if (!active) return
      const valid = results.filter((r) => r.data)
      setRecaudacionPorEvento(valid)
      const totals = valid.reduce((acc, { data }) => ({
        total_recaudado: acc.total_recaudado + (data.total_recaudado || 0),
        web_cantidad: acc.web_cantidad + (data.web?.cantidad || 0),
        efectivo_cantidad: acc.efectivo_cantidad + (data.efectivo?.cantidad || 0),
        transferencia_cantidad: acc.transferencia_cantidad + (data.transferencia?.cantidad || 0),
      }), { total_recaudado: 0, web_cantidad: 0, efectivo_cantidad: 0, transferencia_cantidad: 0 })
      setRecaudacion({
        total_recaudado: totals.total_recaudado,
        web: { cantidad: totals.web_cantidad },
        efectivo: { cantidad: totals.efectivo_cantidad },
        transferencia: { cantidad: totals.transferencia_cantidad },
      })
      setLoading(false)
    })
    return () => { active = false }
  }, [eventosToFetch, fetchRecaudacion])

  const kpis = useMemo(() => {
    const totalRecaudado = recaudacion?.total_recaudado ?? 0
    const vendidas = recaudacion
      ? (recaudacion.web?.cantidad ?? 0) + (recaudacion.efectivo?.cantidad ?? 0) + (recaudacion.transferencia?.cantidad ?? 0)
      : 0
    const totalNoches = eventosToFetch.length
    const promedio = totalNoches > 0 ? Math.round(totalRecaudado / totalNoches) : 0
    return { totalRecaudado, vendidas, totalNoches, promedio }
  }, [recaudacion, eventosToFetch])

  const barData = useMemo(() =>
    recaudacionPorEvento.map(({ evento, data }) => ({
      nombre: evento.nombre,
      recaudacion: data.total_recaudado || 0,
    })),
    [recaudacionPorEvento],
  )

  const gridStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
  const axisStroke = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'
  const tickFill = isDark ? '#8A87A3' : '#6B7280'
  const tooltipBg = isDark ? '#141220' : '#ffffff'
  const tooltipBorder = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'
  const tooltipColor = isDark ? '#EDEBF5' : '#111827'

  const tieneHistorial = recaudacion && recaudacion.total_recaudado > 0

  const handleSearchSelect = (ev) => {
    setSearch(ev.nombre)
    setSelectedEventId(String(ev.id))
  }

  return (
    <div data-testid="metricas-tab">
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchAutocomplete
          eventos={eventos}
          value={search}
          onChange={(val) => {
            setSearch(val)
            if (!val.trim()) setSelectedEventId('todos')
          }}
          onSelect={handleSearchSelect}
        />
        <select
          value={selectedEventId}
          onChange={(e) => { setSelectedEventId(e.target.value); if (e.target.value === 'todos') setSearch('') }}
          className="field min-h-10 min-w-[180px] font-mono text-xs"
          data-testid="metricas-event-select"
        >
          <option value="todos">Todas las noches</option>
          {filteredEventos.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.nombre}</option>
          ))}
        </select>
        <div className="flex overflow-hidden border border-gray-200 dark:border-white/15">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              onClick={() => setRango(r.id)}
              className={`min-h-10 px-3 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
                rango === r.id
                  ? 'bg-uv text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-muted dark:hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {loading && <span className="size-4 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" />}
      </div>

      <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
        {RANGOS.find((r) => r.id === rango)?.label} · {kpis.totalNoches} noches
      </p>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="kpi-grid">
        <KpiCard label="Recaudación" value={formatMoney(kpis.totalRecaudado)} accent />
        <KpiCard label="Vendidas" value={String(kpis.vendidas)} />
        <KpiCard label="Noches" value={String(kpis.totalNoches)} />
        <KpiCard label="Promedio/Noche" value={formatMoney(kpis.promedio)} />
      </div>

      {!tieneHistorial ? (
        <section className="panel mt-8 p-10 text-center" data-testid="metricas-empty">
          <p className="font-display text-lg text-gray-400 dark:text-muted">
            {eventos.length === 0 ? 'Aún no hay eventos creados' : 'Aún no hay ventas registradas'}
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-muted/70">
            {eventos.length === 0 ? 'Creá tu primer evento para empezar a ver métricas.' : 'Los gráficos se mostrarán cuando haya entradas vendidas.'}
          </p>
        </section>
      ) : (
        <section className="panel mt-8 p-5">
          <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
            Recaudación por noche (miles $)
          </p>
          <div className="h-64" data-testid="bar-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="nombre" tick={{ fill: tickFill, fontSize: 10, fontFamily: 'Space Mono' }} axisLine={{ stroke: axisStroke }} />
                <YAxis tick={{ fill: tickFill, fontSize: 10, fontFamily: 'Space Mono' }} axisLine={{ stroke: axisStroke }} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}K` : String(v)} />
                <Tooltip contentStyle={{ background: tooltipBg, border: tooltipBorder, color: tooltipColor }} formatter={(value) => [formatMoney(value), 'Recaudación']} />
                <Bar dataKey="recaudacion" fill="#8B5CF6" radius={[2, 2, 0, 0]} label={{ position: 'top', fill: tickFill, fontSize: 10, formatter: (v) => v >= 1000 ? `$${Math.round(v / 1000)}K` : '' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  )
}

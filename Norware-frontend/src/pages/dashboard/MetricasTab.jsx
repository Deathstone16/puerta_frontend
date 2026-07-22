import { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatMoney } from '../../data/mockData'

/**
 * MetricasTab — KPIs + bar chart (recaudación por noche) + line chart (ventas 7 días).
 *
 * Props:
 *   eventos: Evento[] — list of owner's events
 *   recaudacion: RecaudacionData | null — revenue data for selected event
 */

function KpiCard({ label, value, accent = false }) {
  return (
    <div className="border border-white/10 bg-floor p-5" data-testid="kpi-card">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-muted">
        {label}
      </p>
      <p className={`mt-3 font-display text-3xl sm:text-4xl ${accent ? 'text-strobe' : 'text-paper-text'}`}>
        {value}
      </p>
    </div>
  )
}

function formatShortMoney(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return formatMoney(value)
}

export default function MetricasTab({ eventos = [], recaudacion }) {
  // --- Compute KPIs ---
  const kpis = useMemo(() => {
    const totalNoches = eventos.length
    const totalRecaudado = recaudacion?.total_recaudado ?? 0
    const vendidas = recaudacion
      ? (recaudacion.web?.cantidad ?? 0) + (recaudacion.efectivo?.cantidad ?? 0) + (recaudacion.transferencia?.cantidad ?? 0)
      : 0
    const promedio = totalNoches > 0 ? Math.round(totalRecaudado / totalNoches) : 0

    return { totalRecaudado, vendidas, totalNoches, promedio }
  }, [eventos, recaudacion])

  // --- Chart data: recaudación por noche ---
  const barData = useMemo(() =>
    eventos.map((ev) => ({
      nombre: ev.nombre,
      recaudacion: ev.precio_publicado * Math.floor(ev.aforo_max * 0.6), // estimated from mock
    })),
    [eventos]
  )

  // --- Chart data: ventas últimos 7 días (simulated from available data) ---
  const lineData = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const baseVentas = kpis.vendidas > 0 ? Math.round(kpis.vendidas / 7) : 12
    return days.map((day, i) => ({
      dia: day,
      ventas: Math.round(baseVentas * (0.5 + Math.sin(i * 0.9) * 0.5 + i * 0.15)),
    }))
  }, [kpis.vendidas])

  return (
    <div data-testid="metricas-tab">
      {/* --- Filters placeholder --- */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
          Esta semana · {kpis.totalNoches} noches
        </p>
      </div>

      {/* --- KPI Cards --- */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="kpi-grid">
        <KpiCard label="Recaudación" value={formatMoney(kpis.totalRecaudado)} accent />
        <KpiCard label="Vendidas" value={String(kpis.vendidas)} />
        <KpiCard label="Noches" value={String(kpis.totalNoches)} />
        <KpiCard label="Promedio/Noche" value={formatMoney(kpis.promedio)} />
      </div>

      {/* --- Bar Chart: Recaudación por noche --- */}
      <section className="mt-8 border border-white/10 bg-floor p-5">
        <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
          Recaudación por noche (miles $)
        </p>
        <div className="h-64" data-testid="bar-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="nombre"
                tick={{ fill: '#8A87A3', fontSize: 10, fontFamily: 'Space Mono' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fill: '#8A87A3', fontSize: 10, fontFamily: 'Space Mono' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(v) => `${Math.round(v / 1000)}K`}
              />
              <Tooltip
                contentStyle={{ background: '#141220', border: '1px solid rgba(255,255,255,0.1)', color: '#EDEBF5' }}
                formatter={(value) => [formatMoney(value), 'Recaudación']}
              />
              <Bar dataKey="recaudacion" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* --- Line Chart: Ventas diarias últimos 7 días --- */}
      <section className="mt-5 border border-white/10 bg-floor p-5">
        <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
          Ventas diarias (últimos 7 días)
        </p>
        <div className="h-52" data-testid="line-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="dia"
                tick={{ fill: '#8A87A3', fontSize: 10, fontFamily: 'Space Mono' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fill: '#8A87A3', fontSize: 10, fontFamily: 'Space Mono' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip
                contentStyle={{ background: '#141220', border: '1px solid rgba(255,255,255,0.1)', color: '#EDEBF5' }}
              />
              <Line
                type="monotone"
                dataKey="ventas"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#22D3EE', r: 4 }}
                activeDot={{ fill: '#22D3EE', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}

import { useEffect, useState } from 'react'
import Icon from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { formatMoney } from '../data/mockData'
import { adminMockData } from '../data/adminMockData'
import { api } from '../lib/api'

function useAdminMetrics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api.get('/admin/metricas/')
      .then((response) => { if (active) setData(response) })
      .catch(() => { if (active) setData(adminMockData) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return { data, loading }
}

export default function AdminPage() {
  const { session, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { data, loading } = useAdminMetrics()

  return (
    <div className="min-h-screen bg-white dark:bg-void dark:bg-club-grid dark:bg-[size:32px_32px]">
      <header className="border-b border-gray-200 bg-white/95 dark:border-white/10 dark:bg-void/95">
        <div className="container-page flex min-h-16 items-center gap-5">
          <span className="font-display text-lg text-gray-900 dark:text-white">ADMIN <span className="text-uv">NOR/WARE</span></span>
          <span className="hidden border-l border-gray-200 pl-5 font-mono text-[10px] uppercase tracking-[.18em] text-gray-500 dark:border-white/15 dark:text-muted sm:block">
            Métricas de plataforma
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-gray-900 dark:text-paper-text">{session?.nombre}</p>
              <p className="font-mono text-[9px] uppercase text-uv">Superadmin</p>
            </div>
            <button onClick={toggleTheme} className="grid size-10 place-items-center border border-gray-200 text-gray-500 hover:border-strobe hover:text-strobe dark:border-white/15 dark:text-muted" aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <button onClick={logout} className="grid size-10 place-items-center border border-gray-200 text-gray-500 hover:border-door-red hover:text-door-red dark:border-white/15 dark:text-muted" aria-label="Cerrar sesión" data-testid="admin-logout">
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="container-page py-8 md:py-12">
        <div className="mb-9">
          <p className="eyebrow mb-3">Panel administrativo</p>
          <h1 className="display-title text-5xl sm:text-7xl">ADMIN NORWARE</h1>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center" data-testid="admin-loading">
            <div className="text-center">
              <div className="mx-auto size-10 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" />
              <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-gray-500 dark:text-muted">Cargando métricas</p>
            </div>
          </div>
        ) : data && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="admin-kpi-grid">
              <div className="panel p-5" data-testid="kpi-card">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-gray-500 dark:text-muted">Entradas Web Total</p>
                <p className="mt-3 font-display text-3xl text-strobe sm:text-4xl">{data.totales.entradas_web_total.toLocaleString('es-AR')}</p>
              </div>
              <div className="panel p-5" data-testid="kpi-card">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-gray-500 dark:text-muted">Comisión Norware Total</p>
                <p className="mt-3 font-mono text-3xl text-strobe sm:text-4xl">{formatMoney(data.totales.comision_norware_total)}</p>
              </div>
              <div className="panel p-5" data-testid="kpi-card">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-gray-500 dark:text-muted">Eventos Activos</p>
                <p className="mt-3 font-display text-3xl sm:text-4xl">{data.totales.eventos_activos}</p>
              </div>
              <div className="panel p-5" data-testid="kpi-card">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-gray-500 dark:text-muted">Eventos Cancelados</p>
                <p className="mt-3 font-display text-3xl text-door-red sm:text-4xl">{data.totales.eventos_cancelados}</p>
              </div>
            </div>

            <section className="mt-8 panel p-5">
              <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Desglose por evento</p>
              <div className="overflow-x-auto" data-testid="admin-table-container">
                <table className="w-full min-w-[700px] text-left" data-testid="admin-events-table">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10">
                      <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Evento</th>
                      <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Boliche</th>
                      <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Fecha</th>
                      <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Estado</th>
                      <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted text-right">Entradas Web</th>
                      <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted text-right">Comisión</th>
                      <th className="p-3 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted text-right">Recaudado Web</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.por_evento.map((ev) => (
                      <tr key={ev.evento_id} className="border-b border-gray-100 dark:border-white/5" data-testid="admin-event-row">
                        <td className="p-3 text-sm font-semibold">{ev.evento_nombre}</td>
                        <td className="p-3 text-sm text-gray-500 dark:text-muted">{ev.boliche}</td>
                        <td className="p-3 font-mono text-xs text-gray-500 dark:text-muted">{ev.fecha}</td>
                        <td className="p-3">
                          <span className={`border px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${ev.estado === 'publicado' ? 'border-strobe text-strobe' : 'border-door-red text-door-red'}`} data-testid="estado-badge">
                            {ev.estado}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-sm">{ev.entradas_web}</td>
                        <td className="p-3 text-right font-mono text-sm">{formatMoney(ev.comision_norware)}</td>
                        <td className="p-3 text-right font-mono text-sm font-bold">{formatMoney(ev.recaudado_total_web)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

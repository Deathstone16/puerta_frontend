import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import PuertaLogo from '../components/PuertaLogo'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, routeForRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const session = await login(form.username, form.password)
      const requested = location.state?.from?.pathname
      navigate(requested && requested !== '/login' ? requested : routeForRole(session.rol), { replace: true })
    } catch (loginError) {
      setStatus('error')
      setError(loginError.message || 'Usuario o contraseña incorrectos.')
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel — hidden on mobile */}
      <div className="relative hidden w-1/2 overflow-hidden bg-void lg:block">
        {/* Grid background */}
        <div className="absolute inset-0 bg-club-grid bg-[size:32px_32px] opacity-40" />

        {/* Gradient orbs */}
        <div className="absolute -left-32 top-1/4 size-[500px] rounded-full bg-uv/20 blur-[150px]" />
        <div className="absolute -right-20 bottom-1/4 size-[400px] rounded-full bg-strobe/15 blur-[120px]" />

        {/* Scanlines overlay */}
        <div className="absolute inset-0 scanlines opacity-50" />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-12">
          {/* Top: Logo */}
          <div>
            <PuertaLogo size={36} />
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[.2em] text-muted">Gestión nocturna</p>
          </div>

          {/* Center: Decorative text */}
          <div>
            <p className="font-display text-[80px] leading-[.85] tracking-[-0.04em] text-white/[.03]">
              CONTROL<br />TOTAL
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-2 bg-strobe shadow-[0_0_12px_#8B5CF6]" />
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Entradas verificadas en tiempo real</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-2 bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Métricas y recaudación al instante</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-2 bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Gestión de RRPP y listas</p>
              </div>
            </div>
          </div>

          {/* Bottom: Version */}
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted/50">v1.0 · Puerta Systems</p>
        </div>

        {/* Animated vertical line */}
        <div className="absolute right-0 top-0 h-full w-px">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-uv/60 to-transparent" />
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="relative flex w-full items-center justify-center bg-white px-6 py-12 dark:bg-void lg:w-1/2">
        {/* Subtle background glow for mobile */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden lg:hidden">
          <div className="absolute left-1/2 top-1/4 size-[500px] -translate-x-1/2 rounded-full bg-uv/5 blur-[120px] dark:bg-uv/10" />
        </div>

        <form onSubmit={submit} className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-gray-400 transition hover:text-strobe dark:text-muted">
              <Icon name="back" size={14} /> Volver al inicio
            </Link>
          </div>

          {/* Desktop back link */}
          <Link
            to="/"
            className="mb-10 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-gray-400 transition hover:text-strobe dark:text-muted lg:inline-flex"
          >
            <Icon name="back" size={14} /> Volver al inicio
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="mb-5 inline-flex items-center gap-3 border border-gray-200 px-4 py-2 dark:border-white/10">
              <PuertaLogo size={20} showText={false} />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Acceso restringido</span>
            </div>
            <h1 className="display-title text-5xl text-gray-900 dark:text-paper-text sm:text-6xl">
              INICIAR<br /><span className="text-uv">SESIÓN</span>
            </h1>
            <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-muted">
              Ingresá con las credenciales asignadas a tu rol.
            </p>
          </div>

          {/* Fields */}
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
                <Icon name="users" size={12} /> Usuario
              </span>
              <input
                autoComplete="username"
                required
                className="field border-l-2 border-l-uv/50 focus:border-l-uv"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="tu_usuario"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
                <Icon name="shield" size={12} /> Contraseña
              </span>
              <input
                autoComplete="current-password"
                required
                type="password"
                className="field border-l-2 border-l-uv/50 focus:border-l-uv"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 flex items-start gap-3 border-l-2 border-l-door-red bg-door-red/5 p-4 dark:bg-door-red/10">
              <Icon name="close" size={16} className="mt-0.5 shrink-0 text-door-red" />
              <p className="text-xs leading-5 text-door-red">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            disabled={status === 'loading'}
            className="btn-primary mt-7 w-full"
          >
            {status === 'loading' ? (
              <>
                <span className="size-4 animate-spin border-2 border-white/30 border-t-white" />
                VALIDANDO...
              </>
            ) : (
              <>INGRESAR <Icon name="arrow" size={17} /></>
            )}
          </button>

          {/* Footer */}
          <div className="mt-8 border-t border-gray-100 pt-6 dark:border-white/5">
            <p className="text-center font-mono text-[9px] uppercase leading-5 tracking-wider text-gray-400 dark:text-muted">
              Sesión segura · tokens temporales<br />
              No se almacenan credenciales
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

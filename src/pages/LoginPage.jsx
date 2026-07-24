import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import PuertaLogo from '../components/PuertaLogo'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function LoginPage() {
  const { login, routeForRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const { isDark, toggleTheme } = useTheme()

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
      <div className="relative hidden w-1/2 overflow-hidden bg-gray-50 dark:bg-void lg:block">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20 dark:opacity-40"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.15) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        {/* Gradient orbs */}
        <div className="absolute -left-32 top-1/4 size-[500px] rounded-full bg-uv/10 dark:bg-uv/20 blur-[150px]" />
        <div className="absolute -right-20 bottom-1/4 size-[400px] rounded-full bg-violet-300/20 dark:bg-strobe/15 blur-[120px]" />

        {/* Scanlines overlay */}
        <div className="absolute inset-0 hidden dark:block scanlines opacity-50" />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-12">
          {/* Top: Logo */}
          <div>
            <PuertaLogo size={36} />
            <p className="mt-2 font-mono text-[9px] font-bold uppercase tracking-[.2em] text-gray-400 dark:text-muted">
              by <span className="text-uv">NORDEV</span>
            </p>
          </div>

          {/* Center: Product tagline */}
          <div>
            <p className="font-display text-[80px] leading-[.85] tracking-[-0.04em] text-gray-900/[.04] dark:text-white/[.03]">
              CONTROL<br />TOTAL
            </p>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:text-muted">
              Entradas, listas y control de acceso para tus noches.
            </p>
          </div>

          {/* Bottom: Version */}
          <p className="font-mono text-[9px] uppercase tracking-wider text-gray-300 dark:text-muted/50">v1.0 · NORDEV</p>
        </div>

        {/* Vertical accent line */}
        <div className="absolute right-0 top-0 h-full w-px">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-uv/40 dark:via-uv/60 to-transparent" />
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="relative flex w-full items-center justify-center bg-white px-6 py-12 dark:bg-void lg:w-1/2">
        {/* Subtle background glow for mobile */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden lg:hidden">
          <div className="absolute left-1/2 top-1/4 size-[500px] -translate-x-1/2 rounded-full bg-uv/5 blur-[120px] dark:bg-uv/10" />
        </div>

        <form onSubmit={submit} className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-5 inline-flex items-center gap-3 border border-gray-200 px-4 py-2 dark:border-white/10">
              <PuertaLogo size={20} showText={false} />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">Acceso restringido</span>
            </div>
            <h1 className="display-title text-5xl text-gray-900 dark:text-paper-text sm:text-6xl">
              INICIAR<br /><span className="text-uv">SESIÓN</span>
            </h1>
            <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-muted">
              Ingresá con tu usuario y contraseña para acceder al sistema.
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

          {/* Footer - minimal, human */}
          <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-wider text-gray-300 dark:text-muted/40">
            Tus datos están protegidos
          </p>
        </form>
      </div>
    </div>
  )
}

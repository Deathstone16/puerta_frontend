import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
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
    <section className="grid min-h-[calc(100vh-64px)] place-items-center px-4 py-12">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-uv/5 blur-[120px] dark:bg-uv/10" />
      </div>

      <form
        onSubmit={submit}
        className="w-full max-w-md overflow-hidden rounded-interface border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/50 dark:border-white/10 dark:bg-floor dark:shadow-none sm:p-10"
      >
        {/* Back link */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-gray-400 transition hover:text-strobe dark:text-muted"
        >
          <Icon name="back" size={14} /> Volver al inicio
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-interface bg-uv/10 text-uv">
              <Icon name="shield" size={24} />
            </div>
            <div>
              <p className="font-display text-lg uppercase leading-tight text-gray-900 dark:text-white">NOR<span className="text-uv">/</span>WARE</p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-gray-400 dark:text-muted">Panel de control</p>
            </div>
          </div>
          <h1 className="display-title text-4xl text-gray-900 dark:text-paper-text sm:text-5xl">INICIAR<br />SESIÓN</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-muted">
            Ingresá con las credenciales asignadas a tu rol.
          </p>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
              Usuario
            </span>
            <input
              autoComplete="username"
              required
              className="field rounded-interface"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="tu_usuario"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">
              Contraseña
            </span>
            <input
              autoComplete="current-password"
              required
              type="password"
              className="field rounded-interface"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </label>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-interface border border-door-red/30 bg-door-red/5 p-3 dark:border-door-red/50 dark:bg-door-red/10">
            <Icon name="close" size={16} className="mt-0.5 shrink-0 text-door-red" />
            <p className="text-xs leading-5 text-door-red">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          disabled={status === 'loading'}
          className="btn-primary mt-6 w-full rounded-interface"
        >
          {status === 'loading' ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              VALIDANDO...
            </>
          ) : (
            <>INGRESAR <Icon name="arrow" size={17} /></>
          )}
        </button>

        {/* Footer note */}
        <p className="mt-6 text-center font-mono text-[9px] uppercase leading-5 text-gray-400 dark:text-muted">
          Los tokens viven sólo durante esta sesión.<br />
          No guardamos credenciales en el navegador.
        </p>
      </form>
    </section>
  )
}

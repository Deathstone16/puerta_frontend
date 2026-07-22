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
    e.preventDefault(); setStatus('loading'); setError('')
    try {
      const session = await login(form.username, form.password)
      const requested = location.state?.from?.pathname
      navigate(requested && requested !== '/login' ? requested : routeForRole(session.rol), { replace: true })
    } catch (loginError) { setStatus('error'); setError(loginError.message || 'Usuario o contraseña incorrectos.') }
  }

  return <section className="grid min-h-[calc(100vh-64px)] place-items-center overflow-hidden px-4 py-12"><div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[500px] -translate-x-1/2 -translate-y-1/2 bg-uv/10 blur-[100px]"/><form onSubmit={submit} className="w-full max-w-md border border-white/15 bg-floor p-6 sm:p-9"><Link to="/" className="mb-8 flex w-fit items-center gap-2 font-mono text-[10px] uppercase text-muted hover:text-strobe"><Icon name="back" size={15}/> Cartelera</Link><p className="eyebrow mb-3">Acceso de equipo</p><h1 className="display-title text-5xl">ENTRAR AL<br/>CONTROL</h1><p className="mt-4 text-sm leading-6 text-muted">Ingresá con las credenciales asignadas a tu rol.</p><div className="mt-8 space-y-3"><label className="block"><span className="mb-2 block font-mono text-[10px] font-bold uppercase text-muted">Usuario</span><input autoComplete="username" required className="field" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} placeholder="TU USUARIO"/></label><label className="block"><span className="mb-2 block font-mono text-[10px] font-bold uppercase text-muted">Contraseña</span><input autoComplete="current-password" required type="password" className="field" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="••••••••"/></label></div>{error && <p className="mt-4 border-l-2 border-door-red pl-3 text-xs text-door-red">{error}</p>}<button disabled={status === 'loading'} className="btn-primary mt-6 w-full">{status === 'loading' ? 'VALIDANDO...' : 'INGRESAR'}<Icon name="arrow" size={17}/></button><p className="mt-5 text-center font-mono text-[9px] uppercase leading-5 text-muted">Los tokens viven sólo durante esta sesión.<br/>No guardamos credenciales en el navegador.</p></form></section>
}

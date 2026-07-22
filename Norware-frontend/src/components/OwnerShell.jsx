import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from './Icons'

export default function OwnerShell() {
  const { session, logout } = useAuth()
  return (
    <div className="min-h-screen bg-void bg-club-grid bg-[size:32px_32px]">
      <header className="border-b border-white/10 bg-void/95">
        <div className="container-page flex min-h-16 items-center gap-5">
          <NavLink to="/dashboard" className="font-display text-lg">NOR<span className="text-uv">/</span>WARE</NavLink>
          <span className="hidden border-l border-white/15 pl-5 font-mono text-[10px] uppercase tracking-[.18em] text-muted sm:block">Centro de control</span>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-xs font-bold">{session?.nombre}</p><p className="font-mono text-[9px] uppercase text-strobe">Dueño</p></div>
            <button onClick={logout} className="grid size-10 place-items-center border border-white/15 text-muted hover:border-door-red hover:text-door-red" aria-label="Cerrar sesión"><Icon name="logout" size={18} /></button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

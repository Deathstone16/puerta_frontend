import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Icon from './Icons'

export default function OwnerShell() {
  const { session, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="min-h-screen bg-white dark:bg-void dark:bg-club-grid dark:bg-[size:32px_32px]">
      <header className="border-b border-gray-200 bg-white/95 dark:border-white/10 dark:bg-void/95">
        <div className="container-page flex min-h-16 items-center gap-5">
          <NavLink to="/dashboard" className="font-display text-lg text-gray-900 dark:text-white">NOR<span className="text-uv">/</span>WARE</NavLink>
          <span className="hidden border-l border-gray-200 pl-5 font-mono text-[10px] uppercase tracking-[.18em] text-gray-500 dark:border-white/15 dark:text-muted sm:block">Centro de control</span>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-gray-900 dark:text-paper-text">{session?.nombre}</p>
              <p className="font-mono text-[9px] uppercase text-strobe">Dueño</p>
            </div>
            <button onClick={toggleTheme} className="grid size-10 place-items-center border border-gray-200 text-gray-500 hover:border-strobe hover:text-strobe dark:border-white/15 dark:text-muted" aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <button onClick={logout} className="grid size-10 place-items-center border border-gray-200 text-gray-500 hover:border-door-red hover:text-door-red dark:border-white/15 dark:text-muted" aria-label="Cerrar sesión"><Icon name="logout" size={18} /></button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

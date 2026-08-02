import { Link, Outlet } from 'react-router-dom'
import PuertaLogo from './PuertaLogo'
import { useTheme } from '../context/ThemeContext'

export default function PublicLayout() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen overflow-x-hidden bg-white dark:bg-void">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-void/95">
        <div className="container-page flex h-16 items-center gap-4">
          <Link to="/" aria-label="Puerta inicio">
            <PuertaLogo size={28} />
          </Link>
          {/* #15: en el navbar del cliente solo queda el toggle de tema. */}
          <button onClick={toggleTheme} className="ml-auto grid size-10 shrink-0 place-items-center border border-gray-200 text-gray-500 transition hover:border-strobe hover:text-strobe dark:border-white/15 dark:text-muted" aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>
      <main className="overflow-x-hidden"><Outlet /></main>
      <footer className="border-t border-gray-200 py-10 dark:border-white/10">
        <div className="container-page flex flex-col gap-4 text-xs text-gray-500 dark:text-muted sm:flex-row sm:items-center sm:justify-between">
          <PuertaLogo size={22} />
          <span className="font-mono">ENTRADAS Y ACCESO PARA NOCHES REALES.</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  )
}

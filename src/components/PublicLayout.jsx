import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import Icon from './Icons'
import PuertaLogo from './PuertaLogo'
import { useTheme } from '../context/ThemeContext'

export default function PublicLayout() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  const submitSearch = (event) => {
    event.preventDefault()
    navigate(`/?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white dark:bg-void">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-void/95">
        <div className="container-page flex h-16 items-center gap-4">
          <Link to="/" aria-label="Puerta inicio">
            <PuertaLogo size={28} />
          </Link>
          <form onSubmit={submitSearch} className="relative ml-auto hidden w-full max-w-sm md:block">
            <Icon name="search" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="field min-h-10 pl-10 text-xs" placeholder="BUSCAR FIESTA, CLUB, CIUDAD..." aria-label="Buscar eventos" />
          </form>
          <button onClick={toggleTheme} className="ml-auto grid size-10 shrink-0 place-items-center border border-gray-200 text-gray-500 transition hover:border-strobe hover:text-strobe md:ml-0 dark:border-white/15 dark:text-muted" aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}>
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

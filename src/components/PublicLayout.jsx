import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icons'
import { useTheme } from '../context/ThemeContext'

export default function PublicLayout() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()

  const submitSearch = (event) => {
    event.preventDefault()
    navigate(`/?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-md">
        <div className="container-page flex h-16 items-center gap-4">
          <Link to="/" className="font-display text-xl tracking-[-.08em] text-[var(--color-text)]" aria-label="Norware inicio">
            NOR<span className="text-uv">/</span>WARE
          </Link>
          <form onSubmit={submitSearch} className="relative ml-auto hidden w-full max-w-sm md:block">
            <Icon name="search" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="field min-h-10 pl-10 text-xs" placeholder="BUSCAR FIESTA, CLUB, CIUDAD..." aria-label="Buscar eventos" />
          </form>
          <Link to="/login" className="btn-secondary hidden min-h-10 px-4 lg:inline-flex">Publicá mi noche</Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="grid size-10 place-items-center border border-[var(--color-border)] text-[var(--color-text-muted)] transition hover:border-strobe hover:text-strobe"
            aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          <Link to="/login" aria-label="Iniciar sesión" className={`grid size-10 place-items-center border transition ${location.pathname === '/login' ? 'border-uv text-uv' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-strobe hover:text-strobe'}`}>
            <Icon name="user" size={19} />
          </Link>
        </div>
      </header>
      <main className="overflow-x-hidden"><Outlet /></main>
      <footer className="border-t border-[var(--color-border)] py-10">
        <div className="container-page flex flex-col gap-4 text-xs text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display tracking-tight text-[var(--color-text)]">NOR/WARE</span>
          <span className="font-mono">ENTRADAS Y ACCESO PARA NOCHES REALES.</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  )
}

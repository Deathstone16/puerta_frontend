import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icons'

export default function PublicLayout() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const submitSearch = (event) => {
    event.preventDefault()
    navigate(`/?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="min-h-screen bg-void">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-void/95 backdrop-blur-md">
        <div className="container-page flex h-16 items-center gap-4">
          <Link to="/" className="font-display text-xl tracking-[-.08em] text-white" aria-label="Norware inicio">
            NOR<span className="text-uv">/</span>WARE
          </Link>
          <form onSubmit={submitSearch} className="relative ml-auto hidden w-full max-w-sm md:block">
            <Icon name="search" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="field min-h-10 pl-10 text-xs" placeholder="BUSCAR FIESTA, CLUB, CIUDAD..." aria-label="Buscar eventos" />
          </form>
          <Link to="/login" className="btn-secondary hidden min-h-10 px-4 lg:inline-flex">Publicá mi noche</Link>
          <Link to="/login" aria-label="Iniciar sesión" className={`grid size-10 place-items-center border transition ${location.pathname === '/login' ? 'border-uv text-uv' : 'border-white/20 text-muted hover:border-strobe hover:text-strobe'}`}>
            <Icon name="user" size={19} />
          </Link>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="border-t border-white/10 py-10">
        <div className="container-page flex flex-col gap-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display tracking-tight text-paper-text">NOR/WARE</span>
          <span className="font-mono">ENTRADAS Y ACCESO PARA NOCHES REALES.</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EventCard from '../components/EventCard'
import { events as mockEvents, normalizeEvent } from '../data/mockData'
import { api } from '../lib/api'

const genres = ['Todas', 'Techno', 'House', 'EBM', 'Trance', 'Dark']

export default function HomePage() {
  const [events, setEvents] = useState(mockEvents)
  const [genre, setGenre] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('q') || '').toLowerCase()

  useEffect(() => {
    let active = true
    api.get('/eventos/')
      .then((data) => active && Array.isArray(data) && data.length && setEvents(data.map(normalizeEvent)))
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const visibleEvents = useMemo(() => events.filter((event) => {
    const matchesGenre = genre === 'Todas' || event.genero?.toLowerCase().includes(genre.toLowerCase())
    const haystack = `${event.nombre} ${event.club} ${event.ciudad} ${event.genero}`.toLowerCase()
    return matchesGenre && (!query || haystack.includes(query))
  }), [events, genre, query])

  const featured = events.slice(0, 3)

  return (
    <>
      <section className="border-b border-white/10 py-8 md:py-12">
        <div className="container-page">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="eyebrow mb-3">Cartelera nacional · 2026</p><h1 className="display-title text-5xl sm:text-7xl lg:text-8xl">ESTA<br/><span className="text-uv">SEMANA</span></h1></div>
            <p className="max-w-xs font-mono text-xs uppercase leading-6 text-muted">Noches seleccionadas. Entradas verificadas. Acceso sin vueltas.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {featured.map((event) => <EventCard key={event.id} event={event} featured />)}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-page">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="eyebrow mb-2">Explorá por sonido</p><h2 className="display-title text-4xl sm:text-5xl">TODAS LAS NOCHES</h2></div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por género">
              {genres.map((item) => <button key={item} onClick={() => setGenre(item)} className={`border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition ${genre === item ? 'border-uv bg-uv text-white' : 'border-white/15 text-muted hover:border-strobe hover:text-strobe'}`}>{item}</button>)}
            </div>
          </div>
          {query && <p className="mb-6 border-l-2 border-strobe pl-3 font-mono text-xs uppercase text-muted">Resultados para “{query}”</p>}
          {loading && <div className="mb-6 h-px w-full animate-pulse bg-gradient-to-r from-uv via-strobe to-transparent" />}
          {visibleEvents.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleEvents.map((event) => <EventCard key={event.id} event={event} />)}</div>
          ) : (
            <div className="panel py-20 text-center"><p className="display-title text-3xl">NO ENCONTRAMOS ESA NOCHE</p><p className="mt-3 text-sm text-muted">Probá con otro género, club o ciudad.</p></div>
          )}
        </div>
      </section>
    </>
  )
}

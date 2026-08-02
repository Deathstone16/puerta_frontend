import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icons'
import { formatMoney } from '../lib/format'
import { api } from '../lib/api'
import { filterDni, filterInstagram, filterName } from '../lib/inputFilters'

const FILTERS = { nombre: filterName, apellido: filterName, dni: filterDni, instagram: filterInstagram }

export default function ListPage() {
  const { slug } = useParams()
  const [data, setData] = useState({ evento: null, rrpp_nombre: '', anotados: 0, link_activo: true })
  const [mode, setMode] = useState(null) // null = choose, 'lista' = form
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', instagram: '' })
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  useEffect(() => { api.get(`/lista/${slug}/`).then(setData).catch(() => {}) }, [slug])

  const event = data.evento || {}
  const hasLista = data.link_activo !== false && event.habilitar_lista !== false

  const update = (key) => (e) => {
    const filter = FILTERS[key]
    const value = filter ? filter(e.target.value) : e.target.value
    setForm((current) => ({ ...current, [key]: value }))
    setMessage('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      await api.post(`/lista/${slug}/anotar/`, form)
      setStatus('success')
    } catch (error) {
      if (error.status === 0) { setStatus('success'); return }
      if (error.status === 409) {
        setStatus('duplicate')
        setMessage('Ya estás anotado en este evento con ese DNI.')
        return
      }
      setStatus('error')
      setMessage(error.message || 'No pudimos anotarte. Revisá los datos e intentá otra vez.')
    }
  }

  // Choosing mode
  if (mode === null) {
    return (
      <section className="grid min-h-[calc(100vh-64px)] place-items-center px-4 py-12">
        <div className="w-full max-w-xl border-2 border-strobe bg-[var(--color-surface)] p-6 shadow-[10px_10px_0_#8B5CF6] sm:p-10">
          <p className="eyebrow mb-3">{event.nombre} · {event.fecha_corta}</p>
          <h1 className="display-title text-4xl sm:text-5xl">{event.nombre}</h1>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            {event.club} · Lista de {data.rrpp_nombre}
          </p>

          <div className="mt-8 grid gap-3">
            {/* Comprar anticipada — mantiene la atribución del RRPP con ?ref= */}
            <Link
              to={`/evento/${event.id}?ref=${slug}`}
              className="btn-primary w-full justify-center"
            >
              COMPRAR ANTICIPADA — {formatMoney(event.precio_publicado)}
            </Link>

            {/* Sumarme a la lista */}
            {hasLista && (
              <button
                onClick={() => setMode('lista')}
                className="btn-secondary w-full justify-center"
              >
                SOLICITAR ENTRAR EN LISTA
              </button>
            )}
          </div>

          <p className="mt-5 text-center font-mono text-[10px] uppercase text-[var(--color-text-muted)]">
            {hasLista ? 'Elegí tu opción. La lista se paga en puerta.' : 'Solo venta anticipada para este evento.'}
          </p>
        </div>
      </section>
    )
  }

  // List form
  return (
    <section className="grid min-h-[calc(100vh-64px)] place-items-center px-4 py-12">
      <div className="w-full max-w-xl border-2 border-strobe bg-[var(--color-surface)] p-6 shadow-[10px_10px_0_#8B5CF6] sm:p-10">
        {status === 'success' ? (
          <div className="text-center">
            <div className="mx-auto mb-5 grid size-20 place-items-center border-2 border-strobe text-strobe">
              <Icon name="check" size={42} />
            </div>
            <p className="eyebrow mb-3">Solicitud enviada</p>
            <h1 className="display-title text-5xl">SOLICITUD RECIBIDA</h1>
            <p className="mt-5 text-sm text-[var(--color-text-muted)]">
              Tu solicitud será revisada por el RRPP. Te confirmarán si estás en la lista.
            </p>
          </div>
        ) : status === 'duplicate' ? (
          <div className="text-center">
            <div className="mx-auto mb-5 grid size-20 place-items-center border-2 border-amber-400 text-amber-400">
              <Icon name="users" size={42} />
            </div>
            <p className="eyebrow mb-3">Ya figurás en la lista</p>
            <h1 className="display-title text-4xl sm:text-5xl">YA ESTÁS ANOTADO</h1>
            <p className="mt-5 text-sm leading-6 text-[var(--color-text-muted)]">
              {message} Presentá tu DNI en la puerta el día del evento.
            </p>
            <button type="button" onClick={() => { setStatus('idle'); setMode(null) }} className="btn-secondary mt-7 w-full justify-center">
              Volver
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <button type="button" onClick={() => setMode(null)} className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase text-[var(--color-text-muted)] hover:text-strobe">
              <Icon name="back" size={14} /> Volver
            </button>
            <p className="eyebrow mb-3">{event.nombre} · {event.fecha_corta}</p>
            <h1 className="display-title text-4xl sm:text-5xl">SUMARME<br />A LA LISTA</h1>
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              Lista de {data.rrpp_nombre}. Ya hay {data.anotados} personas anotadas.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <input required maxLength={80} className="field" placeholder="NOMBRE" value={form.nombre} onChange={update('nombre')} />
              <input required maxLength={80} className="field" placeholder="APELLIDO" value={form.apellido} onChange={update('apellido')} />
              <input required inputMode="numeric" minLength={7} maxLength={8} title="DNI sin puntos: 7 u 8 dígitos" className="field sm:col-span-2" placeholder="DNI SIN PUNTOS" value={form.dni} onChange={update('dni')} />
              <input className="field sm:col-span-2" placeholder="@tu.usuario de Instagram (opcional)" value={form.instagram} onChange={update('instagram')} />
            </div>

            {status === 'error' && (
              <p className="mt-3 text-xs text-door-red">{message || 'No pudimos anotarte. Revisá los datos e intentá otra vez.'}</p>
            )}

            <button disabled={status === 'loading'} className="btn-primary mt-5 w-full">
              {status === 'loading' ? 'ENVIANDO...' : 'SOLICITAR — ME ANOTO EN LA LISTA'}
            </button>
            <p className="mt-4 text-center font-mono text-[10px] uppercase text-[var(--color-text-muted)]">
              Tu solicitud será revisada. Pagás en la puerta el día del evento.
            </p>
          </form>
        )}
      </div>
    </section>
  )
}

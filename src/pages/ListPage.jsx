import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icons'
import { formatMoney } from '../lib/format'
import { api } from '../lib/api'

export default function ListPage() {
  const { slug } = useParams()
  const [data, setData] = useState({ evento: null, rrpp_nombre: '', anotados: 0, link_activo: true })
  const [mode, setMode] = useState(null) // null = choose, 'lista' = form, 'comprar' = redirect
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', instagram: '' })
  const [status, setStatus] = useState('idle')

  useEffect(() => { api.get(`/lista/${slug}/`).then(setData).catch(() => {}) }, [slug])

  const event = data.evento || {}
  const hasLista = data.link_activo !== false && event.habilitar_lista !== false

  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      await api.post(`/lista/${slug}/anotar/`, form)
      setStatus('success')
    } catch (error) {
      setStatus(error.status === 0 ? 'success' : 'error')
    }
  }

  // Choosing mode
  if (mode === null) {
    return (
      <section className="grid min-h-[calc(100vh-64px)] place-items-center px-4 py-12">
        <div className="w-full max-w-xl border-2 border-strobe bg-[var(--color-surface)] p-6 shadow-[10px_10px_0_#8B5CF6] sm:p-10">
          <p className="eyebrow mb-3">{event.nombre} · {event.fechaCorta}</p>
          <h1 className="display-title text-4xl sm:text-5xl">{event.nombre}</h1>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            {event.club} · Lista de {data.rrpp_nombre}
          </p>

          <div className="mt-8 grid gap-3">
            {/* Comprar anticipada */}
            <Link
              to={`/evento/${event.slug || event.id}`}
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
        ) : (
          <form onSubmit={submit}>
            <button type="button" onClick={() => setMode(null)} className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase text-[var(--color-text-muted)] hover:text-strobe">
              <Icon name="back" size={14} /> Volver
            </button>
            <p className="eyebrow mb-3">{event.nombre} · {event.fechaCorta}</p>
            <h1 className="display-title text-4xl sm:text-5xl">SUMARME<br />A LA LISTA</h1>
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              Lista de {data.rrpp_nombre}. Ya hay {data.anotados} personas anotadas.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <input required className="field" placeholder="NOMBRE" value={form.nombre} onChange={update('nombre')} />
              <input required className="field" placeholder="APELLIDO" value={form.apellido} onChange={update('apellido')} />
              <input required inputMode="numeric" pattern="[0-9]{7,9}" className="field sm:col-span-2" placeholder="DNI SIN PUNTOS" value={form.dni} onChange={update('dni')} />
              <input className="field sm:col-span-2" placeholder="@tu.usuario de Instagram (opcional)" value={form.instagram} onChange={update('instagram')} />
            </div>

            {status === 'error' && (
              <p className="mt-3 text-xs text-door-red">No pudimos anotarte. Revisá los datos e intentá otra vez.</p>
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

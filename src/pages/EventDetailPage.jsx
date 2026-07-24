import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icons'
import Modal from '../components/Modal'
import { formatMoney } from '../lib/format'
import { api } from '../lib/api'

function ListForm({ event, onClose }) {
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', instagram: '' })
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setState('loading')
    setMessage('')
    try {
      await api.post(`/lista/${event.slug}/anotar/`, form)
      setState('success')
    } catch (error) {
      if (error.status === 0) setState('success')
      else { setState('error'); setMessage(error.message) }
    }
  }

  if (state === 'success') return (
    <div className="py-6 text-center"><div className="mx-auto mb-5 grid size-16 place-items-center border-2 border-strobe text-strobe"><Icon name="check" size={34} /></div><p className="eyebrow mb-3">Solicitud enviada</p><h2 className="display-title text-4xl">SOLICITUD RECIBIDA</h2><p className="mt-4 text-sm leading-6 text-gray-500 dark:text-muted">El RRPP va a validar tu solicitud. Te confirmarán si estás en la lista.</p><button onClick={onClose} className="btn-primary mt-7 w-full">Listo</button></div>
  )

  return (
    <form onSubmit={submit}>
      <p className="eyebrow mb-3">{event.nombre} · {event.fechaCorta}</p>
      <h2 className="display-title pr-8 text-4xl sm:text-5xl">SUMARME A LA LISTA</h2>
      <p className="mt-3 text-sm text-muted">{event.club}, {event.ciudad}. Completá tus datos tal como figuran en tu documento.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <input required className="field" placeholder="NOMBRE" value={form.nombre} onChange={update('nombre')} />
        <input required className="field" placeholder="APELLIDO" value={form.apellido} onChange={update('apellido')} />
        <input required inputMode="numeric" pattern="[0-9]{7,9}" className="field sm:col-span-2" placeholder="DNI SIN PUNTOS" value={form.dni} onChange={update('dni')} />
        <input className="field sm:col-span-2" placeholder="@tu.usuario de Instagram (opcional)" value={form.instagram} onChange={update('instagram')} />
      </div>
      {message && <p className="mt-3 text-xs text-door-red">{message}</p>}
      <button disabled={state === 'loading'} className="btn-primary mt-5 w-full">{state === 'loading' ? 'ANOTANDO...' : 'CONFIRMAR — ME ANOTO EN LA LISTA'}</button>
      <p className="mt-4 text-center font-mono text-[10px] uppercase text-muted">Pagás en la puerta el día del evento.</p>
    </form>
  )
}

export default function EventDetailPage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [priceType, setPriceType] = useState('anticipada')
  const [combo, setCombo] = useState('entrada')
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    let active = true
    api.get(`/eventos/${id}/`).then((data) => active && setEvent(data)).catch(() => {})
    return () => { active = false }
  }, [id])

  if (!event) return <section className="min-h-[540px] grid place-items-center"><p className="text-muted">Cargando evento...</p></section>

  const base = (event.precio_publicado || 0) + (priceType === 'puerta' ? 800 : 0) + (combo === 'tragos' ? 2500 : 0)

  return (
    <>
      <section className="relative min-h-[540px] overflow-hidden border-b border-white/10">
        <img src={event.imagen} alt="" className="absolute inset-0 size-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/80 to-void/20" />
        <div className="container-page relative flex min-h-[540px] flex-col justify-between py-8">
          <Link to="/" className="flex w-fit items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted hover:text-strobe"><Icon name="back" size={16} /> Volver</Link>
          <div className="max-w-4xl pb-4"><p className="eyebrow mb-4">{event.genero} · {event.ciudad}</p><h1 className="display-title text-6xl sm:text-8xl lg:text-[112px]">{event.nombre}</h1><div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 font-mono text-xs uppercase text-paper-text"><span className="flex items-center gap-2"><Icon name="pin" size={16} className="text-door-red" />{event.club}</span><span className="flex items-center gap-2"><Icon name="calendar" size={16} className="text-strobe" />{event.fechaCorta}</span><span className="flex items-center gap-2"><Icon name="clock" size={16} className="text-uv" />{event.horario} HS</span><span>+18</span></div></div>
        </div>
      </section>

      <section className="py-12 md:py-16"><div className="container-page grid gap-10 lg:grid-cols-[1fr_430px]">
        <div>
          <p className="eyebrow mb-3">Sobre la noche</p><p className="max-w-2xl text-lg leading-8 text-muted">{event.descripcion}</p>
          <h2 className="display-title mt-12 text-4xl">LINE-UP</h2><div className="mt-5 flex flex-wrap gap-2">{(event.line_up || event.lineup || []).map((artist, i) => <span key={artist} className={`border px-4 py-3 font-mono text-xs font-bold uppercase ${i === 0 ? 'border-strobe text-strobe' : 'border-white/20 text-paper-text'}`}>{artist}</span>)}</div>
          <div className="mt-12 grid gap-3 sm:grid-cols-3">{[['pin','CLUB',`${event.club} · ${event.ciudad}`],['clock','HORARIO',`${event.horario} — 06:00`],['shield','INGRESO','DNI físico · +18']].map(([icon,label,value]) => <div className="panel p-4" key={label}><Icon name={icon} className="mb-5 text-uv"/><p className="eyebrow">{label}</p><p className="mt-2 text-sm font-semibold">{value}</p></div>)}</div>
        </div>
        <aside className="h-fit border border-white/15 bg-floor p-5 lg:sticky lg:top-24">
          <p className="eyebrow mb-2">Elegí tu acceso</p><h2 className="display-title text-3xl">PRECIO POR FRANJA HORARIA</h2>
          <div className="mt-5 grid gap-2">{[['anticipada','ANTICIPADA',event.precio_publicado],['puerta','EN PUERTA',event.precio_publicado + 800]].map(([value,label,price]) => <label key={value} className={`flex cursor-pointer items-center justify-between border p-4 transition ${priceType === value ? 'border-uv bg-uv/10' : 'border-white/15 hover:border-white/30'}`}><span className="flex items-center gap-3"><input type="radio" name="price" checked={priceType === value} onChange={() => setPriceType(value)} className="accent-violet-500"/><span className="font-mono text-xs font-bold">{label}</span></span><span className="font-mono text-sm font-bold text-strobe">{formatMoney(price)}</span></label>)}</div>
          <h3 className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-muted">Elegí tu combo</h3>
          <div className="mt-3 grid gap-2">{[['entrada','SOLO ENTRADA',0],['tragos','ENTRADA + 2 TRAGOS',2500]].map(([value,label,extra]) => <label key={value} className={`flex cursor-pointer items-center justify-between border p-4 transition ${combo === value ? 'border-strobe bg-strobe/5' : 'border-white/15 hover:border-white/30'}`}><span className="flex items-center gap-3"><input type="radio" name="combo" checked={combo === value} onChange={() => setCombo(value)} className="accent-cyan-400"/><span className="font-mono text-xs font-bold">{label}</span></span><span className="font-mono text-xs text-muted">{extra ? `+${formatMoney(extra)}` : 'INCLUIDO'}</span></label>)}</div>
          <Link to={`/checkout/${event.slug}`} state={{ priceType, combo, total: base }} className="btn-primary mt-5 w-full">COMPRAR COMBO — {formatMoney(base)} <Icon name="arrow" size={17}/></Link>
          <button onClick={() => setModalOpen(true)} className={`btn-secondary mt-3 w-full${event.habilitar_lista === false ? ' hidden' : ''}`}>SUMARME A LA LISTA</button>
        </aside>
      </div></section>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} label="Sumarme a la lista"><ListForm event={event} onClose={() => setModalOpen(false)} /></Modal>
    </>
  )
}

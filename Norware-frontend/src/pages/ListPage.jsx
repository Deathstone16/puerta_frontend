import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Icon from '../components/Icons'
import { getEvent } from '../data/mockData'
import { api } from '../lib/api'

export default function ListPage() {
  const { slug } = useParams()
  const [data, setData] = useState({ evento: getEvent('neon-protocol'), rrpp_nombre: 'Lista general', anotados: 146 })
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '' })
  const [status, setStatus] = useState('idle')

  useEffect(() => { api.get(`/lista/${slug}/`).then(setData).catch(() => {}) }, [slug])
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }))
  const submit = async (e) => {
    e.preventDefault(); setStatus('loading')
    try { await api.post(`/lista/${slug}/anotar/`, form); setStatus('success') }
    catch (error) { setStatus(error.status === 0 ? 'success' : 'error') }
  }
  const event = { ...getEvent(data.evento?.slug || data.evento?.id), ...(data.evento || {}) }

  return <section className="grid min-h-[calc(100vh-64px)] place-items-center px-4 py-12"><div className="w-full max-w-xl border-2 border-strobe bg-floor p-6 shadow-[10px_10px_0_#8B5CF6] sm:p-10">{status === 'success' ? <div className="text-center"><div className="mx-auto mb-5 grid size-20 place-items-center border-2 border-strobe text-strobe"><Icon name="check" size={42}/></div><p className="eyebrow mb-3">Registro exitoso</p><h1 className="display-title text-5xl">ESTÁS EN LA LISTA</h1><p className="mt-5 text-sm text-muted">Presentate con tu DNI en la puerta de {event.club}.</p></div> : <form onSubmit={submit}><p className="eyebrow mb-3">{event.nombre} · {event.fechaCorta}</p><h1 className="display-title text-5xl sm:text-6xl">SUMARME<br/>A LA LISTA</h1><p className="mt-4 text-sm text-muted">Lista de {data.rrpp_nombre}. Ya hay {data.anotados} personas anotadas.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><input required className="field" placeholder="NOMBRE" value={form.nombre} onChange={update('nombre')}/><input required className="field" placeholder="APELLIDO" value={form.apellido} onChange={update('apellido')}/><input required inputMode="numeric" pattern="[0-9]{7,9}" className="field sm:col-span-2" placeholder="DNI SIN PUNTOS" value={form.dni} onChange={update('dni')}/></div>{status === 'error' && <p className="mt-3 text-xs text-door-red">No pudimos anotarte. Revisá los datos e intentá otra vez.</p>}<button disabled={status === 'loading'} className="btn-primary mt-5 w-full">{status === 'loading' ? 'ANOTANDO...' : 'CONFIRMAR — ME ANOTO EN LA LISTA'}</button><p className="mt-4 text-center font-mono text-[10px] uppercase text-muted">Pagás en la puerta el día del evento.</p></form>}</div></section>
}

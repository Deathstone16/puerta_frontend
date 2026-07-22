import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icons'
import { usePurchase } from '../context/PurchaseContext'
import { formatMoney, getEvent, normalizeEvent } from '../data/mockData'
import { api } from '../lib/api'

export default function CheckoutPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { setSelection } = usePurchase()
  const [event, setEvent] = useState(getEvent(id))
  const [buyer, setBuyer] = useState({ nombre: '', apellido: '', dni: '', email: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const choice = location.state || { priceType: 'anticipada', combo: 'entrada' }

  useEffect(() => { api.get(`/eventos/${id}/`).then((data) => setEvent(normalizeEvent(data))).catch(() => {}) }, [id])
  const amounts = useMemo(() => {
    const ticket = event.precio_base || Math.round(event.precio_publicado * .82)
    const drink = choice.combo === 'tragos' ? 2500 : 0
    const mp = Math.round(ticket * .05)
    const service = Math.max(250, event.precio_publicado - ticket) + drink
    return { ticket, drink, mp, service, total: ticket + service + mp }
  }, [event, choice.combo])
  const update = (key) => (e) => setBuyer((current) => ({ ...current, [key]: e.target.value }))

  const pay = async (e) => {
    e.preventDefault()
    setStatus('loading'); setError('')
    const purchase = { event, buyer, choice, amounts }
    setSelection(purchase)
    try {
      const data = await api.post('/pagos/preferencial/', { evento_id: event.id, ...buyer })
      if (data?.init_point) window.location.assign(data.init_point)
      else navigate('/procesando', { state: { token: data?.token } })
    } catch (apiError) {
      if (apiError.status === 0) navigate('/procesando', { state: { token: 'demo-ticket' } })
      else { setError(apiError.message); setStatus('error') }
    }
  }

  return (
    <section className="min-h-[calc(100vh-64px)] py-8 md:py-14"><div className="container-page max-w-5xl">
      <Link to={`/evento/${event.slug}`} className="mb-8 flex w-fit items-center gap-2 font-mono text-[10px] font-bold uppercase text-muted hover:text-strobe"><Icon name="back" size={16}/> Volver</Link>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={pay} className="order-2 lg:order-1">
          <p className="eyebrow mb-3">Datos de la entrada</p><h1 className="display-title text-5xl sm:text-7xl">RESUMEN</h1><p className="mt-4 max-w-xl text-sm leading-6 text-muted">Usamos estos datos para emitir tu ticket. Tienen que coincidir con el DNI que presentes en puerta.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2"><input required className="field" placeholder="NOMBRE" value={buyer.nombre} onChange={update('nombre')}/><input required className="field" placeholder="APELLIDO" value={buyer.apellido} onChange={update('apellido')}/><input required className="field" inputMode="numeric" pattern="[0-9]{7,9}" placeholder="DNI SIN PUNTOS" value={buyer.dni} onChange={update('dni')}/><input required type="email" className="field" placeholder="EMAIL" value={buyer.email} onChange={update('email')}/></div>
          <div className="mt-8 border-l-2 border-strobe bg-strobe/5 p-4"><p className="font-mono text-xs font-bold text-strobe">PAGO SEGURO CON MERCADO PAGO</p><p className="mt-2 text-xs leading-5 text-muted">Al continuar vas a Mercado Pago y, cuando termine la operación, volvés automáticamente a tu ticket.</p></div>
          {error && <p className="mt-4 border border-door-red/40 bg-door-red/10 p-3 text-xs text-door-red">{error}</p>}
          <button disabled={status === 'loading'} className="btn-primary mt-6 w-full">{status === 'loading' ? 'CONECTANDO CON MERCADO PAGO...' : `PAGAR ${formatMoney(amounts.total)} CON MERCADO PAGO`} <Icon name="arrow" size={17}/></button>
        </form>
        <aside className="order-1 h-fit border-2 border-amber-300 bg-floor p-5 text-paper-text lg:order-2">
          <div className="border-b border-dashed border-white/25 pb-5"><p className="eyebrow text-amber-300">Tu noche</p><h2 className="display-title mt-2 text-3xl">{event.nombre}</h2><p className="mt-3 text-xs text-muted">{event.club} · {event.ciudad}<br/>{event.fechaCorta} · {event.horario} HS</p></div>
          <div className="space-y-3 border-b border-dashed border-white/25 py-5 font-mono text-xs"><p className="flex justify-between"><span className="text-muted">ENTRADA</span><span>{formatMoney(amounts.ticket)}</span></p>{amounts.drink > 0 && <p className="flex justify-between"><span className="text-muted">COMBO 2 TRAGOS</span><span>{formatMoney(amounts.drink)}</span></p>}<p className="flex justify-between"><span className="text-muted">SERVICIO NORWARE</span><span>{formatMoney(amounts.service)}</span></p><p className="flex justify-between"><span className="text-muted">MERCADO PAGO</span><span>{formatMoney(amounts.mp)}</span></p></div>
          <div className="flex items-end justify-between pt-5"><span className="font-mono text-xs font-bold">TOTAL</span><strong className="font-mono text-3xl text-strobe">{formatMoney(amounts.total)}</strong></div>
        </aside>
      </div>
    </div></section>
  )
}

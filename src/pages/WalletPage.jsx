import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icons'
import { usePurchase } from '../context/PurchaseContext'
import { api } from '../lib/api'

export default function WalletPage() {
  const { token } = useParams()
  const { selection, ticket: storedTicket, setTicket } = usePurchase()
  const canvasWrap = useRef(null)
  const fallback = {
    token,
    codigo: `N001-${String(token).slice(-4).toUpperCase().padStart(4, '0')}`,
    nombre: selection?.buyer?.nombre || 'Invitado',
    apellido: selection?.buyer?.apellido || 'Norware',
    dni: selection?.buyer?.dni || '—',
    estado: 'pagado',
    evento: selection?.event || {},
    qr_code: token,
  }
  const [ticket, setLocalTicket] = useState(storedTicket || fallback)

  useEffect(() => {
    let active = true
    if (token === 'demo-ticket') { setTicket(fallback); return undefined }
    api.get(`/wallet/${token}/`).then((data) => { if (active) { setLocalTicket(data); setTicket(data) } }).catch(() => {})
    return () => { active = false }
  }, [token])

  const event = ticket.evento || {}
  const download = () => {
    const canvas = canvasWrap.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a'); link.download = `norware-${ticket.codigo}.png`; link.href = canvas.toDataURL('image/png'); link.click()
  }
  const share = async () => {
    const payload = { title: `Entrada ${event.nombre}`, text: `Mi entrada ${ticket.codigo} para ${event.nombre}`, url: window.location.href }
    if (navigator.share) await navigator.share(payload)
    else await navigator.clipboard.writeText(window.location.href)
  }

  return (
    <section className="py-10 md:py-16"><div className="container-page max-w-xl">
      <div className="mb-6 flex items-center gap-2 font-mono text-xs font-bold uppercase text-strobe"><Icon name="check" size={17}/> Pago confirmado</div>
      <article className="border border-white/15 bg-floor shadow-[12px_12px_0_rgba(34,211,238,.15)]">
        <div className="border-b border-dashed border-white/20 p-6 text-center"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">Ticket {ticket.codigo}</p><h1 className="display-title mt-4 text-5xl">{event.nombre}</h1><p className="mt-3 text-sm text-muted">{event.fechaCorta} · {event.horario} HS · {event.club}</p></div>
        <div className="p-6 text-center"><div className="mx-auto mb-5 inline-flex border border-strobe/60 bg-strobe/5 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-strobe">Acceso confirmado</div><div ref={canvasWrap} className="mx-auto w-fit border-8 border-white bg-white p-3"><QRCodeCanvas value={ticket.qr_code || token} size={220} level="H" fgColor="#0A0A10" bgColor="#FFFFFF"/></div><p className="mt-5 font-mono text-xs font-bold uppercase">{ticket.nombre} {ticket.apellido}</p><p className="mt-2 font-mono text-[10px] text-muted">DNI {ticket.dni}</p><p className="mt-5 text-xs leading-5 text-muted">Mostrá este QR en la puerta junto con tu DNI. El código es único y se invalida después del ingreso.</p></div>
      </article>
      <div className="mt-7 grid grid-cols-2 gap-3"><button onClick={download} className="btn-secondary"><Icon name="download" size={17}/>Descargar</button><button onClick={share} className="btn-secondary"><Icon name="share" size={17}/>Compartir</button></div><Link to="/" className="mt-5 flex items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase text-muted hover:text-strobe"><Icon name="back" size={15}/> Volver al inicio</Link>
    </div></section>
  )
}

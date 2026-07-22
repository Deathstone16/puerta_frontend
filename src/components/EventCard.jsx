import { Link } from 'react-router-dom'
import { formatMoney } from '../data/mockData'
import Icon from './Icons'

export default function EventCard({ event, featured = false }) {
  return (
    <Link to={`/evento/${event.slug}`} className={`group relative isolate block overflow-hidden border border-white/10 bg-floor ${featured ? 'h-[350px] md:h-[430px]' : 'h-[390px]'}`}>
      <img src={event.imagen} alt="" className="absolute inset-0 -z-20 size-full object-cover grayscale-[35%] transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-void via-void/35 to-transparent" />
      <div className="absolute left-0 top-0 border-b border-r border-white/20 bg-void/80 px-3 py-2 font-mono text-[11px] font-bold text-strobe backdrop-blur">{event.fechaCorta}</div>
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[.18em] text-muted">{event.club} · {event.ciudad}</p>
        <h3 className={`${featured ? 'text-4xl md:text-5xl' : 'text-3xl'} display-title text-white`}>{event.nombre}</h3>
        <p className="mt-3 text-sm text-muted">{event.genero} · {event.lineup.join(' / ')}</p>
        <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4">
          <span className="font-mono text-sm font-bold text-paper-text">{formatMoney(event.precio_publicado)}</span>
          <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-strobe">Ver noche <Icon name="arrow" size={15} /></span>
        </div>
      </div>
    </Link>
  )
}

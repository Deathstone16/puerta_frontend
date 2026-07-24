import { Link } from 'react-router-dom'
import { formatMoney } from '../lib/format'
import Icon from './Icons'

export default function EventCard({ event, featured = false }) {
  return (
    <Link to={`/evento/${event.slug}`} className={`group relative isolate block overflow-hidden border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-floor ${featured ? 'h-[350px] md:h-[430px]' : 'h-[390px]'}`}>
      <img src={event.imagen} alt="" className="absolute inset-0 -z-20 size-full object-cover grayscale-[35%] transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-white via-white/35 to-transparent dark:from-void dark:via-void/35" />
      <div className="absolute left-0 top-0 border-b border-r border-gray-300 bg-white/80 px-3 py-2 font-mono text-[11px] font-bold text-strobe backdrop-blur dark:border-white/20 dark:bg-void/80">{event.fechaCorta}</div>
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[.18em] text-gray-500 dark:text-muted">{event.club} · {event.ciudad}</p>
        <h3 className={`${featured ? 'text-4xl md:text-5xl' : 'text-3xl'} display-title text-gray-900 dark:text-white`}>{event.nombre}</h3>
        <p className="mt-3 text-sm text-gray-500 dark:text-muted">{event.genero} · {event.lineup.join(' / ')}</p>
        <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-white/15">
          <span className="font-mono text-sm font-bold text-gray-900 dark:text-paper-text">{formatMoney(event.precio_publicado)}</span>
          <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-strobe">Ver noche <Icon name="arrow" size={15} /></span>
        </div>
      </div>
    </Link>
  )
}

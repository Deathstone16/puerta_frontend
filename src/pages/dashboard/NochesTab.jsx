import { useState } from 'react'
import Icon from '../../components/Icons'
import EventoRrppAssigner from '../../components/EventoRrppAssigner'
import { formatMoney } from '../../lib/format'

/**
 * NochesTab — Event list with estado-colored left borders, action buttons, and RRPP assignment.
 *
 * Props:
 *   eventos: Evento[] — list of owner's events
 *   onEdit: (evento) => void — opens edit modal
 *   onCancel: (eventoId) => void — initiates cancel flow
 *   onCreate: () => void — opens create modal
 */

function getEstadoBorderColor(estado) {
  if (estado === 'publicado' || estado === 'activo') return '#8B5CF6'
  if (estado === 'cancelado') return '#E23B5A'
  return '#8A87A3'
}

function getEstadoBadge(estado) {
  if (estado === 'publicado' || estado === 'activo') return { label: 'activo', className: 'border-strobe text-strobe' }
  if (estado === 'cancelado') return { label: 'cancelado', className: 'border-door-red text-door-red' }
  return { label: estado, className: 'border-gray-400 text-gray-400 dark:border-muted dark:text-muted' }
}

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return String(isoDate)
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace(',', ' ·')
}

export default function NochesTab({ eventos = [], onEdit, onCancel, onCreate }) {
  const [expandedId, setExpandedId] = useState(null)

  const toggleExpand = (id) => {
    setExpandedId((current) => current === id ? null : id)
  }

  return (
    <div data-testid="noches-tab">
      {/* Header with create button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="eyebrow">Gestión de eventos</p>
          <h2 className="display-title mt-2 text-3xl">EVENTOS</h2>
        </div>
        <button onClick={onCreate} className="btn-primary" data-testid="crear-noche-btn">
          <Icon name="plus" size={17} /> Crear evento
        </button>
      </div>

      {/* Event list */}
      {eventos.length === 0 ? (
        <div className="panel grid min-h-48 place-items-center p-8 text-center">
          <div>
            <Icon name="calendar" size={38} className="mx-auto text-gray-400 dark:text-muted" />
            <p className="display-title mt-5 text-2xl">SIN EVENTOS</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-muted">Creá tu primer evento para empezar a vender entradas.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3" data-testid="eventos-list">
          {eventos.map((evento) => {
            const badge = getEstadoBadge(evento.estado)
            const borderColor = getEstadoBorderColor(evento.estado)
            const isExpanded = expandedId === evento.id

            return (
              <div key={evento.id} className="overflow-hidden border border-gray-200 dark:border-white/10" style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}>
                <article
                  className="flex items-center gap-4 bg-gray-50 p-4 transition hover:bg-gray-100 dark:bg-floor dark:hover:bg-white/[.02]"
                  data-testid="evento-card"
                >
                  {/* Event info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="truncate font-display text-xl uppercase text-gray-900 dark:text-paper-text">{evento.nombre}</h3>
                      <span className={`shrink-0 border px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-gray-500 dark:text-muted">
                      {formatDate(evento.fecha)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden items-center gap-5 sm:flex">
                    <div className="text-right">
                      <p className="font-mono text-xs font-bold text-strobe">{formatMoney(evento.precio_publicado)}</p>
                      <p className="font-mono text-[9px] text-gray-500 dark:text-muted">publicado</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs font-bold text-gray-900 dark:text-paper-text">{evento.aforo_max}</p>
                      <p className="font-mono text-[9px] text-gray-500 dark:text-muted">aforo</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => toggleExpand(evento.id)}
                      className={`grid size-10 place-items-center border transition ${isExpanded ? 'border-strobe bg-strobe/10 text-strobe' : 'border-gray-200 text-gray-400 hover:border-strobe hover:text-strobe dark:border-white/15 dark:text-muted'}`}
                      aria-label={`RRPP de ${evento.nombre}`}
                      title="Gestionar RRPP"
                      data-testid="rrpp-btn"
                    >
                      <Icon name="users" size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(evento)}
                      className="grid size-10 place-items-center border border-gray-200 text-gray-400 transition hover:border-strobe hover:text-strobe dark:border-white/15 dark:text-muted"
                      aria-label={`Editar ${evento.nombre}`}
                      data-testid="editar-btn"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      onClick={() => onCancel(evento.id)}
                      disabled={evento.estado === 'cancelado'}
                      className="grid size-10 place-items-center border border-gray-200 text-gray-400 transition hover:border-door-red hover:text-door-red disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/15 dark:text-muted"
                      aria-label={`Cancelar ${evento.nombre}`}
                      data-testid="cancelar-btn"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                </article>

                {/* Expanded: RRPP assignment panel */}
                {isExpanded && evento.estado !== 'cancelado' && (
                  <EventoRrppAssigner
                    eventoId={evento.id}
                    eventoNombre={evento.nombre}
                    onClose={() => setExpandedId(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

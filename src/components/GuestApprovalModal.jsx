import Modal from './Modal'
import Icon from './Icons'

/**
 * GuestApprovalModal — Shows guest details (including instagram) and allows RRPP to approve/reject.
 *
 * Props:
 *   open: boolean
 *   guest: { id, nombre, apellido, dni, instagram, estado, creado_en } | null
 *   onClose: () => void
 *   onApprove: (guestId) => void
 *   onReject: (guestId) => void
 *   onDelete: (guestId) => void
 *   busy: boolean
 */
export default function GuestApprovalModal({ open, guest, onClose, onApprove, onReject, onDelete, busy = false }) {
  if (!open || !guest) return null

  const isPending = guest.estado === 'pendiente'
  const fullName = [guest.nombre, guest.apellido].filter(Boolean).join(' ') || 'Invitado'

  return (
    <Modal open={open} onClose={onClose} label="Detalle de invitado">
      <div data-testid="guest-approval-modal">
        <p className="eyebrow mb-3">{isPending ? 'Solicitud pendiente' : 'Detalle invitado'}</p>
        <h2 className="display-title pr-8 text-4xl">{fullName}</h2>

        {/* Guest details */}
        <div className="mt-7 grid gap-4 border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Nombre</p>
              <p className="mt-1 text-sm font-semibold">{guest.nombre}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Apellido</p>
              <p className="mt-1 text-sm font-semibold">{guest.apellido}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">DNI</p>
              <p className="mt-1 font-mono text-sm font-bold">{guest.dni || '—'}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Instagram</p>
              {guest.instagram ? (
                <a
                  href={`https://instagram.com/${guest.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block font-mono text-sm font-bold text-strobe hover:underline"
                >
                  @{guest.instagram}
                </a>
              ) : (
                <p className="mt-1 font-mono text-sm text-[var(--color-text-muted)]">No informado</p>
              )}
            </div>
          </div>
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Estado</p>
            <span className={`mt-1 inline-block border px-2 py-1 font-mono text-[9px] font-bold uppercase ${
              guest.estado === 'pendiente' ? 'border-amber-300 text-amber-300' :
              guest.estado === 'ingresado' ? 'border-strobe text-strobe' :
              'border-[var(--color-text-muted)] text-[var(--color-text-muted)]'
            }`}>
              {guest.estado || 'Sin estado'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 grid gap-3">
          {isPending && (
            <>
              <button
                disabled={busy}
                onClick={() => onApprove(guest.id)}
                className="btn-primary w-full"
                data-testid="approve-btn"
              >
                <Icon name="check" size={17} /> APROBAR — AGREGAR A LA LISTA
              </button>
              <button
                disabled={busy}
                onClick={() => onReject(guest.id)}
                className="min-h-12 w-full border border-door-red bg-door-red/10 font-mono text-xs font-bold uppercase tracking-wider text-door-red transition hover:bg-door-red/20 disabled:opacity-50"
                data-testid="reject-btn"
              >
                <Icon name="close" size={17} /> RECHAZAR SOLICITUD
              </button>
            </>
          )}
          <button
            disabled={busy}
            onClick={() => onDelete(guest.id)}
            className="min-h-12 w-full border border-[var(--color-border)] font-mono text-xs font-bold uppercase tracking-wider text-door-red transition hover:border-door-red disabled:opacity-50"
            data-testid="delete-btn"
          >
            ELIMINAR DE LA LISTA
          </button>
        </div>
      </div>
    </Modal>
  )
}

import Modal from './Modal'
import { formatMoney } from '../data/mockData'

/**
 * PriceBreakdownModal — Shows price breakdown after event creation.
 * Only the dueño sees this (fee details). The client only sees the final price.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   priceData: { precio_base, fee_mp, fee_norware, precio_publicado } | null
 *   eventoNombre: string
 */
export default function PriceBreakdownModal({ open, onClose, priceData, eventoNombre = '' }) {
  if (!open || !priceData) return null

  return (
    <Modal open={open} onClose={onClose} label="Desglose de precio">
      <div data-testid="price-breakdown-modal">
        <p className="eyebrow mb-3">Evento creado exitosamente</p>
        <h2 className="display-title pr-8 text-4xl">{eventoNombre || 'DESGLOSE'}</h2>

        <div className="mt-7 border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
          <p className="mb-4 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Resumen de costos por entrada
          </p>

          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Precio base (lo que recibís)</span>
              <span className="font-bold">{formatMoney(priceData.precio_base)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Comisión Mercado Pago</span>
              <span className="text-amber-500">{formatMoney(priceData.fee_mp)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Comisión Norware</span>
              <span className="text-amber-500">{formatMoney(priceData.fee_norware)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] pt-3 text-base font-bold">
              <span>Precio publicado (cliente paga)</span>
              <span className="text-strobe">{formatMoney(priceData.precio_publicado)}</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          El cliente solo ve el precio final ({formatMoney(priceData.precio_publicado)}). Los detalles de comisiones son visibles únicamente para vos.
        </p>

        <button onClick={onClose} className="btn-primary mt-6 w-full" data-testid="breakdown-close-btn">
          ENTENDIDO
        </button>
      </div>
    </Modal>
  )
}

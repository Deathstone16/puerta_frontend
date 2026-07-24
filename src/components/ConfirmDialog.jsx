import { useEffect, useRef } from 'react'
import Icon from './Icons'

/**
 * ConfirmDialog — Reusable confirmation modal.
 *
 * Props:
 *   open: boolean
 *   title: string
 *   message: string
 *   confirmText?: string (default: "Confirmar")
 *   cancelText?: string (default: "Cancelar")
 *   destructive?: boolean — red styling for confirm button
 *   onConfirm: () => void
 *   onCancel: () => void
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    // Focus the confirm button on open
    confirmRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4 backdrop-blur-sm dark:bg-void/90"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm border border-gray-200 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-void">
        <h2 className="font-display text-xl text-gray-900 dark:text-paper-text">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-muted">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-11 border border-gray-200 px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-600 transition hover:border-gray-400 dark:border-white/15 dark:text-muted dark:hover:border-white/30"
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`flex-1 min-h-11 border px-4 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
              destructive
                ? 'border-door-red bg-door-red/10 text-door-red hover:bg-door-red/20 dark:border-door-red dark:bg-door-red/10'
                : 'border-strobe bg-strobe/10 text-strobe hover:bg-strobe/20 dark:border-strobe dark:bg-strobe/10'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

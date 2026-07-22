import { useEffect } from 'react'
import Icon from './Icons'

export default function Modal({ open, onClose, children, label = 'Ventana modal' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-void/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={label} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="relative w-full max-w-lg border-2 border-strobe bg-void p-6 shadow-[10px_10px_0_#8B5CF6] md:p-9">
        <button onClick={onClose} className="absolute right-3 top-3 grid size-10 place-items-center text-muted transition hover:text-white" aria-label="Cerrar">
          <Icon name="close" />
        </button>
        {children}
      </div>
    </div>
  )
}

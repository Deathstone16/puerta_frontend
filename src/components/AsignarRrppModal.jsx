import { useEffect, useState } from 'react'
import Modal from './Modal'
import Icon from './Icons'
import { api } from '../lib/api'

/**
 * AsignarRrppModal — Assign an RRPP to an event and display generated links.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   eventos: Evento[] — available events to assign
 */

export default function AsignarRrppModal({ open, onClose, eventos = [] }) {
  const [rrppList, setRrppList] = useState([])
  const [selectedRrpp, setSelectedRrpp] = useState('')
  const [selectedEvento, setSelectedEvento] = useState('')
  const [links, setLinks] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch RRPP list when modal opens
  useEffect(() => {
    if (!open) return
    setLinks(null)
    setApiError('')
    setSelectedRrpp('')
    setSelectedEvento('')
    setLoading(true)

    api.get('/rrpp/')
      .then((data) => setRrppList(Array.isArray(data) ? data : []))
      .catch(() => setRrppList([]))
      .finally(() => setLoading(false))
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRrpp || !selectedEvento || submitting) return
    setSubmitting(true)
    setApiError('')
    setLinks(null)

    try {
      const result = await api.post(`/rrpp/${selectedRrpp}/asignar-evento/`, {
        evento_id: Number(selectedEvento),
      })
      setLinks(result.links || [])
    } catch (error) {
      setApiError(error.data?.detail || error.message || 'No se pudo asignar el RRPP.')
    } finally {
      setSubmitting(false)
    }
  }

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback silencioso
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} label="Asignar RRPP a evento">
      <div data-testid="asignar-rrpp-modal">
        <p className="eyebrow mb-3">Asignación</p>
        <h2 className="display-title pr-8 text-4xl">ASIGNAR RRPP</h2>

        {loading ? (
          <div className="mt-7 text-center">
            <div className="mx-auto size-8 animate-spin border-2 border-white/10 border-t-strobe" />
            <p className="mt-3 font-mono text-[10px] uppercase text-muted">Cargando RRPP...</p>
          </div>
        ) : links ? (
          /* --- Success: show generated links --- */
          <div className="mt-7" data-testid="links-result">
            <p className="mb-4 text-sm text-muted">Links generados para el RRPP asignado:</p>
            <div className="space-y-2">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2 border border-white/10 bg-void p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[9px] font-bold uppercase text-muted">{link.tipo}</p>
                    <p className="mt-1 truncate font-mono text-xs text-strobe">{link.url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyLink(link.url)}
                    className="grid size-9 shrink-0 place-items-center border border-white/15 text-muted hover:text-strobe"
                    aria-label="Copiar link"
                  >
                    <Icon name="share" size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={onClose} className="btn-primary mt-6 w-full">CERRAR</button>
          </div>
        ) : (
          /* --- Form: select RRPP + event --- */
          <form onSubmit={handleSubmit} className="mt-7 space-y-4" data-testid="asignar-form">
            <label className="block">
              <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">RRPP</span>
              <select
                required
                className="field"
                value={selectedRrpp}
                onChange={(e) => { setSelectedRrpp(e.target.value); setApiError('') }}
                data-testid="select-rrpp"
              >
                <option value="">Seleccionar RRPP...</option>
                {rrppList.map((rrpp) => (
                  <option key={rrpp.id} value={rrpp.id}>
                    {rrpp.nombre} {rrpp.apellido || ''} (@{rrpp.username})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Evento</span>
              <select
                required
                className="field"
                value={selectedEvento}
                onChange={(e) => { setSelectedEvento(e.target.value); setApiError('') }}
                data-testid="select-evento"
              >
                <option value="">Seleccionar evento...</option>
                {eventos.filter((ev) => ev.estado !== 'cancelado').map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.nombre}</option>
                ))}
              </select>
            </label>

            {apiError && (
              <p className="border border-door-red/50 bg-door-red/10 p-3 text-xs text-door-red" data-testid="asignar-api-error">
                {apiError}
              </p>
            )}

            <button
              disabled={submitting || !selectedRrpp || !selectedEvento}
              className="btn-primary w-full"
              data-testid="asignar-submit-btn"
            >
              {submitting ? 'ASIGNANDO...' : 'ASIGNAR A EVENTO'}
            </button>
          </form>
        )}
      </div>
    </Modal>
  )
}

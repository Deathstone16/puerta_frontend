import { useEffect, useState } from 'react'
import Modal from './Modal'
import Icon from './Icons'
import { api } from '../lib/api'

/**
 * AsignarRrppModal — Assign an RRPP to an event with commission definition.
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
  const [tipoComision, setTipoComision] = useState('fijo')
  const [valorComision, setValorComision] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch RRPP list when modal opens
  useEffect(() => {
    if (!open) return
    setSuccess('')
    setApiError('')
    setSelectedRrpp('')
    setSelectedEvento('')
    setTipoComision('fijo')
    setValorComision('')
    setLoading(true)

    api.get('/rrpp/')
      .then((data) => setRrppList(Array.isArray(data) ? data : []))
      .catch(() => setRrppList([]))
      .finally(() => setLoading(false))
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRrpp || !selectedEvento || !valorComision || submitting) return
    setSubmitting(true)
    setApiError('')
    setSuccess('')

    try {
      const result = await api.post(`/rrpp/${selectedRrpp}/asignar-evento/`, {
        evento_id: Number(selectedEvento),
        tipo_comision: tipoComision,
        valor_comision: Number(valorComision),
      })
      if (result.ya_asignado) {
        setSuccess(`${result.rrpp_nombre} ya estaba asignado a ${result.evento_nombre}`)
      } else {
        setSuccess(`${result.rrpp_nombre} asignado con éxito a ${result.evento_nombre}`)
      }
    } catch (error) {
      const detail = error.data?.error || error.data?.detail || error.message || 'No se pudo asignar el RRPP.'
      setApiError(detail)
    } finally {
      setSubmitting(false)
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
        ) : success ? (
          /* Success state */
          <div className="mt-7 text-center" data-testid="asignar-success">
            <div className="mx-auto mb-4 grid size-16 place-items-center border-2 border-emerald-400 text-emerald-400">
              <Icon name="check" size={34} />
            </div>
            <p className="font-mono text-sm font-bold uppercase text-emerald-300">{success}</p>
            <button onClick={onClose} className="btn-primary mt-6 w-full">LISTO</button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="mt-7 space-y-4" data-testid="asignar-form">
            <label className="block">
              <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">RRPP <span className="text-door-red">*</span></span>
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
                    {rrpp.nombre} (@{rrpp.username})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Evento <span className="text-door-red">*</span></span>
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

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Tipo comisión <span className="text-door-red">*</span></span>
                <select
                  className="field"
                  value={tipoComision}
                  onChange={(e) => setTipoComision(e.target.value)}
                >
                  <option value="fijo">$ Fijo /ingresado</option>
                  <option value="porcentaje">% del recaudado</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">
                  {tipoComision === 'fijo' ? 'Monto ($)' : 'Porcentaje (%)'} <span className="text-door-red">*</span>
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  className="field"
                  value={valorComision}
                  onChange={(e) => setValorComision(e.target.value)}
                  placeholder={tipoComision === 'fijo' ? '1500' : '10'}
                />
              </label>
            </div>

            {apiError && (
              <p className="border border-door-red/50 bg-door-red/10 p-3 text-xs text-door-red" data-testid="asignar-api-error">
                {apiError}
              </p>
            )}

            <button
              disabled={submitting || !selectedRrpp || !selectedEvento || !valorComision}
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

import { useEffect, useState } from 'react'
import Modal from './Modal'
import Icon from './Icons'
import { api } from '../lib/api'

export default function AsignarPersonalModal({ open, onClose, eventos = [] }) {
  const [personalList, setPersonalList] = useState([])
  const [selectedPersonal, setSelectedPersonal] = useState('')
  const [selectedEvento, setSelectedEvento] = useState('')
  const [tipoComision, setTipoComision] = useState('fijo')
  const [valorComision, setValorComision] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setSuccess(''); setApiError(''); setSelectedPersonal(''); setSelectedEvento('')
    setTipoComision('fijo'); setValorComision(''); setLoading(true)
    api.get('/personal/')
      .then((data) => setPersonalList(Array.isArray(data) ? data : []))
      .catch(() => setPersonalList([]))
      .finally(() => setLoading(false))
  }, [open])

  const selectedPerson = personalList.find((p) => String(p.id) === String(selectedPersonal))
  const isRrpp = selectedPerson?.rol === 'rrpp'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPersonal || !selectedEvento || submitting) return
    if (isRrpp && !valorComision) return
    setSubmitting(true); setApiError(''); setSuccess('')

    const body = { evento_id: Number(selectedEvento) }
    if (isRrpp) { body.tipo_comision = tipoComision; body.valor_comision = Number(valorComision) }

    try {
      const result = await api.post(`/personal/${selectedPersonal}/asignar-evento/`, body)
      setSuccess(result.ya_asignado
        ? `${result.mensaje || 'Ya estaba asignado.'}`
        : `${result.staff_nombre} asignado con éxito a ${result.evento_nombre}`)
    } catch (error) {
      setApiError(error.data?.error || error.data?.detail || error.message || 'No se pudo asignar.')
    } finally { setSubmitting(false) }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} label="Asignar personal a evento">
      <div data-testid="asignar-personal-modal">
        <p className="eyebrow mb-3">Asignación</p>
        <h2 className="display-title pr-8 text-4xl">ASIGNAR PERSONAL</h2>

        {loading ? (
          <div className="mt-7 text-center"><div className="mx-auto size-8 animate-spin border-2 border-white/10 border-t-strobe" /></div>
        ) : success ? (
          <div className="mt-7 text-center">
            <div className="mx-auto mb-4 grid size-16 place-items-center border-2 border-emerald-400 text-emerald-400"><Icon name="check" size={34} /></div>
            <p className="font-mono text-sm font-bold uppercase text-emerald-300">{success}</p>
            <button onClick={onClose} className="btn-primary mt-6 w-full">LISTO</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Personal <span className="text-door-red">*</span></span>
              <select required className="field" value={selectedPersonal} onChange={(e) => { setSelectedPersonal(e.target.value); setApiError('') }}>
                <option value="">Seleccionar persona...</option>
                {personalList.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.rol}) — @{p.username}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Evento <span className="text-door-red">*</span></span>
              <select required className="field" value={selectedEvento} onChange={(e) => { setSelectedEvento(e.target.value); setApiError('') }}>
                <option value="">Seleccionar evento...</option>
                {eventos.filter((ev) => ev.estado !== 'cancelado').map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.nombre}</option>
                ))}
              </select>
            </label>

            {isRrpp && (
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Tipo comisión <span className="text-door-red">*</span></span>
                  <select className="field" value={tipoComision} onChange={(e) => setTipoComision(e.target.value)}>
                    <option value="fijo">$ Fijo /ingresado</option>
                    <option value="porcentaje">% del recaudado</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">{tipoComision === 'fijo' ? 'Monto ($)' : 'Porcentaje (%)'} <span className="text-door-red">*</span></span>
                  <input required type="number" min="0" className="field" value={valorComision} onChange={(e) => setValorComision(e.target.value)} placeholder={tipoComision === 'fijo' ? '1500' : '10'} />
                </label>
              </div>
            )}

            {apiError && <p className="border border-door-red/50 bg-door-red/10 p-3 text-xs text-door-red">{apiError}</p>}

            <button disabled={submitting || !selectedPersonal || !selectedEvento || (isRrpp && !valorComision)} className="btn-primary w-full">
              {submitting ? 'ASIGNANDO...' : 'ASIGNAR A EVENTO'}
            </button>
          </form>
        )}
      </div>
    </Modal>
  )
}

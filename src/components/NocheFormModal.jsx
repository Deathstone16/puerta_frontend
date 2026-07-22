import { useCallback, useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import Icon from './Icons'
import { formatMoney } from '../data/mockData'
import { api } from '../lib/api'

/**
 * NocheFormModal — Create/edit event form with debounced price preview.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   evento: Evento | null — null = create mode, object = edit mode
 *   bolicheId: number
 *   onSuccess: () => void — refresh event list after mutation
 */

const EMPTY_FORM = {
  nombre: '',
  fecha: '',
  aforo_max: '',
  precio_base: '',
  line_up: '',
  habilitar_lista: true,
}

function formFromEvento(evento) {
  if (!evento) return EMPTY_FORM
  return {
    nombre: evento.nombre || '',
    fecha: evento.fecha ? evento.fecha.slice(0, 16) : '', // datetime-local format
    aforo_max: String(evento.aforo_max ?? ''),
    precio_base: String(evento.precio_base ?? ''),
    line_up: Array.isArray(evento.line_up) ? evento.line_up.join(', ') : (evento.line_up || ''),
    habilitar_lista: evento.habilitar_lista !== false,
  }
}

export default function NocheFormModal({ open, onClose, evento = null, bolicheId, onSuccess }) {
  const isEdit = Boolean(evento?.id)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [pricePreview, setPricePreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const debounceRef = useRef(null)

  // Reset form when modal opens/changes
  useEffect(() => {
    if (open) {
      setForm(formFromEvento(evento))
      setErrors({})
      setApiError('')
      setPricePreview(null)
    }
  }, [open, evento])

  // Debounced price preview
  const fetchPricePreview = useCallback((precioBase) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const value = Number(precioBase)
    if (!Number.isFinite(value) || value <= 0) {
      setPricePreview(null)
      return
    }
    setPreviewLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.get(`/precios/calcular/?precio_base=${value}`)
        setPricePreview(data)
      } catch {
        setPricePreview(null)
      } finally {
        setPreviewLoading(false)
      }
    }, 500)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const updateField = (field) => (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
    setApiError('')
    if (field === 'precio_base') fetchPricePreview(value)
  }

  const validate = () => {
    const newErrors = {}
    if (!form.nombre.trim()) newErrors.nombre = 'Nombre requerido'
    if (!form.fecha) newErrors.fecha = 'Fecha requerida'
    if (!form.aforo_max || Number(form.aforo_max) < 1) newErrors.aforo_max = 'Aforo mínimo: 1'
    if (!form.precio_base || Number(form.precio_base) < 0) newErrors.precio_base = 'Precio requerido'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate() || submitting) return

    setSubmitting(true)
    setApiError('')

    const payload = {
      nombre: form.nombre.trim(),
      fecha: form.fecha,
      aforo_max: Number(form.aforo_max),
      precio_base: Number(form.precio_base),
      line_up: form.line_up.split(',').map((s) => s.trim()).filter(Boolean),
      color_pulsera: 'amarilla', // fixed value — pulseras out of scope
      habilitar_lista: form.habilitar_lista,
    }

    try {
      if (isEdit) {
        await api.patch(`/eventos/${evento.id}/`, payload)
      } else {
        await api.post('/eventos/crear/', { ...payload, boliche_id: bolicheId })
      }
      onSuccess({ nombre: form.nombre.trim(), priceData: pricePreview })
      onClose()
    } catch (error) {
      if (error.status === 405) {
        setApiError('Este evento no se puede modificar.')
      } else {
        setApiError(error.data?.detail || error.message || 'Error al guardar el evento.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} label={isEdit ? 'Editar noche' : 'Crear nueva noche'}>
      <form onSubmit={handleSubmit} data-testid="noche-form">
        <p className="eyebrow mb-3">{isEdit ? 'Editar evento' : 'Nuevo evento'}</p>
        <h2 className="display-title pr-8 text-4xl">
          {isEdit ? evento.nombre : 'NUEVA NOCHE'}
        </h2>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {/* Nombre */}
          <label className="block sm:col-span-2">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Nombre</span>
            <input
              required
              className={`field ${errors.nombre ? 'border-door-red' : ''}`}
              value={form.nombre}
              onChange={updateField('nombre')}
              placeholder="NOMBRE DEL EVENTO"
              data-testid="input-nombre"
            />
            {errors.nombre && <p className="mt-1 text-xs text-door-red">{errors.nombre}</p>}
          </label>

          {/* Fecha */}
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Fecha y hora</span>
            <input
              required
              type="datetime-local"
              className={`field ${errors.fecha ? 'border-door-red' : ''}`}
              value={form.fecha}
              onChange={updateField('fecha')}
              data-testid="input-fecha"
            />
            {errors.fecha && <p className="mt-1 text-xs text-door-red">{errors.fecha}</p>}
          </label>

          {/* Aforo */}
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Aforo máximo</span>
            <input
              required
              type="number"
              min="1"
              className={`field ${errors.aforo_max ? 'border-door-red' : ''}`}
              value={form.aforo_max}
              onChange={updateField('aforo_max')}
              placeholder="300"
              data-testid="input-aforo"
            />
            {errors.aforo_max && <p className="mt-1 text-xs text-door-red">{errors.aforo_max}</p>}
          </label>

          {/* Precio base */}
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Precio base ($)</span>
            <input
              required
              type="number"
              min="0"
              className={`field ${errors.precio_base ? 'border-door-red' : ''}`}
              value={form.precio_base}
              onChange={updateField('precio_base')}
              placeholder="3800"
              data-testid="input-precio"
            />
            {errors.precio_base && <p className="mt-1 text-xs text-door-red">{errors.precio_base}</p>}
          </label>

          {/* Line-up */}
          <label className="block sm:col-span-2">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Line-up (separar con coma)</span>
            <input
              className="field"
              value={form.line_up}
              onChange={updateField('line_up')}
              placeholder="DJ Alpha, DJ Beta, DJ Gamma"
              data-testid="input-lineup"
            />
          </label>

          {/* Habilitar lista */}
          <label className="flex items-center gap-3 sm:col-span-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.habilitar_lista}
              onChange={(e) => setForm((prev) => ({ ...prev, habilitar_lista: e.target.checked }))}
              className="size-5 accent-uv"
              data-testid="input-habilitar-lista"
            />
            <div>
              <span className="font-mono text-xs font-bold uppercase">Habilitar lista RRPP</span>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                Si no se habilita, solo se venden entradas anticipadas por web.
              </p>
            </div>
          </label>
        </div>

        {/* Price Preview */}
        {(pricePreview || previewLoading) && (
          <div className="mt-5 border border-white/10 bg-void p-4" data-testid="price-preview">
            <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Desglose de precio</p>
            {previewLoading ? (
              <p className="mt-2 text-xs text-muted">Calculando...</p>
            ) : pricePreview && (
              <div className="mt-3 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Base</span>
                  <span>{formatMoney(pricePreview.precio_base)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Fee MP</span>
                  <span>{formatMoney(pricePreview.fee_mp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Fee Norware</span>
                  <span>{formatMoney(pricePreview.fee_norware)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 font-bold">
                  <span>Precio publicado</span>
                  <span className="text-strobe">{formatMoney(pricePreview.precio_publicado)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Error */}
        {apiError && (
          <p className="mt-4 border border-door-red/50 bg-door-red/10 p-3 text-xs text-door-red" data-testid="api-error">
            {apiError}
          </p>
        )}

        {/* Submit */}
        <button
          disabled={submitting}
          className="btn-primary mt-6 w-full"
          data-testid="submit-btn"
        >
          {submitting ? 'GUARDANDO...' : isEdit ? 'GUARDAR CAMBIOS' : 'CREAR NOCHE'}
        </button>
      </form>
    </Modal>
  )
}

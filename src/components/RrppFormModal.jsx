import { useEffect, useState } from 'react'
import Modal from './Modal'
import { api } from '../lib/api'

/**
 * RrppFormModal — Register a new RRPP staff member.
 * Commission is defined per-event at assignment time, not at creation.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onSuccess: () => void
 */

const EMPTY_FORM = {
  nombre: '',
  apellido: '',
  username: '',
  password: '',
  telefono: '',
}

function formatApiErrors(errorData) {
  if (!errorData) return null
  if (typeof errorData === 'string') return errorData
  if (errorData.detail) return errorData.detail
  // Field-level errors from DRF
  const messages = []
  for (const [field, errors] of Object.entries(errorData)) {
    const fieldErrors = Array.isArray(errors) ? errors.join(', ') : String(errors)
    messages.push(`${field}: ${fieldErrors}`)
  }
  return messages.join(' · ')
}

export default function RrppFormModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM)
      setApiError('')
    }
  }, [open])

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setApiError('')

    try {
      await api.post('/rrpp/', {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        username: form.username.trim(),
        password: form.password,
        telefono: form.telefono.trim() || undefined,
      })
      onSuccess()
      onClose()
    } catch (error) {
      setApiError(formatApiErrors(error.data) || error.message || 'Error al crear el RRPP.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} label="Alta RRPP">
      <form onSubmit={handleSubmit} data-testid="rrpp-form">
        <p className="eyebrow mb-3">Nuevo integrante</p>
        <h2 className="display-title pr-8 text-4xl">ALTA RRPP</h2>
        <p className="mt-3 text-sm text-gray-500 dark:text-muted">
          La comisión se define al asignar el RRPP a cada evento.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Nombre <span className="text-door-red">*</span></span>
            <input required className="field" value={form.nombre} onChange={updateField('nombre')} placeholder="NOMBRE" data-testid="rrpp-nombre" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Apellido <span className="text-door-red">*</span></span>
            <input required className="field" value={form.apellido} onChange={updateField('apellido')} placeholder="APELLIDO" data-testid="rrpp-apellido" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Usuario <span className="text-door-red">*</span></span>
            <input required className="field" value={form.username} onChange={updateField('username')} placeholder="usuario_rrpp" autoComplete="off" data-testid="rrpp-username" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Contraseña <span className="text-door-red">*</span></span>
            <input required type="password" minLength={6} className="field" value={form.password} onChange={updateField('password')} placeholder="Mínimo 6 caracteres" autoComplete="new-password" data-testid="rrpp-password" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Teléfono <span className="text-gray-300 dark:text-muted/50">(opcional)</span></span>
            <input className="field" value={form.telefono} onChange={updateField('telefono')} placeholder="+54 11 2345-6789" data-testid="rrpp-telefono" />
          </label>
        </div>

        {apiError && (
          <p className="mt-4 border border-door-red/50 bg-door-red/10 p-3 text-xs text-door-red" data-testid="rrpp-api-error">
            {apiError}
          </p>
        )}

        <button disabled={submitting} className="btn-primary mt-6 w-full" data-testid="rrpp-submit-btn">
          {submitting ? 'CREANDO...' : 'CREAR RRPP'}
        </button>
      </form>
    </Modal>
  )
}

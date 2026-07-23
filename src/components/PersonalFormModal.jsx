import { useEffect, useState } from 'react'
import Modal from './Modal'
import { api } from '../lib/api'

const EMPTY_FORM = { nombre: '', apellido: '', username: '', password: '', rol: 'rrpp' }

export default function PersonalFormModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => { if (open) { setForm(EMPTY_FORM); setApiError('') } }, [open])

  const updateField = (field) => (e) => { setForm((p) => ({ ...p, [field]: e.target.value })); setApiError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setApiError('')
    try {
      await api.post('/personal/', form)
      onSuccess()
      onClose()
    } catch (error) {
      const detail = error.data?.error || error.data?.detail || error.message || 'Error al crear personal.'
      setApiError(detail)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} label="Alta Personal">
      <form onSubmit={handleSubmit} data-testid="personal-form">
        <p className="eyebrow mb-3">Nuevo integrante</p>
        <h2 className="display-title pr-8 text-4xl">CREAR PERSONAL</h2>
        <p className="mt-3 text-sm text-gray-500 dark:text-muted">
          Elegí el rol y completá los datos. La comisión de RRPP se define al asignar al evento.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Rol <span className="text-door-red">*</span></span>
            <select required className="field" value={form.rol} onChange={updateField('rol')}>
              <option value="rrpp">RRPP — Gestión de listas</option>
              <option value="guardia">Guardia — Control de acceso</option>
              <option value="cajera">Cajera — Cobro en puerta</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Nombre <span className="text-door-red">*</span></span>
            <input required className="field" value={form.nombre} onChange={updateField('nombre')} placeholder="NOMBRE" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Apellido <span className="text-door-red">*</span></span>
            <input required className="field" value={form.apellido} onChange={updateField('apellido')} placeholder="APELLIDO" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Usuario <span className="text-door-red">*</span></span>
            <input required className="field" value={form.username} onChange={updateField('username')} placeholder="usuario_staff" autoComplete="off" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Contraseña <span className="text-door-red">*</span></span>
            <input required type="password" minLength={6} className="field" value={form.password} onChange={updateField('password')} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </label>
        </div>

        {apiError && <p className="mt-4 border border-door-red/50 bg-door-red/10 p-3 text-xs text-door-red">{apiError}</p>}

        <button disabled={submitting} className="btn-primary mt-6 w-full">
          {submitting ? 'CREANDO...' : 'CREAR PERSONAL'}
        </button>
      </form>
    </Modal>
  )
}

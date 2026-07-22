import { useEffect, useState } from 'react'
import Modal from './Modal'
import { api } from '../lib/api'

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  username: '',
  password: '',
  email: '',
  telefono: '',
}

export default function OrganizadorFormModal({ open, onClose, onSuccess }) {
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
      await api.post('/admin/organizadores/', {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim(),
        telefono: form.telefono.trim(),
      })
      onSuccess()
      onClose()
    } catch (error) {
      const data = error.data
      if (data && typeof data === 'object' && !data.detail) {
        const msgs = Object.values(data).flat().join(' ')
        setApiError(msgs || 'Error al crear el organizador.')
      } else {
        setApiError(data?.detail || error.message || 'Error al crear el organizador.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} label="Alta Organizador">
      <form onSubmit={handleSubmit} data-testid="organizador-form">
        <p className="eyebrow mb-3">Nuevo organizador</p>
        <h2 className="display-title pr-8 text-4xl">ALTA DUEÑO</h2>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Nombre</span>
            <input required className="field" value={form.first_name} onChange={updateField('first_name')} placeholder="NOMBRE" data-testid="org-nombre" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Apellido</span>
            <input required className="field" value={form.last_name} onChange={updateField('last_name')} placeholder="APELLIDO" data-testid="org-apellido" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Usuario</span>
            <input required className="field" value={form.username} onChange={updateField('username')} placeholder="usuario_dueno" autoComplete="off" data-testid="org-username" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Contraseña</span>
            <input required type="password" minLength={8} className="field" value={form.password} onChange={updateField('password')} placeholder="Mínimo 8 caracteres" autoComplete="new-password" data-testid="org-password" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Email</span>
            <input required type="email" className="field" value={form.email} onChange={updateField('email')} placeholder="dueno@email.com" data-testid="org-email" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Teléfono</span>
            <input className="field" value={form.telefono} onChange={updateField('telefono')} placeholder="+54 11 2345-6789" data-testid="org-telefono" />
          </label>
        </div>

        {apiError && (
          <p className="mt-4 border border-door-red/50 bg-door-red/10 p-3 text-xs text-door-red" data-testid="org-api-error">
            {apiError}
          </p>
        )}

        <button disabled={submitting} className="btn-primary mt-6 w-full" data-testid="org-submit-btn">
          {submitting ? 'CREANDO...' : 'CREAR ORGANIZADOR'}
        </button>
      </form>
    </Modal>
  )
}

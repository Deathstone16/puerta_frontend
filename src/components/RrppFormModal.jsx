import { useEffect, useState } from 'react'
import Modal from './Modal'
import { api } from '../lib/api'

/**
 * RrppFormModal — Register a new RRPP staff member.
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
  tipo_comision: 'por_ingreso',
  valor_comision: '',
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
        telefono: form.telefono.trim(),
        tipo_comision: form.tipo_comision,
        valor_comision: Number(form.valor_comision),
      })
      onSuccess()
      onClose()
    } catch (error) {
      setApiError(error.data?.detail || error.message || 'Error al crear el RRPP.')
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

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Nombre</span>
            <input required className="field" value={form.nombre} onChange={updateField('nombre')} placeholder="NOMBRE" data-testid="rrpp-nombre" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Apellido</span>
            <input required className="field" value={form.apellido} onChange={updateField('apellido')} placeholder="APELLIDO" data-testid="rrpp-apellido" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Usuario</span>
            <input required className="field" value={form.username} onChange={updateField('username')} placeholder="usuario_rrpp" autoComplete="off" data-testid="rrpp-username" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Contraseña</span>
            <input required type="password" minLength={6} className="field" value={form.password} onChange={updateField('password')} placeholder="Mínimo 6 caracteres" autoComplete="new-password" data-testid="rrpp-password" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Teléfono</span>
            <input className="field" value={form.telefono} onChange={updateField('telefono')} placeholder="+54 11 2345-6789" data-testid="rrpp-telefono" />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Tipo comisión</span>
            <select className="field" value={form.tipo_comision} onChange={updateField('tipo_comision')} data-testid="rrpp-tipo-comision">
              <option value="por_ingreso">Por ingreso</option>
              <option value="fija">Fija</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Valor comisión ($)</span>
            <input required type="number" min="0" className="field" value={form.valor_comision} onChange={updateField('valor_comision')} placeholder="500" data-testid="rrpp-valor-comision" />
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

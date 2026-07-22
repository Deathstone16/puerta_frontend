import { useState } from 'react'
import Icon from './Icons'
import { api } from '../lib/api'

/**
 * MercadoPagoConnect — Shows MP connection status and triggers OAuth redirect.
 *
 * Props:
 *   mpConnected: boolean
 */

export default function MercadoPagoConnect({ mpConnected }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/boliches/mp/connect/')
      if (data?.auth_url) {
        window.location.assign(data.auth_url)
      } else {
        setError('No se recibió la URL de autorización.')
      }
    } catch (err) {
      setError(err.message || 'No se pudo iniciar la conexión con Mercado Pago.')
    } finally {
      setLoading(false)
    }
  }

  if (mpConnected) {
    return (
      <div className="flex items-center gap-2" data-testid="mp-connected">
        <span className="inline-block size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-300">
          MP Conectado
        </span>
      </div>
    )
  }

  return (
    <div data-testid="mp-disconnected">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="btn-secondary text-amber-300 border-amber-300/50 hover:border-amber-300 hover:bg-amber-300/5"
        data-testid="mp-connect-btn"
      >
        {loading ? 'Conectando...' : 'Conectar Mercado Pago'}
      </button>
      {error && (
        <p className="mt-2 font-mono text-[9px] text-door-red" data-testid="mp-error">
          {error}
        </p>
      )}
    </div>
  )
}

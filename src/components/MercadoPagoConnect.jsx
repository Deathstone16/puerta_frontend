import { useState } from 'react'
import Icon from './Icons'
import { api } from '../lib/api'

/**
 * MercadoPagoConnect — Shows MP connection status, connect button, and disconnect/change option.
 *
 * Props:
 *   mpConnected: boolean
 *   onDisconnect: () => void — callback after disconnecting to refresh parent state
 */

export default function MercadoPagoConnect({ mpConnected, onDisconnect }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

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

  const handleDisconnect = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/boliches/mp/disconnect/', {})
      setShowConfirm(false)
      if (onDisconnect) onDisconnect()
    } catch (err) {
      setError(err.message || 'No se pudo desconectar la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  if (mpConnected) {
    return (
      <div className="relative" data-testid="mp-connected">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-300">
            MP Conectado
          </span>
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="ml-1 grid size-7 place-items-center border border-white/15 text-muted transition hover:border-amber-300 hover:text-amber-300"
            aria-label="Cambiar cuenta de Mercado Pago"
            data-testid="mp-change-btn"
          >
            <Icon name="edit" size={12} />
          </button>
        </div>

        {showConfirm && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 border border-white/15 bg-void p-4 shadow-xl">
            <p className="text-xs leading-5 text-gray-300">
              ¿Desconectar tu cuenta de Mercado Pago? Podrás conectar otra después.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="flex-1 border border-door-red px-2 py-2 font-mono text-[9px] font-bold uppercase text-door-red transition hover:bg-door-red/10 disabled:opacity-40"
                data-testid="mp-disconnect-confirm"
              >
                {loading ? 'Desconectando...' : 'Desconectar'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-white/15 px-2 py-2 font-mono text-[9px] font-bold uppercase text-muted transition hover:text-white"
              >
                Cancelar
              </button>
            </div>
            {error && <p className="mt-2 font-mono text-[9px] text-door-red">{error}</p>}
          </div>
        )}
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

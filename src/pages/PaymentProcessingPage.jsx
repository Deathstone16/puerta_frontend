import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

const MAX_MS = 60_000  // REQ-4.2: reintentar hasta 60s
const POLL_MS = 2_500

export default function PaymentProcessingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = location.state?.token || new URLSearchParams(location.search).get('token') || 'demo-ticket'
  const [failed, setFailed] = useState(false)
  const startRef = useRef(Date.now())

  useEffect(() => {
    // Modo demo (sin backend): ir directo al ticket.
    if (token === 'demo-ticket') {
      const t = window.setTimeout(() => navigate(`/wallet/${token}`, { replace: true }), 1800)
      return () => window.clearTimeout(t)
    }

    let active = true
    let timer
    // REQ-4.2: polling a /wallet/<token>/ hasta que el ticket exista o venza el plazo.
    const poll = async () => {
      try {
        const data = await api.get(`/wallet/${token}/`)
        if (!active) return
        if (data && (data.estado || data.qr_code)) {
          navigate(`/wallet/${token}`, { replace: true, state: { ticket: data } })
          return
        }
      } catch {
        // Todavía no está listo (el webhook de MP puede tardar). Se reintenta.
      }
      if (!active) return
      if (Date.now() - startRef.current >= MAX_MS) {
        setFailed(true)
        return
      }
      timer = window.setTimeout(poll, POLL_MS)
    }
    poll()
    return () => { active = false; window.clearTimeout(timer) }
  }, [navigate, token])

  if (failed) {
    return (
      <section className="grid min-h-[calc(100vh-64px)] place-items-center px-4 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-8 grid size-28 place-items-center border-4 border-door-red font-display text-lg text-door-red">DEMORA</div>
          <p className="eyebrow mb-4 text-door-red">No pudimos confirmar el pago</p>
          <h1 className="display-title text-4xl sm:text-5xl">SEGUÍ ATENTO</h1>
          <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-gray-500 dark:text-muted">
            Estamos tardando más de lo normal en confirmar tu pago con Mercado Pago. Si ya pagaste,
            tu ticket puede aparecer en unos minutos. Podés reintentar o revisar tu ticket ahora.
          </p>
          <div className="mt-8 grid gap-3">
            <button
              type="button"
              onClick={() => { startRef.current = Date.now(); setFailed(false) }}
              className="btn-primary w-full"
            >
              Reintentar
            </button>
            <Link to={`/wallet/${token}`} className="btn-secondary w-full">Ver mi ticket igual</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="grid min-h-[calc(100vh-64px)] place-items-center px-4 text-center">
      <div className="relative max-w-xl"><div className="absolute left-1/2 top-1/2 -z-10 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-uv/20 blur-3xl"/><div className="mx-auto mb-8 grid size-32 animate-pulse-seal place-items-center border-4 border-strobe font-display text-xl text-strobe shadow-[8px_8px_0_#8B5CF6]">SELLANDO</div><p className="eyebrow mb-4">Mercado Pago · operación segura</p><h1 className="display-title text-5xl sm:text-7xl">PROCESANDO<br/>EL PAGO</h1><p className="mx-auto mt-5 max-w-md font-mono text-xs uppercase leading-6 text-muted">No cierres esta ventana. Estamos confirmando tu entrada y creando el acceso.</p><div className="mx-auto mt-8 h-1 w-64 overflow-hidden bg-white/10"><div className="h-full w-1/3 animate-[pulse_1s_ease-in-out_infinite] bg-strobe"/></div></div>
    </section>
  )
}

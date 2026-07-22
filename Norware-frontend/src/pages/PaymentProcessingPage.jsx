import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function PaymentProcessingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [seconds, setSeconds] = useState(3)
  const token = location.state?.token || new URLSearchParams(location.search).get('token') || 'demo-ticket'

  useEffect(() => {
    const interval = window.setInterval(() => setSeconds((current) => Math.max(0, current - 1)), 1000)
    const timeout = window.setTimeout(() => navigate(`/wallet/${token}`, { replace: true }), 3000)
    return () => { window.clearInterval(interval); window.clearTimeout(timeout) }
  }, [navigate, token])

  return (
    <section className="grid min-h-[calc(100vh-64px)] place-items-center px-4 text-center">
      <div className="relative max-w-xl"><div className="absolute left-1/2 top-1/2 -z-10 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-uv/20 blur-3xl"/><div className="mx-auto mb-8 grid size-32 animate-pulse-seal place-items-center border-4 border-strobe font-display text-xl text-strobe shadow-[8px_8px_0_#8B5CF6]">SELLANDO</div><p className="eyebrow mb-4">Mercado Pago · operación segura</p><h1 className="display-title text-5xl sm:text-7xl">PROCESANDO<br/>EL PAGO</h1><p className="mx-auto mt-5 max-w-md font-mono text-xs uppercase leading-6 text-muted">No cierres esta ventana. Estamos confirmando tu entrada y creando el acceso.</p><div className="mx-auto mt-8 h-1 w-64 overflow-hidden bg-white/10"><div className="h-full animate-[pulse_1s_ease-in-out_infinite] bg-strobe" style={{ width: `${(4 - seconds) * 33.33}%` }}/></div></div>
    </section>
  )
}

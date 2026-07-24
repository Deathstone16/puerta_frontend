import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <section className="grid min-h-[calc(100vh-64px)] place-items-center px-4 text-center"><div><p className="font-display text-8xl text-uv">404</p><h1 className="display-title mt-3 text-4xl">ESTA PUERTA NO EXISTE</h1><p className="mt-4 text-sm text-muted">Volvé a la cartelera y elegí otra noche.</p><Link to="/" className="btn-primary mt-7">Ir al inicio</Link></div></section>
}

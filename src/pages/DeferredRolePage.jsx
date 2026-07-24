import { useAuth } from '../context/AuthContext'

export default function DeferredRolePage() {
  const { session, logout } = useAuth()
  return <main className="grid min-h-screen place-items-center bg-void px-4 text-center"><div className="max-w-lg"><p className="eyebrow mb-4">Sesión iniciada · {session?.rol}</p><h1 className="display-title text-5xl sm:text-7xl">MÓDULO EN<br/>PRÓXIMA ETAPA</h1><p className="mt-5 text-sm leading-6 text-muted">La autenticación y la redirección por rol funcionan. Esta interfaz operativa quedó fuera del alcance aprobado para esta entrega.</p><button onClick={logout} className="btn-secondary mt-7">Cerrar sesión</button></div></main>
}

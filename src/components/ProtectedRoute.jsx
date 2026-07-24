import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, session, routeForRole } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles?.length && !roles.includes(session.rol)) return <Navigate to={routeForRole(session.rol)} replace />
  return <Outlet />
}

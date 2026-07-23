import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, ApiError, configureAuthProvider } from '../lib/api'

const AuthContext = createContext(null)
const SESSION_MS = 2 * 60 * 60 * 1000

const demoUsers = {
  carlos_dueno: { password: 'dueno123', rol: 'dueno', nombre: 'Carlos' },
  juan_rrpp: { password: 'rrpp123', rol: 'rrpp', nombre: 'Juan' },
  maria_guardia: { password: 'guardia123', rol: 'guardia', nombre: 'María' },
  ana_cajera: { password: 'cajera123', rol: 'cajera', nombre: 'Ana' },
  admin: { password: 'admin123', rol: 'superadmin', nombre: 'Admin' },
}

const roleRoutes = {
  dueno: '/dashboard',
  rrpp: '/rrpp',
  guardia: '/guardia',
  cajera: '/cajera',
  superadmin: '/admin',
}

const SESSION_KEY = 'puerta_session'

function loadStoredSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    // Check if session is still valid (not expired)
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

function saveSession(session) {
  try {
    if (session) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  } catch {
    // Storage not available
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadStoredSession)
  const sessionRef = useRef(session)
  useEffect(() => { sessionRef.current = session; saveSession(session) }, [session])

  const logout = useCallback(() => setSession(null), [])

  const refreshAccessToken = useCallback(async () => {
    const current = sessionRef.current
    if (!current?.refreshToken || current.isDemo) return current?.accessToken || null
    try {
      const data = await api.post('/auth/refresh/', { refresh: current.refreshToken })
      const next = { ...current, accessToken: data.access, expiresAt: Date.now() + SESSION_MS }
      setSession(next)
      sessionRef.current = next
      return data.access
    } catch {
      logout()
      return null
    }
  }, [logout])

  // Configure auth provider synchronously so child effects already have
  // getAccessToken available on first mount (avoids race condition).
  useMemo(() => {
    configureAuthProvider({
      getAccessToken: () => sessionRef.current?.accessToken || null,
      refreshAccessToken,
    })
  }, [refreshAccessToken])

  useEffect(() => {
    if (!session?.expiresAt || session.isDemo) return undefined
    const delay = Math.max(1000, session.expiresAt - Date.now() - 60_000)
    const timeout = window.setTimeout(refreshAccessToken, delay)
    return () => window.clearTimeout(timeout)
  }, [session, refreshAccessToken])

  const login = useCallback(async (username, password) => {
    try {
      const data = await api.post('/auth/login/', { username, password })
      const next = {
        accessToken: data.access,
        refreshToken: data.refresh,
        rol: data.rol,
        nombre: data.nombre,
        id: data.id,
        evento_id: data.evento_id ?? data.evento?.id ?? null,
        evento: data.evento ?? null,
        expiresAt: Date.now() + SESSION_MS,
      }
      setSession(next)
      return next
    } catch (error) {
      const demo = demoUsers[username]
      if (error instanceof ApiError && error.status === 0 && demo?.password === password) {
        const next = {
          accessToken: `demo-${username}`,
          refreshToken: null,
          rol: demo.rol,
          nombre: demo.nombre,
          id: `demo-${username}`,
          evento_id: 1,
          evento: null,
          expiresAt: Date.now() + SESSION_MS,
          isDemo: true,
        }
        setSession(next)
        return next
      }
      throw error
    }
  }, [])

  const value = useMemo(() => ({
    session,
    isAuthenticated: Boolean(session?.accessToken),
    login,
    logout,
    refreshAccessToken,
    routeForRole: (role) => roleRoutes[role] || '/',
  }), [session, login, logout, refreshAccessToken])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}

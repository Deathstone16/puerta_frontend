const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')

let authProvider = {
  getAccessToken: () => null,
  refreshAccessToken: async () => null,
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function configureAuthProvider(provider) {
  authProvider = { ...authProvider, ...provider }
}

async function parseResponse(response) {
  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  return contentType.includes('application/json') ? response.json() : response.text()
}

export async function apiRequest(path, options = {}, canRetry = true) {
  const token = authProvider.getAccessToken()
  const headers = new Headers(options.headers || {})
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...options,
      headers,
      body: options.body && !(options.body instanceof FormData) && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body,
    })
  } catch (error) {
    const networkError = new ApiError('No se pudo conectar con la API.', 0, null)
    networkError.cause = error
    throw networkError
  }

  if (response.status === 401 && canRetry && token) {
    const refreshedToken = await authProvider.refreshAccessToken()
    if (refreshedToken) return apiRequest(path, options, false)
  }

  const data = await parseResponse(response)
  if (!response.ok) {
    const message = data?.detail || data?.message || `La API respondió con estado ${response.status}.`
    throw new ApiError(message, response.status, data)
  }
  return data
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
}

export { API_URL }

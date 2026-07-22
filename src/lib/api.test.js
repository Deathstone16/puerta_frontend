import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiError } from './api'

describe('ApiError', () => {
  it('stores message, status, and data correctly', () => {
    const error = new ApiError('Not found', 404, { detail: 'Evento no encontrado' })

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Not found')
    expect(error.status).toBe(404)
    expect(error.data).toEqual({ detail: 'Evento no encontrado' })
    expect(error.name).toBe('ApiError')
  })

  it('handles status 0 for network errors', () => {
    const error = new ApiError('No se pudo conectar con la API.', 0, null)

    expect(error.status).toBe(0)
    expect(error.data).toBeNull()
    expect(error.message).toBe('No se pudo conectar con la API.')
  })

  it('handles empty data', () => {
    const error = new ApiError('Server error', 500, undefined)

    expect(error.status).toBe(500)
    expect(error.data).toBeUndefined()
  })
})

describe('apiRequest network failure', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.resetModules()
  })

  it('throws ApiError with status 0 when fetch fails', async () => {
    // Re-import to get fresh module with mocked fetch
    const { apiRequest } = await import('./api')

    await expect(apiRequest('/test/')).rejects.toMatchObject({
      status: 0,
      message: 'No se pudo conectar con la API.',
    })
  })
})

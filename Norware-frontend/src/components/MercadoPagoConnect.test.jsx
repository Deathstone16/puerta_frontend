import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MercadoPagoConnect from './MercadoPagoConnect'

vi.mock('../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

import { api } from '../lib/api'

describe('MercadoPagoConnect', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('when connected', () => {
    it('shows connected badge', () => {
      render(<MercadoPagoConnect mpConnected={true} />)

      expect(screen.getByTestId('mp-connected')).toBeInTheDocument()
      expect(screen.getByText(/mp conectado/i)).toBeInTheDocument()
    })

    it('does not show connect button', () => {
      render(<MercadoPagoConnect mpConnected={true} />)

      expect(screen.queryByTestId('mp-connect-btn')).not.toBeInTheDocument()
    })
  })

  describe('when not connected', () => {
    it('shows connect button', () => {
      render(<MercadoPagoConnect mpConnected={false} />)

      expect(screen.getByTestId('mp-disconnected')).toBeInTheDocument()
      expect(screen.getByTestId('mp-connect-btn')).toBeInTheDocument()
    })

    it('does not show connected badge', () => {
      render(<MercadoPagoConnect mpConnected={false} />)

      expect(screen.queryByTestId('mp-connected')).not.toBeInTheDocument()
    })

    it('calls API and redirects on successful connect', async () => {
      const mockAssign = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { assign: mockAssign },
        writable: true,
      })

      api.get.mockResolvedValueOnce({ auth_url: 'https://mp.com/authorize?code=123' })
      render(<MercadoPagoConnect mpConnected={false} />)

      fireEvent.click(screen.getByTestId('mp-connect-btn'))

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/boliches/mp/connect/')
        expect(mockAssign).toHaveBeenCalledWith('https://mp.com/authorize?code=123')
      })
    })

    it('shows error on API failure', async () => {
      api.get.mockRejectedValueOnce({ message: 'Conexión fallida' })
      render(<MercadoPagoConnect mpConnected={false} />)

      fireEvent.click(screen.getByTestId('mp-connect-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('mp-error')).toHaveTextContent('Conexión fallida')
      })
    })

    it('shows error when auth_url is missing', async () => {
      api.get.mockResolvedValueOnce({})
      render(<MercadoPagoConnect mpConnected={false} />)

      fireEvent.click(screen.getByTestId('mp-connect-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('mp-error')).toHaveTextContent('No se recibió la URL')
      })
    })
  })
})

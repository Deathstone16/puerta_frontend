import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AsignarRrppModal from './AsignarRrppModal'

vi.mock('../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

import { api } from '../lib/api'

const testEventos = [
  { id: 1, nombre: 'NEON PROTOCOL', fecha: '2026-08-15T23:59:00-03:00', estado: 'publicado' },
  { id: 2, nombre: 'AFTER DARK', fecha: '2026-08-22T23:30:00-03:00', estado: 'publicado' },
  { id: 3, nombre: 'RITUAL 909', fecha: '2026-08-29T23:45:00-03:00', estado: 'cancelado' },
]

const mockRrppList = [
  { id: 1, nombre: 'Lucía', apellido: 'Fernández', username: 'lucia_rrpp' },
  { id: 2, nombre: 'Matías', apellido: 'Gomez', username: 'matias_rrpp' },
]

const baseProps = { open: true, onClose: vi.fn(), eventos: testEventos }

describe('AsignarRrppModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue(mockRrppList)
  })

  it('renders modal when open', async () => {
    render(<AsignarRrppModal {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('asignar-rrpp-modal')).toBeInTheDocument()
      expect(screen.getByText('ASIGNAR RRPP')).toBeInTheDocument()
    })
  })

  it('does not render when closed', () => {
    render(<AsignarRrppModal {...baseProps} open={false} />)
    expect(screen.queryByTestId('asignar-rrpp-modal')).not.toBeInTheDocument()
  })

  it('fetches RRPP list on open', async () => {
    render(<AsignarRrppModal {...baseProps} />)

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/rrpp/')
    })
  })

  it('populates RRPP select with fetched data', async () => {
    render(<AsignarRrppModal {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('select-rrpp')).toBeInTheDocument()
    })

    const options = screen.getByTestId('select-rrpp').querySelectorAll('option')
    // Placeholder + 2 RRPP
    expect(options.length).toBe(3)
  })

  it('only shows publicado events in event select', async () => {
    render(<AsignarRrppModal {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('select-evento')).toBeInTheDocument()
    })

    const options = screen.getByTestId('select-evento').querySelectorAll('option')
    // Placeholder + 2 publicado events (RITUAL 909 is cancelado)
    expect(options.length).toBe(3)
  })

  it('submits assignment and shows links on success', async () => {
    api.post.mockResolvedValueOnce({
      asignacion_id: 10,
      links: [
        { tipo: 'lista', slug: 'lucia-neon', url: '/lista/lucia-neon' },
        { tipo: 'preventa', slug: 'lucia-neon-pre', url: '/preventa/lucia-neon-pre' },
      ],
    })

    render(<AsignarRrppModal {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('select-rrpp')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByTestId('select-rrpp'), { target: { value: '1' } })
    fireEvent.change(screen.getByTestId('select-evento'), { target: { value: '1' } })
    fireEvent.click(screen.getByTestId('asignar-submit-btn'))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/rrpp/1/asignar-evento/', { evento_id: 1 })
      expect(screen.getByTestId('links-result')).toBeInTheDocument()
      expect(screen.getByText('/lista/lucia-neon')).toBeInTheDocument()
    })
  })

  it('shows error on assignment failure', async () => {
    api.post.mockRejectedValueOnce({ data: { detail: 'Ya está asignado' } })

    render(<AsignarRrppModal {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('select-rrpp')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByTestId('select-rrpp'), { target: { value: '1' } })
    fireEvent.change(screen.getByTestId('select-evento'), { target: { value: '1' } })
    fireEvent.click(screen.getByTestId('asignar-submit-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('asignar-api-error')).toHaveTextContent('Ya está asignado')
    })
  })
})

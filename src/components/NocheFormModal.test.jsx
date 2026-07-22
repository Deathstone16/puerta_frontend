import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NocheFormModal from './NocheFormModal'

// Mock API
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

import { api } from '../lib/api'

const baseProps = {
  open: true,
  onClose: vi.fn(),
  evento: null,
  onSuccess: vi.fn(),
}

describe('NocheFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the form when open', () => {
      render(<NocheFormModal {...baseProps} />)

      expect(screen.getByTestId('noche-form')).toBeInTheDocument()
      expect(screen.getByTestId('input-nombre')).toBeInTheDocument()
      expect(screen.getByTestId('input-fecha')).toBeInTheDocument()
      expect(screen.getByTestId('input-aforo')).toBeInTheDocument()
      expect(screen.getByTestId('input-precio')).toBeInTheDocument()
      expect(screen.getByTestId('input-lineup')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<NocheFormModal {...baseProps} open={false} />)

      expect(screen.queryByTestId('noche-form')).not.toBeInTheDocument()
    })

    it('shows "NUEVA NOCHE" title in create mode', () => {
      render(<NocheFormModal {...baseProps} />)

      expect(screen.getByText('NUEVA NOCHE')).toBeInTheDocument()
    })

    it('shows event name in edit mode', () => {
      const evento = { id: 1, nombre: 'NACHT PARTY', fecha: '2026-08-15T23:59', aforo_max: 300, precio_base: 3800, line_up: ['DJ A'] }
      render(<NocheFormModal {...baseProps} evento={evento} />)

      expect(screen.getByText('NACHT PARTY')).toBeInTheDocument()
    })

    it('pre-populates form fields in edit mode', () => {
      const evento = { id: 1, nombre: 'NACHT', fecha: '2026-08-15T23:59', aforo_max: 300, precio_base: 3800, line_up: ['DJ A', 'DJ B'] }
      render(<NocheFormModal {...baseProps} evento={evento} />)

      expect(screen.getByTestId('input-nombre')).toHaveValue('NACHT')
      expect(screen.getByTestId('input-aforo')).toHaveValue(300)
      expect(screen.getByTestId('input-precio')).toHaveValue(3800)
      expect(screen.getByTestId('input-lineup')).toHaveValue('DJ A, DJ B')
    })
  })

  describe('validation', () => {
    it('prevents submission when required fields are empty', () => {
      render(<NocheFormModal {...baseProps} />)

      // The form uses HTML required attributes, so clicking submit
      // won't fire handleSubmit unless fields pass browser validation.
      // We verify the button is present and API isn't called.
      fireEvent.click(screen.getByTestId('submit-btn'))

      expect(api.post).not.toHaveBeenCalled()
      expect(api.patch).not.toHaveBeenCalled()
    })

    it('does not submit when validation fails', () => {
      render(<NocheFormModal {...baseProps} />)

      fireEvent.click(screen.getByTestId('submit-btn'))

      expect(api.post).not.toHaveBeenCalled()
      expect(api.patch).not.toHaveBeenCalled()
    })
  })

  describe('create mode submission', () => {
    it('calls POST /eventos/crear/ with correct payload', async () => {
      api.post.mockResolvedValueOnce({ id: 99 })
      render(<NocheFormModal {...baseProps} />)

      fireEvent.change(screen.getByTestId('input-nombre'), { target: { value: 'TEST EVENT' } })
      fireEvent.change(screen.getByTestId('input-fecha'), { target: { value: '2026-09-01T23:00' } })
      fireEvent.change(screen.getByTestId('input-aforo'), { target: { value: '500' } })
      fireEvent.change(screen.getByTestId('input-precio'), { target: { value: '4000' } })
      fireEvent.change(screen.getByTestId('input-lineup'), { target: { value: 'DJ X, DJ Y' } })

      fireEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/eventos/crear/', {
          nombre: 'TEST EVENT',
          fecha: '2026-09-01T23:00',
          aforo_max: 500,
          precio_base: 4000,
          line_up: ['DJ X', 'DJ Y'],
          color_pulsera: 'amarilla',
          habilitar_lista: true,
        })
      })
    })

    it('calls onSuccess and onClose after successful create', async () => {
      api.post.mockResolvedValueOnce({ id: 99 })
      render(<NocheFormModal {...baseProps} />)

      fireEvent.change(screen.getByTestId('input-nombre'), { target: { value: 'NEW' } })
      fireEvent.change(screen.getByTestId('input-fecha'), { target: { value: '2026-09-01T23:00' } })
      fireEvent.change(screen.getByTestId('input-aforo'), { target: { value: '100' } })
      fireEvent.change(screen.getByTestId('input-precio'), { target: { value: '2000' } })
      fireEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(baseProps.onSuccess).toHaveBeenCalledOnce()
        expect(baseProps.onClose).toHaveBeenCalledOnce()
      })
    })
  })

  describe('edit mode submission', () => {
    it('calls PATCH /eventos/:id/ in edit mode', async () => {
      api.patch.mockResolvedValueOnce({ id: 1 })
      const evento = { id: 1, nombre: 'OLD', fecha: '2026-08-15T23:59', aforo_max: 300, precio_base: 3800, line_up: [] }
      render(<NocheFormModal {...baseProps} evento={evento} />)

      fireEvent.change(screen.getByTestId('input-nombre'), { target: { value: 'UPDATED' } })
      fireEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith('/eventos/1/', expect.objectContaining({ nombre: 'UPDATED' }))
      })
    })
  })

  describe('error handling', () => {
    it('shows API error on 405', async () => {
      api.post.mockRejectedValueOnce({ status: 405, data: { detail: 'No modificable' } })
      render(<NocheFormModal {...baseProps} />)

      fireEvent.change(screen.getByTestId('input-nombre'), { target: { value: 'X' } })
      fireEvent.change(screen.getByTestId('input-fecha'), { target: { value: '2026-09-01T23:00' } })
      fireEvent.change(screen.getByTestId('input-aforo'), { target: { value: '100' } })
      fireEvent.change(screen.getByTestId('input-precio'), { target: { value: '2000' } })
      fireEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('api-error')).toHaveTextContent('no se puede modificar')
      })
    })
  })

  describe('price preview', () => {
    it('fetches price preview after debounce', async () => {
      api.get.mockResolvedValueOnce({ precio_base: 3800, fee_mp: 190, fee_norware: 95, precio_publicado: 4085 })
      render(<NocheFormModal {...baseProps} />)

      fireEvent.change(screen.getByTestId('input-precio'), { target: { value: '3800' } })

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/precios/calcular/?precio_base=3800')
      }, { timeout: 1000 })

      await waitFor(() => {
        expect(screen.getByTestId('price-preview')).toBeInTheDocument()
      })
    })
  })
})

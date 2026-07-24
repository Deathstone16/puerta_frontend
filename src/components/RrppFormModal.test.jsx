import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RrppFormModal from './RrppFormModal'

vi.mock('../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

import { api } from '../lib/api'

const baseProps = { open: true, onClose: vi.fn(), onSuccess: vi.fn() }

describe('RrppFormModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders form when open', () => {
    render(<RrppFormModal {...baseProps} />)
    expect(screen.getByTestId('rrpp-form')).toBeInTheDocument()
    expect(screen.getByText('ALTA RRPP')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<RrppFormModal {...baseProps} open={false} />)
    expect(screen.queryByTestId('rrpp-form')).not.toBeInTheDocument()
  })

  it('has all required fields', () => {
    render(<RrppFormModal {...baseProps} />)
    expect(screen.getByTestId('rrpp-nombre')).toBeInTheDocument()
    expect(screen.getByTestId('rrpp-apellido')).toBeInTheDocument()
    expect(screen.getByTestId('rrpp-username')).toBeInTheDocument()
    expect(screen.getByTestId('rrpp-password')).toBeInTheDocument()
    expect(screen.getByTestId('rrpp-telefono')).toBeInTheDocument()
    expect(screen.getByTestId('rrpp-tipo-comision')).toBeInTheDocument()
    expect(screen.getByTestId('rrpp-valor-comision')).toBeInTheDocument()
  })

  it('submits with correct payload', async () => {
    api.post.mockResolvedValueOnce({ id: 5 })
    render(<RrppFormModal {...baseProps} />)

    fireEvent.change(screen.getByTestId('rrpp-nombre'), { target: { value: 'Lucía' } })
    fireEvent.change(screen.getByTestId('rrpp-apellido'), { target: { value: 'Fernández' } })
    fireEvent.change(screen.getByTestId('rrpp-username'), { target: { value: 'lucia_rrpp' } })
    fireEvent.change(screen.getByTestId('rrpp-password'), { target: { value: 'pass123456' } })
    fireEvent.change(screen.getByTestId('rrpp-telefono'), { target: { value: '1155556666' } })
    fireEvent.change(screen.getByTestId('rrpp-valor-comision'), { target: { value: '500' } })

    fireEvent.click(screen.getByTestId('rrpp-submit-btn'))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/rrpp/', {
        nombre: 'Lucía',
        apellido: 'Fernández',
        username: 'lucia_rrpp',
        password: 'pass123456',
        telefono: '1155556666',
        tipo_comision: 'fijo',
        valor_comision: 500,
      })
    })
  })

  it('calls onSuccess and onClose on success', async () => {
    api.post.mockResolvedValueOnce({ id: 5 })
    render(<RrppFormModal {...baseProps} />)

    fireEvent.change(screen.getByTestId('rrpp-nombre'), { target: { value: 'A' } })
    fireEvent.change(screen.getByTestId('rrpp-apellido'), { target: { value: 'B' } })
    fireEvent.change(screen.getByTestId('rrpp-username'), { target: { value: 'ab' } })
    fireEvent.change(screen.getByTestId('rrpp-password'), { target: { value: '123456' } })
    fireEvent.change(screen.getByTestId('rrpp-valor-comision'), { target: { value: '100' } })
    fireEvent.click(screen.getByTestId('rrpp-submit-btn'))

    await waitFor(() => {
      expect(baseProps.onSuccess).toHaveBeenCalledOnce()
      expect(baseProps.onClose).toHaveBeenCalledOnce()
    })
  })

  it('shows API error on failure', async () => {
    api.post.mockRejectedValueOnce({ data: { detail: 'Username ya existe' } })
    render(<RrppFormModal {...baseProps} />)

    fireEvent.change(screen.getByTestId('rrpp-nombre'), { target: { value: 'A' } })
    fireEvent.change(screen.getByTestId('rrpp-apellido'), { target: { value: 'B' } })
    fireEvent.change(screen.getByTestId('rrpp-username'), { target: { value: 'existing' } })
    fireEvent.change(screen.getByTestId('rrpp-password'), { target: { value: '123456' } })
    fireEvent.change(screen.getByTestId('rrpp-valor-comision'), { target: { value: '100' } })
    fireEvent.click(screen.getByTestId('rrpp-submit-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('rrpp-api-error')).toHaveTextContent('Username ya existe')
    })
  })
})

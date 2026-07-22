import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NochesTab from './NochesTab'
import { mockEventos } from '../../data/dashboardMockData'

describe('NochesTab', () => {
  const defaultProps = {
    eventos: mockEventos,
    onEdit: vi.fn(),
    onCancel: vi.fn(),
    onCreate: vi.fn(),
  }

  it('renders a card for each evento', () => {
    render(<NochesTab {...defaultProps} />)

    const cards = screen.getAllByTestId('evento-card')
    expect(cards).toHaveLength(mockEventos.length)
  })

  it('displays event names', () => {
    render(<NochesTab {...defaultProps} />)

    expect(screen.getByText('NEON PROTOCOL')).toBeInTheDocument()
    expect(screen.getByText('AFTER DARK')).toBeInTheDocument()
    expect(screen.getByText('RITUAL 909')).toBeInTheDocument()
  })

  it('renders estado badge with correct styling', () => {
    render(<NochesTab {...defaultProps} />)

    const publicadas = screen.getAllByText('publicada')
    expect(publicadas).toHaveLength(2)
    expect(publicadas[0].className).toContain('text-strobe')

    const cancelada = screen.getByText('cancelada')
    expect(cancelada.className).toContain('text-door-red')
  })

  it('applies uv border for publicado events', () => {
    render(<NochesTab {...defaultProps} />)

    const cards = screen.getAllByTestId('evento-card')
    // First event is publicado
    expect(cards[0].style.borderLeftColor).toBe('rgb(139, 92, 246)')
  })

  it('applies door-red border for cancelado events', () => {
    render(<NochesTab {...defaultProps} />)

    const cards = screen.getAllByTestId('evento-card')
    // Third event (RITUAL 909) is cancelado
    expect(cards[2].style.borderLeftColor).toBe('rgb(226, 59, 90)')
  })

  it('calls onCreate when "Crear nueva noche" is clicked', () => {
    render(<NochesTab {...defaultProps} />)

    fireEvent.click(screen.getByTestId('crear-noche-btn'))
    expect(defaultProps.onCreate).toHaveBeenCalledOnce()
  })

  it('calls onEdit with evento when edit button is clicked', () => {
    render(<NochesTab {...defaultProps} />)

    const editBtns = screen.getAllByTestId('editar-btn')
    fireEvent.click(editBtns[0])
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockEventos[0])
  })

  it('calls onCancel with eventoId when cancel button is clicked', () => {
    render(<NochesTab {...defaultProps} />)

    const cancelBtns = screen.getAllByTestId('cancelar-btn')
    fireEvent.click(cancelBtns[0])
    expect(defaultProps.onCancel).toHaveBeenCalledWith(mockEventos[0].id)
  })

  it('disables cancel button for already-cancelled events', () => {
    render(<NochesTab {...defaultProps} />)

    const cancelBtns = screen.getAllByTestId('cancelar-btn')
    // Third event is cancelado
    expect(cancelBtns[2]).toBeDisabled()
  })

  it('shows empty state when no eventos', () => {
    render(<NochesTab {...defaultProps} eventos={[]} />)

    expect(screen.getByText('SIN NOCHES')).toBeInTheDocument()
    expect(screen.queryByTestId('eventos-list')).not.toBeInTheDocument()
  })
})

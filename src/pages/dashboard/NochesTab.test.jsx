import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NochesTab from './NochesTab'

vi.mock('../../components/EventoRrppAssigner', () => ({
  default: ({ eventoId, eventoNombre, onClose }) => (
    <div data-testid={`rrpp-assigner-${eventoId}`}>{eventoNombre} assigner</div>
  ),
}))

const testEventos = [
  { id: 1, nombre: 'NEON PROTOCOL', fecha: '2026-08-15T23:59:00-03:00', precio_base: 3800, precio_publicado: 4500, aforo_max: 800, estado: 'publicado', line_up: ['Cata Ferreyra', 'Lorenzo', 'NIKKA'] },
  { id: 2, nombre: 'AFTER DARK', fecha: '2026-08-22T23:30:00-03:00', precio_base: 3200, precio_publicado: 3900, aforo_max: 650, estado: 'publicado', line_up: ['Mora', 'Santi Paz'] },
  { id: 3, nombre: 'RITUAL 909', fecha: '2026-08-29T23:45:00-03:00', precio_base: 4000, precio_publicado: 4800, aforo_max: 500, estado: 'cancelado', line_up: ['VNTM', 'Juno'] },
]

describe('NochesTab', () => {
  const defaultProps = {
    eventos: testEventos,
    onEdit: vi.fn(),
    onCancel: vi.fn(),
    onCreate: vi.fn(),
  }

  it('renders a card for each evento', () => {
    render(<NochesTab {...defaultProps} />)

    const cards = screen.getAllByTestId('evento-card')
    expect(cards).toHaveLength(testEventos.length)
  })

  it('displays event names', () => {
    render(<NochesTab {...defaultProps} />)

    expect(screen.getByText('NEON PROTOCOL')).toBeInTheDocument()
    expect(screen.getByText('AFTER DARK')).toBeInTheDocument()
    expect(screen.getByText('RITUAL 909')).toBeInTheDocument()
  })

  it('renders estado badge with correct styling', () => {
    render(<NochesTab {...defaultProps} />)

    const activos = screen.getAllByText('activo')
    expect(activos).toHaveLength(2)
    expect(activos[0].className).toContain('text-strobe')

    const cancelado = screen.getByText('cancelado')
    expect(cancelado.className).toContain('text-door-red')
  })

  it('calls onCreate when "Crear evento" is clicked', () => {
    render(<NochesTab {...defaultProps} />)

    fireEvent.click(screen.getByTestId('crear-noche-btn'))
    expect(defaultProps.onCreate).toHaveBeenCalledOnce()
  })

  it('calls onEdit with evento when edit button is clicked', () => {
    render(<NochesTab {...defaultProps} />)

    const editBtns = screen.getAllByTestId('editar-btn')
    fireEvent.click(editBtns[0])
    expect(defaultProps.onEdit).toHaveBeenCalledWith(testEventos[0])
  })

  it('calls onCancel with eventoId when cancel button is clicked', () => {
    render(<NochesTab {...defaultProps} />)

    const cancelBtns = screen.getAllByTestId('cancelar-btn')
    fireEvent.click(cancelBtns[0])
    expect(defaultProps.onCancel).toHaveBeenCalledWith(testEventos[0].id)
  })

  it('disables cancel button for already-cancelled events', () => {
    render(<NochesTab {...defaultProps} />)

    const cancelBtns = screen.getAllByTestId('cancelar-btn')
    // Third event is cancelado
    expect(cancelBtns[2]).toBeDisabled()
  })

  it('shows empty state when no eventos', () => {
    render(<NochesTab {...defaultProps} eventos={[]} />)

    expect(screen.getByText('SIN EVENTOS')).toBeInTheDocument()
    expect(screen.queryByTestId('eventos-list')).not.toBeInTheDocument()
  })

  it('expands RRPP assigner when rrpp button is clicked on active event', () => {
    render(<NochesTab {...defaultProps} />)

    const rrppBtns = screen.getAllByTestId('rrpp-btn')
    fireEvent.click(rrppBtns[0])

    expect(screen.getByTestId('rrpp-assigner-1')).toBeInTheDocument()
  })

  it('does not show RRPP assigner for cancelled events when expanded', () => {
    render(<NochesTab {...defaultProps} />)

    const rrppBtns = screen.getAllByTestId('rrpp-btn')
    // Click the RRPP button on the cancelled event (index 2)
    fireEvent.click(rrppBtns[2])

    expect(screen.queryByTestId('rrpp-assigner-3')).not.toBeInTheDocument()
  })

  it('collapses RRPP assigner when same button is clicked again', () => {
    render(<NochesTab {...defaultProps} />)

    const rrppBtns = screen.getAllByTestId('rrpp-btn')
    fireEvent.click(rrppBtns[0])
    expect(screen.getByTestId('rrpp-assigner-1')).toBeInTheDocument()

    fireEvent.click(rrppBtns[0])
    expect(screen.queryByTestId('rrpp-assigner-1')).not.toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import AuditoriaRrppTab from './AuditoriaRrppTab'

vi.mock('../../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

import { api } from '../../lib/api'

const testRankingRrpp = [
  { rrpp_id: 1, nombre: 'Lucía Fernández', anotados: 28, ingresados: 21, tasa_conversion: 75, recaudado_total: 94500, comision_a_pagar: 94500, tipo_comision: 'fijo', valor_comision: 500 },
  { rrpp_id: 2, nombre: 'Matías Gomez', anotados: 15, ingresados: 12, tasa_conversion: 80, recaudado_total: 54000, comision_a_pagar: 54000, tipo_comision: 'fijo', valor_comision: 500 },
  { rrpp_id: 3, nombre: 'Valentina Cruz', anotados: 42, ingresados: 38, tasa_conversion: 90, recaudado_total: 171000, comision_a_pagar: 171000, tipo_comision: 'fijo', valor_comision: 500 },
  { rrpp_id: 4, nombre: 'Bruno Díaz', anotados: 9, ingresados: 5, tasa_conversion: 56, recaudado_total: 22500, comision_a_pagar: 22500, tipo_comision: 'fijo', valor_comision: 500 },
]

const testEventos = [{ id: 1, nombre: 'Noche Electro', fecha: '2024-06-15' }]

const baseProps = {
  eventos: testEventos,
  onCreateRrpp: vi.fn(),
  onAsignarRrpp: vi.fn(),
}

describe('AuditoriaRrppTab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches ranking data for the given eventoId', async () => {
    api.get.mockResolvedValueOnce(testRankingRrpp)
    render(<AuditoriaRrppTab {...baseProps} />)

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/dashboard/ranking-rrpp/1/')
    })
  })

  it('renders a row for each RRPP', async () => {
    api.get.mockResolvedValueOnce(testRankingRrpp)
    render(<AuditoriaRrppTab {...baseProps} />)

    await waitFor(() => {
      const rows = screen.getAllByTestId('ranking-row')
      expect(rows).toHaveLength(testRankingRrpp.length)
    })
  })

  it('sorts rows by comision_a_pagar descending', async () => {
    api.get.mockResolvedValueOnce(testRankingRrpp)
    render(<AuditoriaRrppTab {...baseProps} />)

    await waitFor(() => {
      const rows = screen.getAllByTestId('ranking-row')
      // Valentina (171000) should be first, Bruno (22500) last
      expect(rows[0]).toHaveTextContent('Valentina Cruz')
      expect(rows[rows.length - 1]).toHaveTextContent('Bruno Díaz')
    })
  })

  it('applies green color for tasa_conversion >= 70', async () => {
    api.get.mockResolvedValueOnce([{ rrpp_id: 1, nombre: 'High', anotados: 10, ingresados: 8, tasa_conversion: 80, comision_a_pagar: 50000, tipo_comision: 'fijo', valor_comision: 500 }])
    render(<AuditoriaRrppTab {...baseProps} />)

    await waitFor(() => {
      const row = screen.getByTestId('ranking-row')
      const cells = row.querySelectorAll('td')
      // 4th cell (index 3) is effectiveness
      expect(cells[3].className).toContain('text-emerald-400')
    })
  })

  it('applies yellow color for tasa_conversion between 40-69', async () => {
    api.get.mockResolvedValueOnce([{ rrpp_id: 1, nombre: 'Mid', anotados: 10, ingresados: 5, tasa_conversion: 50, comision_a_pagar: 30000, tipo_comision: 'fijo', valor_comision: 500 }])
    render(<AuditoriaRrppTab {...baseProps} />)

    await waitFor(() => {
      const row = screen.getByTestId('ranking-row')
      const cells = row.querySelectorAll('td')
      expect(cells[3].className).toContain('text-amber-300')
    })
  })

  it('applies red color for tasa_conversion < 40', async () => {
    api.get.mockResolvedValueOnce([{ rrpp_id: 1, nombre: 'Low', anotados: 10, ingresados: 2, tasa_conversion: 20, comision_a_pagar: 10000, tipo_comision: 'fijo', valor_comision: 500 }])
    render(<AuditoriaRrppTab {...baseProps} />)

    await waitFor(() => {
      const row = screen.getByTestId('ranking-row')
      const cells = row.querySelectorAll('td')
      expect(cells[3].className).toContain('text-door-red')
    })
  })

  it('renders totals row', async () => {
    api.get.mockResolvedValueOnce(testRankingRrpp)
    render(<AuditoriaRrppTab {...baseProps} />)

    await waitFor(() => {
      const totalsRow = screen.getByTestId('totals-row')
      expect(totalsRow).toBeInTheDocument()
      // Sum of anotados: 28+15+42+9 = 94
      expect(totalsRow).toHaveTextContent('94')
    })
  })

  it('shows empty state when no data', async () => {
    api.get.mockResolvedValueOnce([])
    render(<AuditoriaRrppTab {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('SIN RRPP ASIGNADOS')).toBeInTheDocument()
    })
  })

  it('shows empty state on network error', async () => {
    api.get.mockRejectedValueOnce({ status: 0 })
    render(<AuditoriaRrppTab {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })

  it('renders Alta RRPP and Asignar RRPP buttons', async () => {
    api.get.mockResolvedValueOnce(testRankingRrpp)
    render(<AuditoriaRrppTab {...baseProps} />)

    expect(screen.getByTestId('btn-alta-rrpp')).toBeInTheDocument()
    expect(screen.getByTestId('btn-asignar-rrpp')).toBeInTheDocument()
  })

  it('calls onCreateRrpp when Alta RRPP is clicked', () => {
    api.get.mockResolvedValueOnce(testRankingRrpp)
    render(<AuditoriaRrppTab {...baseProps} />)

    fireEvent.click(screen.getByTestId('btn-alta-rrpp'))
    expect(baseProps.onCreateRrpp).toHaveBeenCalledOnce()
  })

  it('calls onAsignarRrpp when Asignar RRPP is clicked', () => {
    api.get.mockResolvedValueOnce(testRankingRrpp)
    render(<AuditoriaRrppTab {...baseProps} />)

    fireEvent.click(screen.getByTestId('btn-asignar-rrpp'))
    expect(baseProps.onAsignarRrpp).toHaveBeenCalledOnce()
  })
})

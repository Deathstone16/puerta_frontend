import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MetricasTab from './MetricasTab'

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  }
})

vi.mock('../../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

import { api } from '../../lib/api'

const testEventos = [
  { id: 1, nombre: 'NEON PROTOCOL', fecha: '2026-08-15T23:59:00-03:00', precio_publicado: 4500, aforo_max: 800, estado: 'activo' },
  { id: 2, nombre: 'AFTER DARK', fecha: '2026-08-22T23:30:00-03:00', precio_publicado: 3900, aforo_max: 650, estado: 'activo' },
]

const testRecaudacion = {
  total_recaudado: 0,
  web: { cantidad: 0, monto_bruto: 0 },
  efectivo: { cantidad: 0, monto: 0 },
  transferencia: { cantidad: 0, monto: 0 },
}

describe('MetricasTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue(testRecaudacion)
  })

  it('renders 4 KPI cards', async () => {
    render(<MetricasTab eventos={testEventos} />)

    await waitFor(() => {
      const cards = screen.getAllByTestId('kpi-card')
      expect(cards).toHaveLength(4)
    })
  })

  it('shows empty state when no sales', async () => {
    render(<MetricasTab eventos={testEventos} />)

    await waitFor(() => {
      expect(screen.getByTestId('metricas-empty')).toBeInTheDocument()
    })
  })

  it('shows bar chart when there are sales', async () => {
    api.get.mockResolvedValue({ ...testRecaudacion, total_recaudado: 50000 })
    render(<MetricasTab eventos={testEventos} />)

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  it('fetches recaudacion for each event', async () => {
    render(<MetricasTab eventos={testEventos} />)

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/dashboard/recaudacion/1/')
      expect(api.get).toHaveBeenCalledWith('/dashboard/recaudacion/2/')
    })
  })

  it('handles empty eventos gracefully', () => {
    render(<MetricasTab eventos={[]} />)

    const cards = screen.getAllByTestId('kpi-card')
    expect(cards).toHaveLength(4)
    expect(screen.getByTestId('metricas-empty')).toBeInTheDocument()
  })

  it('renders event selector with "Todas las noches" option', () => {
    render(<MetricasTab eventos={testEventos} />)

    const select = screen.getByTestId('metricas-event-select')
    expect(select).toBeInTheDocument()
    expect(select.querySelector('option[value="todos"]')).toBeInTheDocument()
  })
})

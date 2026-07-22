import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MetricasTab from './MetricasTab'
import { mockEventos, mockRecaudacion } from '../../data/dashboardMockData'

// Mock recharts ResponsiveContainer since it needs DOM measurements
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  }
})

describe('MetricasTab', () => {
  it('renders 4 KPI cards', () => {
    render(<MetricasTab eventos={mockEventos} recaudacion={mockRecaudacion} />)

    const cards = screen.getAllByTestId('kpi-card')
    expect(cards).toHaveLength(4)
  })

  it('computes and displays recaudación total from recaudacion data', () => {
    render(<MetricasTab eventos={mockEventos} recaudacion={mockRecaudacion} />)

    // mockRecaudacion.total_recaudado = 2007000
    expect(screen.getByText(/2\.007\.000/)).toBeInTheDocument()
  })

  it('displays number of noches from eventos array', () => {
    render(<MetricasTab eventos={mockEventos} recaudacion={mockRecaudacion} />)

    // mockEventos has 3 events
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('displays vendidas count from recaudacion breakdown', () => {
    render(<MetricasTab eventos={mockEventos} recaudacion={mockRecaudacion} />)

    // web: 312 + efectivo: 89 + transferencia: 45 = 446
    expect(screen.getByText('446')).toBeInTheDocument()
  })

  it('renders bar chart container', () => {
    render(<MetricasTab eventos={mockEventos} recaudacion={mockRecaudacion} />)

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders line chart container', () => {
    render(<MetricasTab eventos={mockEventos} recaudacion={mockRecaudacion} />)

    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('handles null recaudacion gracefully', () => {
    render(<MetricasTab eventos={mockEventos} recaudacion={null} />)

    const cards = screen.getAllByTestId('kpi-card')
    expect(cards).toHaveLength(4)
    // Recaudación and Promedio show $0
    const zeros = screen.getAllByText(/\$\s*0/)
    expect(zeros.length).toBeGreaterThanOrEqual(2)
  })

  it('handles empty eventos gracefully', () => {
    render(<MetricasTab eventos={[]} recaudacion={null} />)

    const cards = screen.getAllByTestId('kpi-card')
    expect(cards).toHaveLength(4)
    // Vendidas and Noches both show 0
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(2)
  })
})

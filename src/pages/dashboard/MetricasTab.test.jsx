import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MetricasTab from './MetricasTab'

const testEventos = [
  { id: 1, nombre: 'NEON PROTOCOL', fecha: '2026-08-15T23:59:00-03:00', precio_publicado: 4500, aforo_max: 800, estado: 'publicado' },
  { id: 2, nombre: 'AFTER DARK', fecha: '2026-08-22T23:30:00-03:00', precio_publicado: 3900, aforo_max: 650, estado: 'publicado' },
  { id: 3, nombre: 'RITUAL 909', fecha: '2026-08-29T23:45:00-03:00', precio_publicado: 4800, aforo_max: 500, estado: 'cancelado' },
]

const testRecaudacion = {
  web: { cantidad: 312, monto_bruto: 1404000, comision_norware: 35100 },
  efectivo: { cantidad: 89, monto: 400500 },
  transferencia: { cantidad: 45, monto: 202500 },
  total_recaudado: 2007000,
  comision_norware_web: 35100,
}

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
    render(<MetricasTab eventos={testEventos} recaudacion={testRecaudacion} />)

    const cards = screen.getAllByTestId('kpi-card')
    expect(cards).toHaveLength(4)
  })

  it('computes and displays recaudación total from recaudacion data', () => {
    render(<MetricasTab eventos={testEventos} recaudacion={testRecaudacion} />)

    // testRecaudacion.total_recaudado = 2007000
    expect(screen.getByText(/2\.007\.000/)).toBeInTheDocument()
  })

  it('displays number of noches from eventos array', () => {
    render(<MetricasTab eventos={testEventos} recaudacion={testRecaudacion} />)

    // testEventos has 3 events
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('displays vendidas count from recaudacion breakdown', () => {
    render(<MetricasTab eventos={testEventos} recaudacion={testRecaudacion} />)

    // web: 312 + efectivo: 89 + transferencia: 45 = 446
    expect(screen.getByText('446')).toBeInTheDocument()
  })

  it('renders bar chart container', () => {
    render(<MetricasTab eventos={testEventos} recaudacion={testRecaudacion} />)

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders line chart container', () => {
    render(<MetricasTab eventos={testEventos} recaudacion={testRecaudacion} />)

    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('handles null recaudacion gracefully', () => {
    render(<MetricasTab eventos={testEventos} recaudacion={null} />)

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

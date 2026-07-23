import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider } from '../../context/ThemeContext'
import MetricasTab from './MetricasTab'

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  }
})

vi.mock('../../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
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

function renderMetricas(props = {}) {
  return render(
    <ThemeProvider>
      <MetricasTab eventos={testEventos} {...props} />
    </ThemeProvider>
  )
}

describe('MetricasTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Provide localStorage mock for ThemeContext
    const store = {}
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value }),
        removeItem: vi.fn((key) => { delete store[key] }),
        clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
      },
      writable: true,
    })
    api.get.mockResolvedValue(testRecaudacion)
  })

  it('renders 4 KPI cards', async () => {
    renderMetricas()

    await waitFor(() => {
      const cards = screen.getAllByTestId('kpi-card')
      expect(cards).toHaveLength(4)
    })
  })

  it('shows empty state when no sales', async () => {
    renderMetricas()

    await waitFor(() => {
      expect(screen.getByTestId('metricas-empty')).toBeInTheDocument()
    })
  })

  it('shows bar chart when there are sales', async () => {
    api.get.mockResolvedValue({ ...testRecaudacion, total_recaudado: 50000 })
    renderMetricas()

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  it('fetches recaudacion for each event', async () => {
    renderMetricas()

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/dashboard/recaudacion/1/')
      expect(api.get).toHaveBeenCalledWith('/dashboard/recaudacion/2/')
    })
  })

  it('handles empty eventos gracefully', () => {
    render(
      <ThemeProvider>
        <MetricasTab eventos={[]} />
      </ThemeProvider>
    )

    const cards = screen.getAllByTestId('kpi-card')
    expect(cards).toHaveLength(4)
    expect(screen.getByTestId('metricas-empty')).toBeInTheDocument()
  })

  it('renders event selector with "Todas las noches" option', () => {
    renderMetricas()

    const select = screen.getByTestId('metricas-event-select')
    expect(select).toBeInTheDocument()
    expect(select.querySelector('option[value="todos"]')).toBeInTheDocument()
  })
})

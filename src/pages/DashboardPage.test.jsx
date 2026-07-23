import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import DashboardPage from './DashboardPage'

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  ApiError: class extends Error {
    constructor(msg, status, data) {
      super(msg)
      this.status = status
      this.data = data
    }
  },
  configureAuthProvider: vi.fn(),
  apiRequest: vi.fn(),
  API_URL: 'http://localhost:8000/api',
}))

function renderDashboard() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tab navigation', () => {
    it('renders four tabs', () => {
      renderDashboard()

      expect(screen.getByRole('tab', { name: /métricas/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /noches/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /mis rrpp/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /auditoría rrpp/i })).toBeInTheDocument()
    })

    it('shows Métricas tab as default active', () => {
      renderDashboard()

      expect(screen.getByRole('tab', { name: /métricas/i })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByTestId('metricas-tab')).toBeInTheDocument()
    })

    it('switches to Noches tab on click', () => {
      renderDashboard()

      fireEvent.click(screen.getByRole('tab', { name: /noches/i }))

      expect(screen.getByTestId('noches-tab')).toBeInTheDocument()
      expect(screen.queryByTestId('metricas-tab')).not.toBeInTheDocument()
    })

    it('switches to Mis RRPP tab on click', () => {
      renderDashboard()

      fireEvent.click(screen.getByRole('tab', { name: /mis rrpp/i }))

      expect(screen.getByTestId('gestion-rrpp-tab')).toBeInTheDocument()
      expect(screen.queryByTestId('metricas-tab')).not.toBeInTheDocument()
    })

    it('switches to Auditoría tab on click', () => {
      renderDashboard()

      fireEvent.click(screen.getByRole('tab', { name: /auditoría rrpp/i }))

      expect(screen.getByTestId('auditoria-tab')).toBeInTheDocument()
      expect(screen.queryByTestId('metricas-tab')).not.toBeInTheDocument()
    })
  })

  describe('header elements', () => {
    it('renders the page title', () => {
      renderDashboard()

      expect(screen.getByText('MIS EVENTOS')).toBeInTheDocument()
    })

    it('renders the "Nuevo evento" button', () => {
      renderDashboard()

      expect(screen.getByRole('button', { name: /nuevo evento/i })).toBeInTheDocument()
    })
  })
})

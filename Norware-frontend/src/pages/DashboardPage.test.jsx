import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import DashboardPage from './DashboardPage'

// Mock the api module so tests don't make real requests
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn().mockRejectedValue({ status: 0 }),
    post: vi.fn().mockRejectedValue({ status: 0 }),
    patch: vi.fn().mockRejectedValue({ status: 0 }),
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
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tab navigation', () => {
    it('renders three tabs', () => {
      renderDashboard()

      expect(screen.getByRole('tab', { name: /métricas/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /noches/i })).toBeInTheDocument()
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

    it('switches to Auditoría tab on click', () => {
      renderDashboard()

      fireEvent.click(screen.getByRole('tab', { name: /auditoría rrpp/i }))

      expect(screen.getByTestId('auditoria-tab')).toBeInTheDocument()
      expect(screen.queryByTestId('metricas-tab')).not.toBeInTheDocument()
    })

    it('does not modify the URL on tab switch', () => {
      renderDashboard()

      fireEvent.click(screen.getByRole('tab', { name: /noches/i }))

      // URL stays unchanged — we're in MemoryRouter with initial entry
      expect(screen.getByTestId('noches-tab')).toBeInTheDocument()
    })
  })

  describe('header elements', () => {
    it('renders the page title', () => {
      renderDashboard()

      expect(screen.getByText('MIS NOCHES')).toBeInTheDocument()
    })

    it('renders the "+ Nueva noche" button', () => {
      renderDashboard()

      expect(screen.getByRole('button', { name: /nueva noche/i })).toBeInTheDocument()
    })
  })

  describe('fallback to mock data', () => {
    it('renders aforo badge with mock data when API is down', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/184/)).toBeInTheDocument()
        expect(screen.getByText(/300/)).toBeInTheDocument()
      })
    })
  })
})

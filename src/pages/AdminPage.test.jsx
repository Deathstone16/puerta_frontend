import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import AdminPage from './AdminPage'
import { adminMockData } from '../data/adminMockData'

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  ApiError: class extends Error {
    constructor(msg, status, data) { super(msg); this.status = status; this.data = data }
  },
  configureAuthProvider: vi.fn(),
  apiRequest: vi.fn(),
  API_URL: 'http://localhost:8000/api',
}))

import { api } from '../lib/api'

function renderAdmin() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <AdminPage />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('AdminPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders header with ADMIN branding', async () => {
    api.get.mockResolvedValueOnce(adminMockData)
    renderAdmin()

    await waitFor(() => {
      expect(screen.getByText('ADMIN NORWARE')).toBeInTheDocument()
      expect(screen.getByText('Superadmin')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    api.get.mockReturnValue(new Promise(() => {})) // never resolves
    renderAdmin()

    expect(screen.getByTestId('admin-loading')).toBeInTheDocument()
  })

  it('renders 4 KPI cards with data from API', async () => {
    api.get.mockResolvedValueOnce(adminMockData)
    renderAdmin()

    await waitFor(() => {
      const cards = screen.getAllByTestId('kpi-card')
      expect(cards).toHaveLength(4)
    })
  })

  it('displays correct KPI values', async () => {
    api.get.mockResolvedValueOnce(adminMockData)
    renderAdmin()

    await waitFor(() => {
      // entradas_web_total = 3420
      expect(screen.getByText('3.420')).toBeInTheDocument()
      // eventos_activos = 4
      expect(screen.getByText('4')).toBeInTheDocument()
      // eventos_cancelados = 1
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('renders events table with rows', async () => {
    api.get.mockResolvedValueOnce(adminMockData)
    renderAdmin()

    await waitFor(() => {
      const rows = screen.getAllByTestId('admin-event-row')
      expect(rows).toHaveLength(adminMockData.por_evento.length)
    })
  })

  it('renders estado badges with correct colors', async () => {
    api.get.mockResolvedValueOnce(adminMockData)
    renderAdmin()

    await waitFor(() => {
      const badges = screen.getAllByTestId('estado-badge')
      const publicados = badges.filter((b) => b.textContent === 'publicado')
      const cancelados = badges.filter((b) => b.textContent === 'cancelado')

      publicados.forEach((b) => expect(b.className).toContain('text-strobe'))
      cancelados.forEach((b) => expect(b.className).toContain('text-door-red'))
    })
  })

  it('table container has overflow-x-auto for mobile', async () => {
    api.get.mockResolvedValueOnce(adminMockData)
    renderAdmin()

    await waitFor(() => {
      expect(screen.getByTestId('admin-table-container').className).toContain('overflow-x-auto')
    })
  })

  it('falls back to mock data when API fails', async () => {
    api.get.mockRejectedValueOnce({ status: 0 })
    renderAdmin()

    await waitFor(() => {
      const rows = screen.getAllByTestId('admin-event-row')
      expect(rows).toHaveLength(adminMockData.por_evento.length)
    })
  })

  it('renders logout button', async () => {
    api.get.mockResolvedValueOnce(adminMockData)
    renderAdmin()

    await waitFor(() => {
      expect(screen.getByTestId('admin-logout')).toBeInTheDocument()
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import AdminPage from './AdminPage'

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class extends Error {
    constructor(msg, status, data) { super(msg); this.status = status; this.data = data }
  },
  configureAuthProvider: vi.fn(),
  apiRequest: vi.fn(),
  API_URL: 'http://localhost:8000/api',
}))

import { api } from '../lib/api'

const testAdminData = {
  totales: {
    entradas_web_total: 3420,
    comision_norware_total: 684000,
    eventos_activos: 4,
    eventos_cancelados: 1,
  },
  por_evento: [
    { evento_id: 1, evento_nombre: 'NEON PROTOCOL', boliche: 'NACHT', fecha: '2026-08-15', estado: 'publicado', entradas_web: 1245, comision_norware: 249000, recaudado_total_web: 5602500 },
    { evento_id: 2, evento_nombre: 'AFTER DARK', boliche: 'HALO CLUB', fecha: '2026-08-22', estado: 'publicado', entradas_web: 890, comision_norware: 178000, recaudado_total_web: 3471000 },
    { evento_id: 3, evento_nombre: 'RITUAL 909', boliche: 'SUBSUELO', fecha: '2026-08-29', estado: 'cancelado', entradas_web: 412, comision_norware: 82400, recaudado_total_web: 1977600 },
    { evento_id: 4, evento_nombre: 'LATENCIA', boliche: 'DÓMINA', fecha: '2026-09-05', estado: 'publicado', entradas_web: 873, comision_norware: 174600, recaudado_total_web: 3666600 },
  ],
}

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
    // Mock both API calls: metricas + organizadores
    api.get.mockImplementation((path) => {
      if (path.includes('/admin/metricas')) return Promise.resolve(testAdminData)
      if (path.includes('/admin/organizadores')) return Promise.resolve([])
      return Promise.resolve(null)
    })
  })

  it('renders header with ADMIN branding', async () => {
    renderAdmin()

    await waitFor(() => {
      expect(screen.getByText('ADMIN NORDEV')).toBeInTheDocument()
      expect(screen.getByText('Superadmin')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    api.get.mockReturnValue(new Promise(() => {}))
    renderAdmin()

    expect(screen.getByTestId('admin-loading')).toBeInTheDocument()
  })

  it('renders 4 KPI cards with data from API', async () => {
    renderAdmin()

    await waitFor(() => {
      const cards = screen.getAllByTestId('kpi-card')
      expect(cards).toHaveLength(4)
    })
  })

  it('displays correct KPI values', async () => {
    renderAdmin()

    await waitFor(() => {
      expect(screen.getByText('3.420')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('renders events table with rows', async () => {
    renderAdmin()

    await waitFor(() => {
      const rows = screen.getAllByTestId('admin-event-row')
      expect(rows).toHaveLength(testAdminData.por_evento.length)
    })
  })

  it('renders estado badges with correct colors', async () => {
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
    renderAdmin()

    await waitFor(() => {
      expect(screen.getByTestId('admin-table-container').className).toContain('overflow-x-auto')
    })
  })

  it('renders logout button', async () => {
    renderAdmin()

    await waitFor(() => {
      expect(screen.getByTestId('admin-logout')).toBeInTheDocument()
    })
  })
})

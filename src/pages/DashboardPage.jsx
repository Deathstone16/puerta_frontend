import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icons'
import MercadoPagoConnect from '../components/MercadoPagoConnect'
import NocheFormModal from '../components/NocheFormModal'
import PriceBreakdownModal from '../components/PriceBreakdownModal'
import RrppFormModal from '../components/RrppFormModal'
import AsignarRrppModal from '../components/AsignarRrppModal'
import { useAuth } from '../context/AuthContext'
import { formatMoney } from '../data/mockData'
import {
  mockAforo,
  mockBoliche,
  mockEventos,
  mockRecaudacion,
} from '../data/dashboardMockData'
import { api } from '../lib/api'
import MetricasTab from './dashboard/MetricasTab'
import NochesTab from './dashboard/NochesTab'
import AuditoriaRrppTab from './dashboard/AuditoriaRrppTab'

const TABS = [
  { id: 'metricas', label: 'Métricas' },
  { id: 'noches', label: 'Noches' },
  { id: 'auditoria', label: 'Auditoría RRPP' },
]

export default function DashboardPage() {
  const { session } = useAuth()

  // --- State ---
  const [activeTab, setActiveTab] = useState('metricas')
  const [boliche, setBoliche] = useState(null)
  const [eventos, setEventos] = useState([])
  const [aforo, setAforo] = useState(null)
  const [aforoStatus, setAforoStatus] = useState('loading')
  const [recaudacion, setRecaudacion] = useState(null)
  const [modalState, setModalState] = useState({ type: null, data: null })
  const [breakdownData, setBreakdownData] = useState(null)

  // --- Data fetching: boliche + eventos on mount ---
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [b, e] = await Promise.all([
          api.get('/boliches/mio/'),
          api.get('/eventos/'),
        ])
        if (active) {
          setBoliche(b)
          setEventos(Array.isArray(e) ? e : [])
        }
      } catch (error) {
        if (active && error.status === 0) {
          setBoliche(mockBoliche)
          setEventos(mockEventos)
        }
      }
    }
    load()
    return () => { active = false }
  }, [])

  // --- Aforo polling every 4s ---
  const aforoRef = useRef({ sequence: 0, controller: null })
  const activeEventId = eventos[0]?.id

  const loadAforo = useCallback(async () => {
    if (!activeEventId) return
    const sequence = aforoRef.current.sequence + 1
    aforoRef.current.controller?.abort()
    const controller = new AbortController()
    aforoRef.current = { sequence, controller }

    try {
      const data = await api.get(`/dashboard/aforo/${activeEventId}/`, { signal: controller.signal })
      if (aforoRef.current.sequence !== sequence) return
      setAforo(data)
      setAforoStatus('live')
    } catch (error) {
      if (controller.signal.aborted || aforoRef.current.sequence !== sequence) return
      if (error.status === 0) {
        setAforo((prev) => prev || mockAforo)
        setAforoStatus('demo')
      }
    }
  }, [activeEventId])

  useEffect(() => {
    loadAforo()
    const interval = window.setInterval(loadAforo, 4000)
    return () => {
      window.clearInterval(interval)
      aforoRef.current.sequence += 1
      aforoRef.current.controller?.abort()
    }
  }, [loadAforo])

  // --- Recaudación fetch (when Métricas tab is active) ---
  useEffect(() => {
    if (activeTab !== 'metricas' || !activeEventId) return
    let active = true
    api.get(`/dashboard/recaudacion/${activeEventId}/`)
      .then((data) => { if (active) setRecaudacion(data) })
      .catch((error) => { if (active && error.status === 0) setRecaudacion(mockRecaudacion) })
    return () => { active = false }
  }, [activeTab, activeEventId])

  // --- Refresh helper after mutations ---
  const refreshEventos = useCallback(async () => {
    try {
      const e = await api.get('/eventos/')
      if (Array.isArray(e)) setEventos(e)
    } catch { /* retain current state */ }
  }, [])

  // --- Modal helpers ---
  const openModal = (type, data = null) => setModalState({ type, data })
  const closeModal = () => setModalState({ type: null, data: null })

  // --- Cancel event ---
  const handleCancel = useCallback(async (eventoId) => {
    const confirmado = window.confirm('¿Cancelar esta noche? Esta acción no se puede deshacer.')
    if (!confirmado) return
    try {
      await api.post(`/eventos/${eventoId}/cancelar/`, { motivo: 'Cancelado por dueño' })
      setEventos((prev) => prev.map((ev) =>
        ev.id === eventoId ? { ...ev, estado: 'cancelado' } : ev
      ))
    } catch (error) {
      const message = error.data?.detail || error.message || 'No se pudo cancelar el evento.'
      window.alert(message)
    }
  }, [])

  // --- Derived ---
  const occupancy = useMemo(() => {
    if (!aforo) return null
    return aforo.porcentaje ?? Math.round((aforo.ingresados / aforo.aforo_max) * 100)
  }, [aforo])

  return (
    <main className="container-page py-8 md:py-12">
      {/* --- Header --- */}
      <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-3">Sala de control</p>
          <h1 className="display-title text-5xl sm:text-7xl">MIS NOCHES</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Aforo badge */}
          {aforo && (
            <div className="flex items-center gap-2 border border-strobe/60 bg-strobe/10 px-3 py-2">
              <span className={aforoStatus === 'live' ? 'status-dot' : 'inline-block size-2 bg-gray-400 dark:bg-muted'} />
              <span className="font-mono text-xs font-bold text-strobe">
                {aforo.ingresados} / {aforo.aforo_max} ahora
              </span>
            </div>
          )}
          {/* Create button */}
          <button
            onClick={() => openModal('noche-create')}
            className="btn-primary"
          >
            <Icon name="plus" size={17} /> Nueva noche
          </button>
        </div>
      </div>

      {/* --- MP Connection widget --- */}
      {boliche && (
        <div className="mb-6">
          <MercadoPagoConnect mpConnected={boliche.mp_connected} />
        </div>
      )}

      {/* --- Tab Navigator --- */}
      <nav className="mb-8 flex gap-1 border-b border-gray-200 dark:border-white/10" aria-label="Secciones del dashboard">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-12 border-b-2 px-4 font-mono text-xs font-bold uppercase tracking-wider transition ${
              activeTab === tab.id
                ? 'border-uv text-gray-900 dark:text-paper-text'
                : 'border-transparent text-gray-400 hover:text-gray-700 dark:text-muted dark:hover:text-paper-text'
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* --- Tab Content --- */}
      {activeTab === 'metricas' && (
        <MetricasTab eventos={eventos} recaudacion={recaudacion} />
      )}
      {activeTab === 'noches' && (
        <NochesTab
          eventos={eventos}
          onEdit={(evento) => openModal('noche-edit', evento)}
          onCancel={handleCancel}
          onCreate={() => openModal('noche-create')}
        />
      )}
      {activeTab === 'auditoria' && (
        <AuditoriaRrppTab
          eventoId={activeEventId}
          onCreateRrpp={() => openModal('rrpp-create')}
          onAsignarRrpp={() => openModal('rrpp-assign')}
        />
      )}

      {/* --- Modals --- */}
      <NocheFormModal
        open={modalState.type === 'noche-create' || modalState.type === 'noche-edit'}
        onClose={closeModal}
        evento={modalState.type === 'noche-edit' ? modalState.data : null}
        bolicheId={boliche?.id}
        onSuccess={(createdData) => {
          refreshEventos()
          // Show breakdown popup after creating (not editing)
          if (modalState.type === 'noche-create' && createdData?.priceData) {
            setBreakdownData(createdData)
          }
        }}
      />
      <RrppFormModal
        open={modalState.type === 'rrpp-create'}
        onClose={closeModal}
        onSuccess={closeModal}
      />
      <AsignarRrppModal
        open={modalState.type === 'rrpp-assign'}
        onClose={closeModal}
        eventos={eventos}
      />
      <PriceBreakdownModal
        open={Boolean(breakdownData)}
        onClose={() => setBreakdownData(null)}
        priceData={breakdownData?.priceData}
        eventoNombre={breakdownData?.nombre}
      />
    </main>
  )
}

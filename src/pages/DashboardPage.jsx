import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icons'
import MercadoPagoConnect from '../components/MercadoPagoConnect'
import NocheFormModal from '../components/NocheFormModal'
import PriceBreakdownModal from '../components/PriceBreakdownModal'
import PersonalFormModal from '../components/PersonalFormModal'
import AsignarPersonalModal from '../components/AsignarPersonalModal'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import MetricasTab from './dashboard/MetricasTab'
import NochesTab from './dashboard/NochesTab'
import AuditoriaRrppTab from './dashboard/AuditoriaRrppTab'
import GestionPersonalTab from './dashboard/GestionPersonalTab'
import CierreCajaTab from './dashboard/CierreCajaTab'

const BASE_TABS = [
  { id: 'metricas', label: 'Métricas' },
  { id: 'noches', label: 'Noches' },
  { id: 'personal', label: 'Mi Personal' },
  { id: 'auditoria', label: 'Auditoría RRPP' },
]

export default function DashboardPage() {
  const { session } = useAuth()

  const [activeTab, setActiveTab] = useState('metricas')
  const [eventos, setEventos] = useState([])
  const [aforo, setAforo] = useState(null)
  const [aforoStatus, setAforoStatus] = useState('loading')
  const [boliche, setBoliche] = useState(null)
  const [staffList, setStaffList] = useState([])
  const [modalState, setModalState] = useState({ type: null, data: null })
  const [breakdownData, setBreakdownData] = useState(null)

  // Dynamic tabs: add Cierre de Caja if there's at least 1 cajera
  const hasCajera = staffList.some((s) => s.rol === 'cajera')
  const TABS = useMemo(() => {
    const tabs = [...BASE_TABS]
    if (hasCajera) tabs.push({ id: 'cierre-caja', label: 'Cierre de Caja' })
    return tabs
  }, [hasCajera])

  // Fetch eventos on mount (only mine)
  useEffect(() => {
    let active = true
    api.get('/eventos/mios/')
      .then((e) => { if (active) setEventos(Array.isArray(e) ? e : []) })
      .catch(() => { if (active) setEventos([]) })
    return () => { active = false }
  }, [])

  // Fetch boliche (for MP status)
  useEffect(() => {
    let active = true
    api.get('/boliches/mio/')
      .then((data) => { if (active) setBoliche(data) })
      .catch(() => { if (active) setBoliche(null) })
    return () => { active = false }
  }, [])

  // Fetch staff list (to check for cajeras)
  useEffect(() => {
    let active = true
    api.get('/personal/')
      .then((data) => { if (active) setStaffList(Array.isArray(data) ? data : []) })
      .catch(() => { if (active) setStaffList([]) })
    return () => { active = false }
  }, [])

  // Aforo polling
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
      setAforo(null)
      setAforoStatus('unavailable')
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

  // Refresh helpers
  const refreshEventos = useCallback(async () => {
    try {
      const e = await api.get('/eventos/mios/')
      if (Array.isArray(e)) setEventos(e)
    } catch { /* retain current */ }
  }, [])

  const refreshBoliche = useCallback(async () => {
    try {
      const data = await api.get('/boliches/mio/')
      setBoliche(data)
    } catch { setBoliche(null) }
  }, [])

  // Modal helpers
  const openModal = (type, data = null) => setModalState({ type, data })
  const closeModal = () => setModalState({ type: null, data: null })

  // Track mutations to trigger child refreshes
  const [refreshKey, setRefreshKey] = useState(0)
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  // Cancel event
  const handleCancel = useCallback(async (eventoId) => {
    const confirmado = window.confirm('¿Cancelar este evento? Esta acción no se puede deshacer.')
    if (!confirmado) return
    try {
      await api.post(`/eventos/${eventoId}/cancelar/`, { motivo: 'Cancelado por organizador' })
      setEventos((prev) => prev.map((ev) =>
        ev.id === eventoId ? { ...ev, estado: 'cancelado' } : ev
      ))
    } catch (error) {
      window.alert(error.data?.detail || error.message || 'No se pudo cancelar el evento.')
    }
  }, [])

  // Derived
  const occupancy = useMemo(() => {
    if (!aforo) return null
    return aforo.porcentaje ?? Math.round((aforo.ingresados / aforo.aforo_max) * 100)
  }, [aforo])

  return (
    <main className="container-page py-8 md:py-12">
      {/* Header */}
      <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-3">Sala de control</p>
          <h1 className="display-title text-5xl sm:text-7xl">MIS EVENTOS</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* MP Connection status */}
          <MercadoPagoConnect
            mpConnected={boliche?.mp_connected ?? false}
            onDisconnect={refreshBoliche}
          />
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
          <button onClick={() => openModal('noche-create')} className="btn-primary">
            <Icon name="plus" size={17} /> Nuevo evento
          </button>
        </div>
      </div>

      {/* Tab Navigator */}
      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-white/10" aria-label="Secciones del dashboard">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-12 whitespace-nowrap border-b-2 px-4 font-mono text-xs font-bold uppercase tracking-wider transition ${
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

      {/* Tab Content */}
      {activeTab === 'metricas' && <MetricasTab eventos={eventos} />}
      {activeTab === 'noches' && (
        <NochesTab
          eventos={eventos}
          onEdit={(evento) => openModal('noche-edit', evento)}
          onCancel={handleCancel}
          onCreate={() => openModal('noche-create')}
        />
      )}
      {activeTab === 'personal' && (
        <GestionPersonalTab
          key={refreshKey}
          onCreatePersonal={() => openModal('personal-create')}
          onAsignarPersonal={() => openModal('personal-assign')}
        />
      )}
      {activeTab === 'auditoria' && (
        <AuditoriaRrppTab
          eventos={eventos}
          onCreateRrpp={() => openModal('rrpp-create')}
          onAsignarRrpp={() => openModal('rrpp-assign')}
        />
      )}
      {activeTab === 'cierre-caja' && <CierreCajaTab eventos={eventos} />}

      {/* Modals */}
      <NocheFormModal
        open={modalState.type === 'noche-create' || modalState.type === 'noche-edit'}
        onClose={closeModal}
        evento={modalState.type === 'noche-edit' ? modalState.data : null}
        onSuccess={(createdData) => {
          refreshEventos()
          if (modalState.type === 'noche-create' && createdData?.priceData) {
            setBreakdownData(createdData)
          }
        }}
      />
      <PersonalFormModal
        open={modalState.type === 'personal-create'}
        onClose={closeModal}
        onSuccess={() => { closeModal(); triggerRefresh(); api.get('/personal/').then((d) => { if (Array.isArray(d) && d.some((s) => s.rol === 'cajera')) setStaffList(d); }).catch(() => {}) }}
      />
      <AsignarPersonalModal
        open={modalState.type === 'personal-assign'}
        onClose={() => { closeModal(); triggerRefresh() }}
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

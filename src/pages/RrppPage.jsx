import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icons'
import GuestApprovalModal from '../components/GuestApprovalModal'
import { useAuth } from '../context/AuthContext'
import { formatMoney } from '../data/mockData'
import { addDemoRrppGuest, getDemoRrppPanel } from '../data/rrppMockData'
import { api } from '../lib/api'

const EMPTY_FORM = { nombre: '', apellido: '', dni: '' }

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '')

function optionalNumber(...values) {
  const value = firstDefined(...values)
  if (value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizeGuest(guest) {
  if (!guest || typeof guest !== 'object') return null
  return {
    id: firstDefined(guest.id, guest.invitado_id, null),
    nombre: String(firstDefined(guest.nombre, guest.name, '')).trim(),
    apellido: String(firstDefined(guest.apellido, guest.last_name, guest.lastname, '')).trim(),
    dni: String(firstDefined(guest.dni, guest.documento, guest.document_number, '')).trim(),
    instagram: String(firstDefined(guest.instagram, '')).trim(),
    estado: firstDefined(guest.estado, guest.status, null),
    creado_en: firstDefined(guest.creado_en, guest.created_at, guest.fecha_alta, null),
  }
}

function normalizeRrppEvent(event, index) {
  const source = event && typeof event === 'object' ? event : {}
  const commissionSource = source.comision && typeof source.comision === 'object'
    ? source.comision
    : source.commission && typeof source.commission === 'object' ? source.commission : {}
  const slug = firstDefined(source.slug, source.lista_slug, source.link_slug)
  const suppliedLink = firstDefined(source.link_personal, source.enlace_personal, source.url_lista, source.lista_url, source.link)
  const recentSource = firstDefined(
    source.estadisticas?.invitados_recientes,
    source.invitados_recientes,
    source.ultimos_invitados,
    source.recent_guests,
    source.recent_invites,
  )

  const eventId = firstDefined(source.id, source.evento_id, source.pk, null)
  const internalKey = String(firstDefined(eventId, slug, `position-${index}`))

  return {
    id: eventId,
    _key: internalKey,
    slug: slug || null,
    nombre: firstDefined(source.nombre, source.nombre_evento, source.titulo, source.name, 'Evento sin nombre'),
    fecha: firstDefined(source.fecha, source.fecha_evento, source.fecha_inicio, source.datetime, source.date, null),
    club: firstDefined(source.club, source.venue_name, source.lugar?.nombre, typeof source.lugar === 'string' ? source.lugar : null, null),
    link_personal: suppliedLink || (slug ? `/lista/${slug}` : null),
    cupo_max: optionalNumber(source.cupo_max, source.cupo, source.limite, source.capacity),
    anotados: optionalNumber(source.anotados, source.total_anotados, source.inscriptos, source.registrados),
    ingresados: optionalNumber(source.ingresados, source.total_ingresados, source.checked_in),
    pendientes: optionalNumber(source.pendientes, source.total_pendientes, source.pending),
    rebotados: optionalNumber(source.rebotados, source.total_rebotados, source.rechazados, source.rejected),
    comision: {
      tipo: firstDefined(commissionSource.tipo, commissionSource.type, source.comision_tipo, null),
      valor: optionalNumber(commissionSource.valor, commissionSource.value, source.comision_valor),
      acumulada: optionalNumber(
        commissionSource.acumulada,
        commissionSource.total,
        commissionSource.accumulated,
        source.comision_acumulada,
        source.comision_total,
        typeof source.comision === 'number' ? source.comision : undefined,
      ),
    },
    invitados_recientes: Array.isArray(recentSource)
      ? recentSource.map(normalizeGuest).filter(Boolean)
      : [],
  }
}

function normalizePanelResponse(data) {
  const events = Array.isArray(data)
    ? data
    : Array.isArray(data?.eventos) ? data.eventos
      : Array.isArray(data?.results) ? data.results : []
  return events
    .map(normalizeRrppEvent)
    .filter((event) => event.id != null || event.slug)
}

function displayDate(value) {
  if (!value) return 'Fecha no informada'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace(',', ' ·')
}

function displayCount(value) {
  return value == null ? '—' : Number(value).toLocaleString('es-AR')
}

function errorDetail(error, fallback) {
  const detail = error?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.join(' ')
  if (detail && typeof detail === 'object') return Object.values(detail).flat().join(' ')
  return error?.message || fallback
}

function absoluteListLink(link) {
  if (!link) return ''
  if (/^https?:\/\//i.test(link)) return link
  return `${window.location.origin}${link.startsWith('/') ? link : `/${link}`}`
}

function Metric({ label, value, accent = false }) {
  return <div className="min-w-0 overflow-hidden border border-white/10 bg-void p-4"><p className="truncate font-mono text-[9px] font-bold uppercase tracking-[.14em] text-muted">{label}</p><p className={`mt-2 truncate font-display text-2xl sm:text-3xl ${accent ? 'text-strobe' : ''}`}>{value}</p></div>
}

function EventOption({ event, selected, onSelect }) {
  return <a href={`/rrpp/lista/${event.id}`} className={`block min-w-[250px] border p-4 text-left transition lg:min-w-0 lg:w-full ${selected ? 'border-strobe bg-strobe/10' : 'border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-white/10 dark:bg-floor dark:hover:border-white/30'}`}><div className="flex items-start justify-between gap-3"><p className={`font-display text-xl uppercase leading-none ${selected ? 'text-strobe' : ''}`}>{event.nombre}</p></div><p className="mt-3 font-mono text-[9px] uppercase tracking-wider text-gray-500 dark:text-muted">{displayDate(event.fecha)}</p><p className="mt-1 text-xs text-gray-500 dark:text-muted">{event.club || 'Club no informado'}</p><div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 font-mono text-[10px] uppercase dark:border-white/10"><span>Anotados</span><strong className="text-gray-900 dark:text-paper-text">{displayCount(event.anotados)} / {displayCount(event.cupo_max)}</strong></div></a>
}

export default function RrppPage() {
  const { session, logout } = useAuth()
  const requestRef = useRef({ sequence: 0, controller: null })
  const [events, setEvents] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [panelStatus, setPanelStatus] = useState('loading')
  const [panelError, setPanelError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [selectedGuest, setSelectedGuest] = useState(null)

  const loadPanel = useCallback(async () => {
    const sequence = requestRef.current.sequence + 1
    requestRef.current.controller?.abort()
    const controller = new AbortController()
    requestRef.current = { sequence, controller }

    try {
      const data = await api.get('/rrpp/mi-panel/', { signal: controller.signal })
      if (controller.signal.aborted || requestRef.current.sequence !== sequence) return
      setEvents(normalizePanelResponse(data))
      setPanelStatus('live')
      setPanelError('')
    } catch (error) {
      if (controller.signal.aborted || requestRef.current.sequence !== sequence) return
      if (session?.isDemo && error?.status === 0) {
        setEvents(normalizePanelResponse(getDemoRrppPanel()))
        setPanelStatus('demo')
        setPanelError('')
      } else {
        setPanelStatus('error')
        setPanelError(errorDetail(error, 'No pudimos actualizar los eventos asignados. Se conservan los últimos datos disponibles.'))
      }
    }
  }, [session?.isDemo])

  useEffect(() => {
    setPanelStatus('loading')
    loadPanel()
    const interval = window.setInterval(loadPanel, 4000)
    return () => {
      window.clearInterval(interval)
      requestRef.current.sequence += 1
      requestRef.current.controller?.abort()
    }
  }, [loadPanel])

  useEffect(() => {
    setSelectedId((current) => {
      if (events.some((event) => event._key === current)) return current
      return events[0]?._key ?? null
    })
  }, [events])

  const selectedEvent = useMemo(
    () => events.find((event) => event._key === selectedId) || null,
    [events, selectedId],
  )

  const capacityPercent = useMemo(() => {
    if (selectedEvent?.cupo_max == null || selectedEvent?.anotados == null || selectedEvent.cupo_max <= 0) return null
    return Math.min(100, Math.max(0, (selectedEvent.anotados / selectedEvent.cupo_max) * 100))
  }, [selectedEvent])

  const effectiveness = useMemo(() => {
    if (selectedEvent?.anotados == null || selectedEvent?.ingresados == null) return null
    if (selectedEvent.anotados === 0) return 0
    return Math.min(100, Math.max(0, Math.round((selectedEvent.ingresados / selectedEvent.anotados) * 100)))
  }, [selectedEvent])

  const chooseEvent = (eventId) => {
    setSelectedId(eventId)
    setForm(EMPTY_FORM)
    setFormError('')
    setFeedback(null)
  }

  const copyLink = async () => {
    const link = absoluteListLink(selectedEvent?.link_personal)
    if (!link) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = link
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const copied = document.execCommand('copy')
        textarea.remove()
        if (!copied) throw new Error('copy failed')
      }
      setFeedback({ type: 'success', message: 'Link copiado al portapapeles.' })
    } catch {
      setFeedback({ type: 'error', message: 'No pudimos copiar el link. Podés seleccionarlo manualmente.' })
    }
  }

  const updateForm = (field) => (event) => {
    const value = field === 'dni' ? event.target.value.replace(/\D/g, '').slice(0, 8) : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setFormError('')
    setFeedback(null)
  }

  const submitGuest = async (event) => {
    event.preventDefault()
    if (busy) return
    if (!selectedEvent?.id) {
      setFormError('Seleccioná un evento antes de anotar un invitado.')
      return
    }
    const payload = {
      slug_lista: selectedEvent.slug || selectedEvent.links?.[0]?.slug || '',
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      dni: form.dni,
    }
    if (!payload.nombre || !payload.apellido) {
      setFormError('Completá nombre y apellido.')
      return
    }
    if (!/^\d{7,8}$/.test(payload.dni)) {
      setFormError('Ingresá un DNI válido de 7 u 8 dígitos.')
      return
    }
    if (selectedEvent.cupo_max != null && selectedEvent.anotados != null && selectedEvent.anotados >= selectedEvent.cupo_max) {
      setFormError('El cupo de este evento está completo.')
      return
    }

    setBusy(true)
    setFormError('')
    setFeedback(null)
    try {
      let result
      let usedDemoFallback = false
      try {
        result = await api.post('/rrpp/anotar-invitado/', payload)
      } catch (error) {
        if (!session?.isDemo || error?.status !== 0) throw error
        result = addDemoRrppGuest(selectedEvent.id, payload)
        usedDemoFallback = true
      }

      setEvents((current) => current.map((item) => {
        if (item._key !== selectedEvent._key) return item
        if (usedDemoFallback && result?.evento) return normalizeRrppEvent(result.evento, 0)
        const returnedEvent = result?.evento && typeof result.evento === 'object'
          ? normalizeRrppEvent({ ...item, ...result.evento }, 0)
          : null
        const returnedGuest = result?.invitado && typeof result.invitado === 'object'
          ? normalizeGuest(result.invitado, 0)
          : null
        return {
          ...(returnedEvent || item),
          anotados: returnedEvent?.anotados ?? (item.anotados == null ? null : item.anotados + 1),
          invitados_recientes: returnedGuest
            ? [returnedGuest, ...(returnedEvent?.invitados_recientes || item.invitados_recientes)]
            : (returnedEvent?.invitados_recientes || item.invitados_recientes),
        }
      }))
      setForm(EMPTY_FORM)
      setFeedback({ type: 'success', message: firstDefined(result?.detail, result?.mensaje, 'Invitado anotado correctamente.') })
      await loadPanel()
    } catch (error) {
      const message = errorDetail(error, 'No pudimos anotar al invitado.')
      setFormError(message)
      setFeedback({ type: 'error', message })
    } finally {
      setBusy(false)
    }
  }

  const handleApproveGuest = async (guestId) => {
    setBusy(true)
    try {
      await api.post(`/rrpp/aprobar-invitado/${guestId}/`, {})
    } catch { /* demo mode silently succeeds */ }
    setEvents((current) => current.map((ev) => ev._key !== selectedEvent?._key ? ev : {
      ...ev,
      invitados_recientes: ev.invitados_recientes.map((g) => g.id === guestId ? { ...g, estado: 'aprobado' } : g),
    }))
    setSelectedGuest(null)
    setFeedback({ type: 'success', message: 'Invitado aprobado en la lista.' })
    setBusy(false)
  }

  const handleRejectGuest = async (guestId) => {
    setBusy(true)
    try {
      await api.post(`/rrpp/rechazar-invitado/${guestId}/`, {})
    } catch { /* demo mode silently succeeds */ }
    setEvents((current) => current.map((ev) => ev._key !== selectedEvent?._key ? ev : {
      ...ev,
      invitados_recientes: ev.invitados_recientes.map((g) => g.id === guestId ? { ...g, estado: 'rechazado' } : g),
      pendientes: (ev.pendientes ?? 1) - 1,
    }))
    setSelectedGuest(null)
    setFeedback({ type: 'success', message: 'Solicitud rechazada.' })
    setBusy(false)
  }

  const handleDeleteGuest = async (guestId) => {
    if (!window.confirm('¿Eliminar este invitado de la lista?')) return
    setBusy(true)
    try {
      await api.post(`/rrpp/eliminar-invitado/${guestId}/`, {})
    } catch { /* demo mode */ }
    setEvents((current) => current.map((ev) => ev._key !== selectedEvent?._key ? ev : {
      ...ev,
      invitados_recientes: ev.invitados_recientes.filter((g) => g.id !== guestId),
      anotados: (ev.anotados ?? 1) - 1,
    }))
    setSelectedGuest(null)
    setFeedback({ type: 'success', message: 'Invitado eliminado de la lista.' })
    setBusy(false)
  }

  const statusLabel = panelStatus === 'live' ? 'Datos en vivo' : panelStatus === 'demo' ? 'Modo demo' : panelStatus === 'loading' ? 'Cargando panel' : 'Sin conexión'
  const commissionType = selectedEvent?.comision?.tipo ? String(selectedEvent.comision.tipo).replaceAll('_', ' ') : null

  return <main className="min-h-[100dvh] bg-void bg-club-grid"><header className="sticky top-0 z-40 border-b border-white/10 bg-void/95 backdrop-blur"><div className="container-page flex min-h-20 items-center gap-3 py-3"><div className="grid size-11 shrink-0 place-items-center border border-strobe text-strobe"><Icon name="users" size={22}/></div><div className="min-w-0"><p className="font-display text-xl leading-none sm:text-2xl">PANEL RRPP</p><p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[.16em] text-muted">{session?.nombre || 'RRPP'} · Gestión de listas</p></div><div className="ml-auto hidden items-center gap-2 sm:flex"><span className={panelStatus === 'live' ? 'status-dot' : 'size-2 bg-muted'}/><span className="font-mono text-[9px] uppercase tracking-wider text-muted">{statusLabel}</span></div><button type="button" onClick={logout} className="ml-2 grid size-11 shrink-0 place-items-center border border-white/15 text-muted transition hover:border-door-red hover:text-door-red" aria-label="Cerrar sesión"><Icon name="logout" size={18}/></button></div></header>

  <div className="container-page py-5 sm:py-8"><div className="mb-5 flex items-center gap-2 sm:hidden"><span className={panelStatus === 'live' ? 'status-dot' : 'size-2 bg-muted'}/><span className="font-mono text-[9px] uppercase tracking-wider text-muted">{statusLabel}</span></div>

  {panelError && <section className="mb-5 border border-door-red/60 bg-door-red/10 p-4" role="alert"><p className="font-mono text-[10px] font-bold uppercase tracking-wider text-door-red">No se pudo cargar el panel</p><p className="mt-2 text-sm">{panelError}</p><button type="button" onClick={loadPanel} className="mt-4 min-h-11 border border-door-red px-4 font-mono text-[10px] font-bold uppercase text-door-red">Reintentar</button></section>}

  {panelStatus === 'loading' && events.length === 0 ? <section className="panel grid min-h-72 place-items-center p-8 text-center"><div><div className="mx-auto size-10 animate-spin border-2 border-white/10 border-t-strobe"/><p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-muted">Cargando eventos asignados</p></div></section> : events.length === 0 ? <section className="panel grid min-h-72 place-items-center p-8 text-center"><div><Icon name="calendar" size={38} className="mx-auto text-muted"/><h1 className="display-title mt-5 text-3xl">SIN EVENTOS ASIGNADOS</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">Tu cuenta no tiene eventos disponibles en este momento.</p></div></section> : <div className="lg:grid lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-6"><aside className="min-w-0"><div className="mb-3 flex items-center justify-between"><div><p className="eyebrow">Mis eventos</p><h1 className="display-title mt-2 text-2xl">EVENTOS ASIGNADOS</h1></div><span className="font-display text-2xl text-muted">{events.length}</span></div><div className="flex gap-3 overflow-x-auto pb-4 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-120px)] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1">{events.map((item) => <EventOption key={item._key} event={item} selected={item._key === selectedEvent?._key} onSelect={() => chooseEvent(item._key)}/>)}</div></aside>

  {selectedEvent && <div className="min-w-0"><section className="panel p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow">Evento seleccionado</p><h2 className="display-title mt-3 text-4xl sm:text-5xl">{selectedEvent.nombre}</h2><p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted">{displayDate(selectedEvent.fecha)}{selectedEvent.club ? ` · ${selectedEvent.club}` : ''}</p></div><span className={`w-fit border px-3 py-2 font-mono text-[9px] font-bold uppercase ${panelStatus === 'demo' ? 'border-amber-300 text-amber-300' : 'border-emerald-400 text-emerald-300'}`}>{panelStatus === 'demo' ? 'Datos demo' : 'Actualización 4s'}</span></div>

  <div className="mt-7 border border-white/10 bg-void p-4"><p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-muted">Tu link personal</p>{selectedEvent.link_personal ? <><p className="mt-2 break-all font-mono text-xs text-strobe">{absoluteListLink(selectedEvent.link_personal)}</p><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={copyLink} className="btn-primary px-3"><Icon name="share" size={16}/>Copiar link</button><a href={absoluteListLink(selectedEvent.link_personal)} target="_blank" rel="noreferrer" className="btn-secondary px-3"><Icon name="arrow" size={16}/>Abrir enlace</a></div></> : <p className="mt-2 text-sm text-muted">El backend no informó un link para este evento.</p>}</div>

  <div className="mt-6 flex items-end justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-wider text-muted">Cupo utilizado</p><p className="mt-1 font-display text-3xl">{displayCount(selectedEvent.anotados)} <span className="text-lg text-muted">/ {displayCount(selectedEvent.cupo_max)}</span></p></div><p className="font-display text-3xl text-strobe">{capacityPercent == null ? '—' : `${Math.round(capacityPercent)}%`}</p></div><div className="mt-3 h-2 bg-white/5"><div className="h-full bg-gradient-to-r from-uv to-strobe transition-[width] duration-500" style={{ width: `${capacityPercent || 0}%` }}/></div>

  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5"><Metric label="Anotados" value={displayCount(selectedEvent.anotados)} accent/><Metric label="Ingresados" value={displayCount(selectedEvent.ingresados)}/><Metric label="Pendientes" value={displayCount(selectedEvent.pendientes)}/><Metric label="Efectividad" value={effectiveness == null ? '—' : `${effectiveness}%`}/><Metric label="Comisión acum." value={selectedEvent.comision.acumulada == null ? '—' : formatMoney(selectedEvent.comision.acumulada)} accent/></div>{(commissionType || selectedEvent.comision.valor != null) && <p className="mt-3 overflow-hidden truncate text-right font-mono text-[9px] uppercase text-muted">Comisión: {commissionType || 'tipo no informado'}{selectedEvent.comision.valor != null ? ` · ${formatMoney(selectedEvent.comision.valor)}` : ''}</p>}
  </section>

  {feedback && <div className={`mt-5 border p-4 ${feedback.type === 'error' ? 'border-door-red/60 bg-door-red/10 text-door-red' : 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'}`} role="status" aria-live="polite"><div className="flex items-center gap-3"><Icon name={feedback.type === 'error' ? 'close' : 'check'} className="shrink-0"/><p className="text-sm font-semibold">{feedback.message}</p><button type="button" onClick={() => setFeedback(null)} className="ml-auto grid size-9 shrink-0 place-items-center border border-current/30" aria-label="Cerrar mensaje"><Icon name="close" size={14}/></button></div></div>}

  <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]"><section className="panel p-5 sm:p-7"><p className="eyebrow">Alta manual</p><h2 className="display-title mt-2 text-3xl">ANOTAR INVITADO</h2><p className="mt-3 text-sm text-muted">Se agregará a <strong className="text-paper-text">{selectedEvent.nombre}</strong>.</p><form onSubmit={submitGuest} className="mt-6 grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Nombre</span><input required maxLength={80} autoComplete="given-name" className="field" value={form.nombre} onChange={updateForm('nombre')} placeholder="NOMBRE"/></label><label className="block"><span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Apellido</span><input required maxLength={80} autoComplete="family-name" className="field" value={form.apellido} onChange={updateForm('apellido')} placeholder="APELLIDO"/></label><label className="block sm:col-span-2"><span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted">DNI</span><input required inputMode="numeric" autoComplete="off" pattern="[0-9]{7,8}" minLength={7} maxLength={8} className="field" value={form.dni} onChange={updateForm('dni')} placeholder="DNI SIN PUNTOS"/></label>{formError && <p className="border border-door-red/50 bg-door-red/10 p-3 text-sm text-door-red sm:col-span-2" role="alert">{formError}</p>}<button disabled={busy || (selectedEvent.cupo_max != null && selectedEvent.anotados != null && selectedEvent.anotados >= selectedEvent.cupo_max)} className="btn-primary mt-1 w-full sm:col-span-2">{busy ? 'ANOTANDO...' : 'ANOTAR EN ESTE EVENTO'}</button></form></section>

  <section className="panel p-5 sm:p-7"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Actividad</p><h2 className="display-title mt-2 text-3xl">LISTA COMPLETA</h2></div><span className="font-display text-2xl text-muted">{selectedEvent.invitados_recientes.length}</span></div>{selectedEvent.invitados_recientes.length > 0 ? <div className="mt-5 divide-y divide-white/10 border-y border-white/10">{selectedEvent.invitados_recientes.map((guest, guestIndex) => <button type="button" key={guest.id || `${guest.dni || 'guest'}-${guestIndex}`} onClick={() => setSelectedGuest(guest)} className="flex w-full items-center gap-3 py-4 text-left transition hover:bg-white/5"><div className="grid size-10 shrink-0 place-items-center border border-white/15 font-display text-sm text-muted">{(guest.nombre?.[0] || '?')}{guest.apellido?.[0] || ''}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{[guest.nombre, guest.apellido].filter(Boolean).join(' ') || 'Invitado'}</p><p className="mt-1 font-mono text-[9px] uppercase text-muted">{guest.dni ? `DNI ${guest.dni}` : 'DNI no informado'}{guest.instagram ? ` · @${guest.instagram}` : ''}</p></div>{guest.estado && <span className={`max-w-24 truncate border px-2 py-1 font-mono text-[8px] uppercase ${guest.estado === 'pendiente' ? 'border-amber-300 text-amber-300' : 'border-white/15 text-muted'}`}>{String(guest.estado).replaceAll('_', ' ')}</span>}</button>)}</div> : <div className="mt-5 border border-dashed border-white/15 p-6 text-center"><Icon name="users" className="mx-auto text-muted"/><p className="mt-3 text-xs leading-5 text-muted">No se informaron invitados recientes para este evento.</p></div>}</section></div>
  </div>}</div>}
  </div>
  <GuestApprovalModal
    open={Boolean(selectedGuest)}
    guest={selectedGuest}
    onClose={() => setSelectedGuest(null)}
    onApprove={handleApproveGuest}
    onReject={handleRejectGuest}
    onDelete={handleDeleteGuest}
    busy={busy}
  />
  </main>
}

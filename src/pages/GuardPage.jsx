import { useCallback, useEffect, useMemo, useState } from 'react'
import GuardQrScanner from '../components/GuardQrScanner'
import Icon from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../lib/api'

const REJECTION_REASONS = ['DNI no coincide', 'Entrada ya utilizada', 'Fuera de horario', 'Otro motivo']

function FeedbackScreen({ feedback, onClose }) {
  useEffect(() => {
    if (!feedback || feedback.type === 'error') return undefined
    const timer = window.setTimeout(onClose, 2400)
    return () => window.clearTimeout(timer)
  }, [feedback, onClose])

  if (!feedback) return null

  const styles = {
    success: { color: 'text-strobe', border: 'border-strobe', shadow: 'shadow-[10px_10px_0_#8B5CF6]', title: 'APROBADO', icon: 'check' },
    rejected: { color: 'text-door-red', border: 'border-door-red', shadow: 'shadow-[10px_10px_0_rgba(226,59,90,.28)]', title: 'REBOTADO', icon: 'close' },
    error: { color: 'text-door-red', border: 'border-door-red', shadow: 'shadow-[10px_10px_0_rgba(226,59,90,.28)]', title: 'ERROR', icon: 'close' },
  }
  const visual = styles[feedback.type]

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-white p-6 text-center dark:bg-void" role="alert" aria-live="assertive">
      <div className="w-full max-w-sm">
        <div className={`mx-auto grid size-36 place-items-center border-4 ${visual.border} ${visual.color} ${visual.shadow}`}>
          <Icon name={visual.icon} size={72} strokeWidth={2.5} />
        </div>
        <p className={`display-title mt-10 text-6xl ${visual.color}`}>{visual.title}</p>
        <p className="mt-4 font-mono text-sm font-bold uppercase leading-6 text-gray-900 dark:text-paper-text">{feedback.message}</p>
        {feedback.detail && <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-muted">{feedback.detail}</p>}
        <button type="button" onClick={onClose} className={`mt-10 min-h-16 w-full border-2 ${visual.border} font-mono text-sm font-bold uppercase tracking-wider ${visual.color}`}>Continuar</button>
      </div>
    </div>
  )
}

function RejectSheet({ attendee, busy, onCancel, onConfirm }) {
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const finalReason = reason === 'Otro motivo' ? customReason.trim() : reason

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/80" role="dialog" aria-modal="true" aria-label="Motivo del rechazo">
      <div className="mx-auto w-full max-w-[430px] border-t-2 border-door-red bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] dark:bg-floor">
        <div className="mb-5 flex items-start justify-between gap-4"><div><p className="eyebrow text-door-red">Rebotar acceso</p><h2 className="display-title mt-2 text-3xl text-gray-900 dark:text-paper-text">{attendee.nombre}</h2></div><button type="button" onClick={onCancel} className="grid size-11 shrink-0 place-items-center border border-gray-200 text-gray-500 dark:border-white/15 dark:text-muted" aria-label="Cancelar rechazo"><Icon name="close" /></button></div>
        <div className="grid grid-cols-2 gap-2">{REJECTION_REASONS.map((item) => <button type="button" key={item} onClick={() => setReason(item)} className={`min-h-16 border px-3 font-mono text-[10px] font-bold uppercase leading-4 ${reason === item ? 'border-door-red bg-door-red/15 text-door-red' : 'border-gray-200 text-gray-500 dark:border-white/15 dark:text-muted'}`}>{item}</button>)}</div>
        {reason === 'Otro motivo' && <textarea autoFocus maxLength={160} value={customReason} onChange={(event) => setCustomReason(event.target.value)} className="field mt-3 min-h-24 resize-none py-3" placeholder="ESCRIBÍ EL MOTIVO" />}
        <button type="button" disabled={!finalReason || busy} onClick={() => onConfirm(finalReason)} className="mt-4 min-h-16 w-full bg-door-red px-5 font-mono text-sm font-bold uppercase tracking-wider text-white disabled:opacity-40">{busy ? 'REGISTRANDO...' : 'CONFIRMAR REBOTE'}</button>
      </div>
    </div>
  )
}

export default function GuardPage() {
  const { session, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const eventId = session?.evento_id || session?.evento?.id
  const eventoNombre = session?.evento?.nombre || session?.evento_nombre || 'PUERTA'
  const [mode, setMode] = useState('scan')
  const [capacity, setCapacity] = useState(null)
  const [capacityOffline, setCapacityOffline] = useState(false)
  const [dni, setDni] = useState('')
  const [attendee, setAttendee] = useState(null)
  const [busy, setBusy] = useState(false)
  const [inlineError, setInlineError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [rejecting, setRejecting] = useState(false)

  const occupancy = useMemo(() => {
    if (!capacity) return 0
    if (capacity.porcentaje != null) return Math.min(Number(capacity.porcentaje), 100)
    return Math.min(Math.round((Number(capacity.ingresados || 0) / Number(capacity.aforo_max || 1)) * 100), 100)
  }, [capacity])

  const loadCapacity = useCallback(async () => {
    try {
      const data = await api.get(`/dashboard/aforo/${eventId}/`)
      setCapacity(data)
      setCapacityOffline(false)
    } catch (error) {
      if (error.status === 0) {
        setCapacityOffline(true)
      }
    }
  }, [eventId])

  useEffect(() => {
    loadCapacity()
    const interval = window.setInterval(loadCapacity, 4000)
    return () => window.clearInterval(interval)
  }, [loadCapacity])

  const identify = useCallback(async (payload) => {
    if (busy) return
    setBusy(true)
    setInlineError('')
    try {
      const result = await api.post('/puerta/guardia/escanear/', payload)
      setAttendee(result)
    } catch (error) {
      setInlineError(error.message || 'No pudimos identificar la entrada.')
    } finally {
      setBusy(false)
    }
  }, [busy])

  const handleQrScan = useCallback((qrCode) => identify({ qr_code: qrCode }), [identify])

  const handleDniSearch = (event) => {
    event.preventDefault()
    if (!/^\d{7,8}$/.test(dni)) {
      setInlineError('Ingresá un DNI válido de 7 u 8 dígitos.')
      return
    }
    identify({ dni, evento_id: eventId })
  }

  const resetIdentification = useCallback(() => {
    setFeedback(null)
    setAttendee(null)
    setRejecting(false)
    setInlineError('')
    setDni('')
  }, [])

  const executeAction = async (action, motivo = '') => {
    setBusy(true)
    try {
      const result = action === 'aprobar'
        ? await api.post(`/puerta/guardia/aprobar/${attendee.id}/`, {})
        : await api.post(`/puerta/guardia/rebotar/${attendee.id}/`, { motivo })

      if (action === 'aprobar') {
        setCapacity((current) => ({
          ...current,
          ingresados: Number(current.ingresados || 0) + 1,
          pendientes: Math.max(0, Number(current.pendientes || 0) - 1),
          porcentaje: Math.round(((Number(current.ingresados || 0) + 1) / Number(current.aforo_max || 1)) * 100),
        }))
        setFeedback({ type: 'success', message: result.mensaje || 'Ingreso registrado', detail: attendee.nombre })
      } else {
        setFeedback({ type: 'rejected', message: result.motivo || motivo, detail: attendee.nombre })
        setRejecting(false)
      }
    } catch (error) {
      setRejecting(false)
      setFeedback({ type: 'error', message: error.message || 'No pudimos registrar la acción.', detail: 'Revisá la conexión y volvé a intentar.' })
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setAttendee(null)
    setInlineError('')
    setDni('')
  }

  return (
    <main className="min-h-[100dvh] bg-white sm:py-5 dark:bg-black">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[430px] overflow-hidden bg-white sm:min-h-[calc(100dvh-40px)] sm:border sm:border-gray-200 dark:bg-void dark:sm:border-white/10">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur dark:border-white/10 dark:bg-void/95">
          <div className="flex items-center gap-3"><div className="grid size-10 place-items-center border border-uv text-uv"><Icon name="shield" size={21} /></div><div><p className="font-display text-lg leading-none text-gray-900 dark:text-paper-text">GUARDIA · {eventoNombre}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[.16em] text-gray-500 dark:text-muted">{session?.nombre} · Puerta principal</p></div><button type="button" onClick={toggleTheme} className="ml-auto grid size-10 place-items-center border border-gray-200 text-gray-500 hover:border-strobe hover:text-strobe dark:border-white/15 dark:text-muted" aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}>{isDark ? '☀️' : '🌙'}</button><button type="button" onClick={logout} className="grid size-10 place-items-center border border-gray-200 text-gray-500 hover:border-door-red hover:text-door-red dark:border-white/15 dark:text-muted" aria-label="Cerrar sesión"><Icon name="logout" size={18} /></button></div>
        </header>

        <section className="border-b border-gray-200 bg-gray-50 px-4 py-4 dark:border-white/10 dark:bg-floor" aria-label="Aforo actual">
          <div className="flex items-end justify-between"><div><div className="flex items-center gap-2"><span className="status-dot"/><p className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-gray-500 dark:text-muted">Aforo en vivo {capacityOffline && '· demo'}</p></div><p className="mt-2 font-display text-4xl text-strobe">{capacity ? capacity.ingresados : '—'}<span className="ml-2 text-xl text-gray-400 dark:text-muted">/ {capacity ? capacity.aforo_max : '—'}</span></p></div><div className="text-right"><p className="font-display text-3xl text-gray-900 dark:text-paper-text">{occupancy}%</p><p className="font-mono text-[9px] uppercase text-gray-500 dark:text-muted">{capacity ? capacity.pendientes : 0} pendientes</p></div></div>
          <div className="mt-3 h-2 bg-gray-100 dark:bg-void"><div className="h-full bg-gradient-to-r from-uv to-strobe transition-[width] duration-500" style={{ width: `${occupancy}%` }}/></div>
        </section>

        <section className="p-4 pb-[max(24px,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-2 border border-gray-200 p-1 dark:border-white/15" aria-label="Método de identificación">
            <button type="button" onClick={() => switchMode('scan')} className={`flex min-h-14 items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider ${mode === 'scan' ? 'bg-uv text-white' : 'text-gray-500 dark:text-muted'}`}><Icon name="ticket" size={17}/> Escanear QR</button>
            <button type="button" onClick={() => switchMode('dni')} className={`flex min-h-14 items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider ${mode === 'dni' ? 'bg-uv text-white' : 'text-gray-500 dark:text-muted'}`}><Icon name="search" size={17}/> Buscar en lista</button>
          </div>

          {!attendee && mode === 'scan' && <div className="mt-4"><GuardQrScanner active={!busy && mode === 'scan'} onScan={handleQrScan}/><div className="mt-4 flex items-start gap-3 border-l-2 border-strobe bg-strobe/5 p-3"><Icon name="ticket" size={18} className="mt-0.5 shrink-0 text-strobe"/><p className="font-mono text-[10px] uppercase leading-5 text-gray-500 dark:text-muted">Apuntá al QR de la entrada. La lectura es automática.</p></div></div>}

          {!attendee && mode === 'dni' && <form onSubmit={handleDniSearch} className="mt-4 border border-gray-200 bg-gray-50 p-5 dark:border-white/15 dark:bg-floor"><p className="eyebrow">Alternativa manual</p><h1 className="display-title mt-3 text-4xl text-gray-900 dark:text-paper-text">BUSCAR POR DNI</h1><p className="mt-3 text-sm leading-6 text-gray-500 dark:text-muted">Ingresá el documento sin puntos. Buscamos la entrada o la persona anotada en lista.</p><label className="mt-7 block"><span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted">DNI del asistente</span><input autoFocus inputMode="numeric" autoComplete="off" value={dni} onChange={(event) => { setDni(event.target.value.replace(/\D/g, '').slice(0, 8)); setInlineError('') }} className="field min-h-16 text-center font-mono text-xl tracking-[.12em]" placeholder="40 111 222"/></label><button disabled={busy} className="btn-primary mt-4 min-h-16 w-full">{busy ? 'BUSCANDO...' : 'BUSCAR EN LISTA'}<Icon name="search" size={18}/></button></form>}

          {busy && mode === 'scan' && !attendee && <div className="mt-4 border border-strobe/40 bg-strobe/5 p-4 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-strobe">Identificando entrada...</div>}
          {inlineError && !attendee && <div className="mt-4 border border-door-red/50 bg-door-red/10 p-4"><p className="font-mono text-xs font-bold uppercase text-door-red">No encontrado</p><p className="mt-2 text-sm leading-5 text-gray-900 dark:text-paper-text">{inlineError}</p>{mode === 'scan' && <button type="button" onClick={() => setInlineError('')} className="mt-4 min-h-12 w-full border border-door-red font-mono text-xs font-bold uppercase text-door-red">Volver a escanear</button>}</div>}

          {attendee && <article className="mt-4 border-2 border-strobe bg-gray-50 dark:bg-floor"><div className="border-b border-dashed border-gray-200 dark:border-white/20 p-5"><div className="mb-4 flex items-center justify-between"><span className="font-mono text-[9px] font-bold uppercase tracking-wider text-strobe">Resultado inmediato</span><span className={`border px-2 py-1 font-mono text-[9px] font-bold uppercase ${attendee.estado === 'pendiente' ? 'border-amber-300 text-amber-300' : 'border-door-red text-door-red'}`}>{attendee.estado}</span></div><h2 className="display-title text-4xl text-gray-900 dark:text-paper-text">{attendee.nombre}</h2><dl className="mt-5 grid grid-cols-2 gap-4 font-mono"><div><dt className="text-[9px] uppercase text-gray-500 dark:text-muted">DNI</dt><dd className="mt-1 text-sm font-bold text-gray-900 dark:text-paper-text">{attendee.dni}</dd></div><div><dt className="text-[9px] uppercase text-gray-500 dark:text-muted">Ingreso</dt><dd className="mt-1 text-sm font-bold text-gray-900 dark:text-paper-text">{attendee.tipo_ingreso}</dd></div><div className="col-span-2"><dt className="text-[9px] uppercase text-gray-500 dark:text-muted">RRPP</dt><dd className="mt-1 text-sm font-bold text-gray-900 dark:text-paper-text">{attendee.rrpp_nombre || 'Venta directa'}</dd></div></dl></div>{attendee.estado === 'pendiente' ? <div className="grid gap-3 p-4"><button type="button" disabled={busy} onClick={() => executeAction('aprobar')} className="flex min-h-20 items-center justify-center gap-3 bg-uv px-5 font-display text-2xl text-white disabled:opacity-50"><Icon name="check" size={28} strokeWidth={2.5}/> APROBAR</button><button type="button" disabled={busy} onClick={() => setRejecting(true)} className="flex min-h-20 items-center justify-center gap-3 bg-door-red px-5 font-display text-2xl text-white disabled:opacity-50"><Icon name="close" size={28} strokeWidth={2.5}/> REBOTAR</button></div> : <div className="p-4"><p className="border-l-2 border-door-red bg-door-red/10 p-3 text-sm text-door-red">Esta entrada ya tiene estado “{attendee.estado}”. No se puede aprobar nuevamente.</p><button type="button" onClick={resetIdentification} className="btn-secondary mt-3 min-h-14 w-full">Buscar otra persona</button></div>}</article>}
        </section>
      </div>
      {rejecting && attendee && <RejectSheet attendee={attendee} busy={busy} onCancel={() => setRejecting(false)} onConfirm={(motivo) => executeAction('rebotar', motivo)}/>}<FeedbackScreen feedback={feedback} onClose={resetIdentification}/>
    </main>
  )
}

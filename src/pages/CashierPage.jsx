import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CashierSaleSheet from '../components/CashierSaleSheet'
import GuardQrScanner from '../components/GuardQrScanner'
import Icon from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { formatMoney } from '../lib/format'
import { api } from '../lib/api'

const TEN_MINUTES = 10 * 60

function resolveCashierEvent(session) {
  const suppliedEvent = session?.evento && typeof session.evento === 'object' ? session.evento : {}
  const suppliedId = Number(suppliedEvent.id ?? session?.evento_id)
  const suppliedPrice = Number(suppliedEvent.precio_publicado ?? suppliedEvent.precio)

  return {
    id: Number.isFinite(suppliedId) && suppliedId > 0 ? suppliedId : null,
    club: String(suppliedEvent.club || suppliedEvent.nombre || 'CAJA'),
    precio_publicado: Number.isFinite(suppliedPrice) && suppliedPrice >= 0
      ? suppliedPrice
      : 0,
  }
}

function CashierFeedback({ feedback, canUndo, onClose, onUndo }) {
  if (!feedback) return null
  const isError = feedback.type === 'error'
  const isUndone = feedback.type === 'undone'
  const color = isError ? 'text-door-red' : isUndone ? 'text-amber-300' : 'text-strobe'
  const border = isError ? 'border-door-red' : isUndone ? 'border-amber-300' : 'border-strobe'

  return <div className="fixed inset-0 z-[100] grid place-items-center bg-void p-6 text-center" role="alert" aria-live="assertive"><div className="w-full max-w-sm"><div className={`mx-auto grid size-36 place-items-center border-4 ${border} ${color} shadow-[10px_10px_0_rgba(139,92,246,.28)]`}><Icon name={isError ? 'close' : isUndone ? 'back' : 'check'} size={72} strokeWidth={2.5}/></div><p className={`display-title mt-10 text-5xl ${color}`}>{isError ? 'ERROR' : isUndone ? 'DESHECHO' : 'OPERACIÓN OK'}</p><p className="mt-4 font-mono text-sm font-bold uppercase leading-6">{feedback.message}</p>{feedback.detail && <p className="mt-3 text-sm leading-6 text-muted">{feedback.detail}</p>}{canUndo && <button type="button" onClick={() => onUndo(feedback.transaction)} className="mt-8 min-h-14 w-full border border-amber-300 font-mono text-xs font-bold uppercase text-amber-300">Deshacer operación</button>}<button type="button" onClick={onClose} className={`mt-3 min-h-16 w-full border-2 ${border} font-mono text-sm font-bold uppercase ${color}`}>Continuar</button></div></div>
}

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export default function CashierPage() {
  const { session, logout } = useAuth()
  const cashierEvent = useMemo(() => resolveCashierEvent(session), [session])
  const eventId = cashierEvent.id
  const ticketPrice = cashierEvent.precio_publicado
  const capacityRequestRef = useRef({ sequence: 0, controller: null })
  const [capacity, setCapacity] = useState(null)
  const [capacityStatus, setCapacityStatus] = useState('loading')
  const [selected, setSelected] = useState(null)
  const [dni, setDni] = useState('')
  const [inlineError, setInlineError] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [saleOpen, setSaleOpen] = useState(false)
  const [scannerKey, setScannerKey] = useState(0)
  const [lastTransaction, setLastTransaction] = useState(null)
  const [undoRemaining, setUndoRemaining] = useState(0)
  const [cierre, setCierre] = useState(null)
  const [cierreLoading, setCierreLoading] = useState(false)

  const occupancy = useMemo(() => {
    if (!capacity) return null
    if (capacity.porcentaje != null) return Math.min(Math.max(Number(capacity.porcentaje), 0), 100)
    return Math.min(Math.max(Math.round((Number(capacity.ingresados || 0) / Number(capacity.aforo_max || 1)) * 100), 0), 100)
  }, [capacity])

  const loadCapacity = useCallback(async () => {
    const sequence = capacityRequestRef.current.sequence + 1
    capacityRequestRef.current.controller?.abort()
    const controller = new AbortController()
    capacityRequestRef.current = { sequence, controller }

    try {
      const data = await api.get(`/dashboard/aforo/${eventId}/`, { signal: controller.signal })
      if (capacityRequestRef.current.sequence !== sequence) return
      setCapacity(data)
      setCapacityStatus('live')
    } catch {
      if (controller.signal.aborted || capacityRequestRef.current.sequence !== sequence) return
      setCapacity(null)
      setCapacityStatus('unavailable')
    }
  }, [eventId])

  useEffect(() => {
    setCapacity(null)
    setCapacityStatus('loading')
    loadCapacity()
    const interval = window.setInterval(loadCapacity, 4000)
    return () => {
      window.clearInterval(interval)
      capacityRequestRef.current.sequence += 1
      capacityRequestRef.current.controller?.abort()
    }
  }, [loadCapacity])

  useEffect(() => {
    if (!lastTransaction?.createdAt) { setUndoRemaining(0); return undefined }
    const update = () => setUndoRemaining(Math.max(0, TEN_MINUTES - Math.floor((Date.now() - lastTransaction.createdAt) / 1000)))
    update()
    const interval = window.setInterval(update, 1000)
    return () => window.clearInterval(interval)
  }, [lastTransaction])

  const resetTerminal = useCallback(() => {
    setFeedback(null)
    setSelected(null)
    setDni('')
    setInlineError('')
    setScannerKey((value) => value + 1)
  }, [])

  const handleQrScan = useCallback((qrCode) => {
    // QR scan triggers API identification directly
    setSelected(null)
    setInlineError('')
    setBusy(true)
    api.post('/puerta/cajera/escanear-qr/', { qr_code: qrCode })
      .then((person) => { setSelected(person); setInlineError('') })
      .catch((error) => { setInlineError(error.message || 'QR desconocido. No se encontró una entrada válida para caja.') })
      .finally(() => setBusy(false))
  }, [])

  const searchDni = async (event) => {
    event.preventDefault()
    if (!/^\d{7,8}$/.test(dni)) {
      setInlineError('Ingresá un DNI válido de 7 u 8 dígitos.')
      return
    }
    setBusy(true)
    setInlineError('')
    try {
      const person = await api.get(`/puerta/cajera/buscar-dni/${dni}/`)
      if (!person) {
        setSelected(null)
        setInlineError('No encontramos una persona pendiente de cobro con ese DNI.')
      } else {
        setSelected(person)
        setInlineError('')
      }
    } catch (error) {
      setSelected(null)
      setInlineError(error.message || 'No encontramos una persona pendiente de cobro con ese DNI.')
    } finally {
      setBusy(false)
    }
  }

  const adjustCapacity = useCallback((delta) => {
    setCapacity((current) => {
      if (!current) return current
      const ingresados = Math.max(0, Number(current.ingresados || 0) + delta)
      return {
        ...current,
        ingresados,
        porcentaje: Math.round((ingresados / Number(current.aforo_max || 1)) * 100),
      }
    })
  }, [])

  const registerSuccess = (result, type, detail, { addedEntries = 1 } = {}) => {
    const createdItems = Array.isArray(result.creados) ? result.creados : []
    const transactionId = result.id || result.operacion_id || createdItems[0]?.id
    const transaction = transactionId ? {
      id: transactionId,
      type,
      createdAt: Date.now(),
      detail,
      addedEntries,
    } : null
    setLastTransaction(transaction)
    setUndoRemaining(transaction ? TEN_MINUTES : 0)
    adjustCapacity(addedEntries)
    setFeedback({ type: 'success', message: result.mensaje || 'Operación registrada', detail, transaction })
  }

  const submitGeneralSale = async (people) => {
    setBusy(true)
    try {
      const payload = { evento_id: eventId, personas: people }
      let result
      result = await api.post('/puerta/cajera/venta-general/', payload)
      setSaleOpen(false)
      const detail = `${people.length} entrada${people.length === 1 ? '' : 's'} · ${formatMoney(people.length * ticketPrice)}`
      registerSuccess(result, 'venta', detail, { addedEntries: people.length })
    } catch (error) {
      setSaleOpen(false)
      setFeedback({ type: 'error', message: error.message || 'No pudimos completar la venta.', detail: error.data?.detail || 'Revisá los datos e intentá otra vez.' })
    } finally { setBusy(false) }
  }

  const undoTransaction = async (transaction = lastTransaction) => {
    const remainingSeconds = transaction?.createdAt
      ? TEN_MINUTES - Math.floor((Date.now() - transaction.createdAt) / 1000)
      : 0
    if (!transaction?.id || remainingSeconds <= 0 || busy) return
    setBusy(true)
    try {
      const result = await api.post(`/puerta/cajera/deshacer/${transaction.id}/`, {})
      setLastTransaction(null)
      setUndoRemaining(0)
      setFeedback({ type: 'undone', message: result.mensaje || 'Operación deshecha', detail: transaction.detail })
      loadCapacity()
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'No pudimos deshacer la operación.', detail: 'El plazo puede haber vencido.' })
    } finally { setBusy(false) }
  }

  const loadCierre = useCallback(async () => {
    setCierreLoading(true)
    try {
      const data = await api.get('/puerta/cajera/cierre/')
      setCierre(data)
    } catch {
      setCierre(null)
    } finally {
      setCierreLoading(false)
    }
  }, [])

  useEffect(() => { loadCierre() }, [loadCierre])

  const isWeb = selected?.tipo_ingreso === 'entrada_web'
  const isList = selected?.tipo_ingreso === 'lista_rrpp'
  const canUndoFeedback = Boolean(
    feedback?.transaction?.id
    && feedback.transaction.id === lastTransaction?.id
    && undoRemaining > 0
    && !busy,
  )
  const capacityLabel = {
    loading: 'Aforo · cargando',
    live: 'Aforo en vivo',
    demo: 'Aforo · demo',
    unavailable: 'Aforo · no disponible',
  }[capacityStatus]

  return <main className="min-h-[100dvh] bg-black sm:py-5"><div className="relative mx-auto min-h-[100dvh] w-full max-w-[620px] overflow-hidden bg-void sm:min-h-[calc(100dvh-40px)] sm:border sm:border-white/10"><header className="sticky top-0 z-40 border-b border-white/10 bg-void/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center border border-strobe text-strobe"><Icon name="cash" size={21}/></div><div><p className="font-display text-lg leading-none">CAJA · {cashierEvent.club}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[.16em] text-muted">{session?.nombre} · Terminal de cobro</p></div><button type="button" onClick={logout} className="ml-auto grid size-10 place-items-center border border-white/15 text-muted" aria-label="Cerrar sesión"><Icon name="logout" size={18}/></button></div></header>

  <section className="border-b border-white/10 bg-floor px-4 py-4"><div className="flex items-end justify-between"><div><div className="flex items-center gap-2"><span className={capacityStatus === 'live' ? 'status-dot' : 'size-2 bg-muted'}/><p className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-muted">{capacityLabel}</p></div><p className="mt-2 font-display text-4xl text-strobe">{capacity ? capacity.ingresados : '—'}<span className="ml-2 text-xl text-muted">/ {capacity ? capacity.aforo_max : '—'}</span></p></div><div className="text-right"><p className="font-display text-3xl">{occupancy == null ? '—' : `${occupancy}%`}</p><p className="font-mono text-[9px] uppercase text-muted">ocupación</p></div></div><div className="mt-3 h-2 bg-void"><div className="h-full bg-gradient-to-r from-uv to-strobe transition-[width] duration-500" style={{ width: `${occupancy || 0}%` }}/></div></section>

  <div className="p-4 pb-[max(28px,env(safe-area-inset-bottom))]"><section aria-labelledby="scanner-title"><div className="mb-3 flex items-end justify-between"><div><p className="eyebrow">Identificar</p><h1 id="scanner-title" className="display-title mt-2 text-3xl">ESCANEAR ENTRADA</h1></div><span className="font-mono text-[9px] uppercase text-emerald-300">Cámara activa</span></div><GuardQrScanner key={scannerKey} active={!busy && !feedback && !saleOpen} onScan={handleQrScan}/></section>

  <form onSubmit={searchDni} className="mt-4 border border-white/15 bg-floor p-3"><label className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Buscar lista por DNI</label><div className="mt-2 flex gap-2"><input inputMode="numeric" value={dni} onChange={(event) => { setDni(event.target.value.replace(/\D/g, '').slice(0, 8)); setInlineError('') }} className="field min-h-14 flex-1 text-center text-lg tracking-wider" placeholder="38 987 654"/><button disabled={busy} className="grid min-h-14 w-16 place-items-center bg-white text-void disabled:opacity-40" aria-label="Buscar DNI"><Icon name="search" size={22}/></button></div></form>

  {inlineError && <div className="mt-4 border border-door-red/50 bg-door-red/10 p-4"><p className="font-mono text-xs font-bold uppercase text-door-red">Atención</p><p className="mt-2 text-sm leading-5">{inlineError}</p></div>}

  <section className="mt-4 min-h-40 border-2 border-white/15 bg-floor p-5" aria-live="polite">{selected ? <><div className="flex items-center justify-between"><p className="eyebrow">Resultado inmediato</p><span className={`border px-2 py-1 font-mono text-[9px] font-bold uppercase ${isWeb ? 'border-strobe text-strobe' : 'border-amber-300 text-amber-300'}`}>{isWeb ? 'Entrada web' : 'Lista RRPP'}</span></div><h2 className="display-title mt-4 text-4xl">{selected.nombre} {selected.apellido}</h2><div className="mt-5 grid grid-cols-2 gap-4 font-mono"><div><p className="text-[9px] uppercase text-muted">DNI</p><p className="mt-1 text-sm font-bold">{selected.dni}</p></div><div><p className="text-[9px] uppercase text-muted">Estado</p><p className="mt-1 text-sm font-bold">{String(selected.estado).replaceAll('_', ' ')}</p></div>{isList && <><div><p className="text-[9px] uppercase text-muted">RRPP</p><p className="mt-1 text-sm font-bold">{selected.rrpp_nombre}</p></div><div><p className="text-[9px] uppercase text-muted">A cobrar</p><p className="mt-1 text-sm font-bold text-strobe">{formatMoney(selected.monto_pago)}</p></div></>}</div></> : <div className="grid min-h-32 place-items-center text-center"><div><Icon name="ticket" size={30} className="mx-auto text-muted"/><p className="mt-3 font-mono text-[10px] uppercase leading-5 text-muted">Escaneá un QR o buscá un DNI.<br/>El resultado aparece acá.</p></div></div>}</section>

  <section className="mt-4" aria-labelledby="actions-title"><p id="actions-title" className="eyebrow mb-3">Acciones rápidas</p><button type="button" disabled={busy} onClick={() => setSaleOpen(true)} className="flex min-h-24 w-full items-center justify-center gap-3 bg-amber-300 px-3 text-void disabled:opacity-50"><Icon name="plus" size={25}/><span className="font-display text-lg">VENTA GENERAL</span></button></section>

  {lastTransaction && undoRemaining > 0 && <section className="mt-4 border border-amber-300/60 bg-amber-300/5 p-4"><div className="flex items-center gap-3"><Icon name="clock" className="shrink-0 text-amber-300"/><div className="min-w-0 flex-1"><p className="font-mono text-[9px] font-bold uppercase text-amber-300">Última operación · {formatCountdown(undoRemaining)}</p><p className="mt-1 truncate text-xs text-muted">{lastTransaction.detail}</p></div><button type="button" disabled={busy} onClick={() => undoTransaction()} className="min-h-11 border border-amber-300 px-3 font-mono text-[9px] font-bold uppercase text-amber-300 disabled:opacity-40">Deshacer</button></div></section>}

  {/* Cierre de Caja */}
  <section className="mt-6 border-t border-gray-200 pt-5 dark:border-white/10">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="eyebrow">Resumen</p>
        <h2 className="display-title mt-1 text-2xl text-gray-900 dark:text-paper-text">CIERRE DE CAJA</h2>
      </div>
      <button type="button" onClick={loadCierre} disabled={cierreLoading} className="grid size-9 place-items-center border border-gray-200 text-gray-500 hover:border-strobe hover:text-strobe dark:border-white/15 dark:text-muted" aria-label="Actualizar cierre"><Icon name="refresh" size={16} /></button>
    </div>
    {cierreLoading ? (
      <div className="grid min-h-24 place-items-center"><div className="size-6 animate-spin border-2 border-gray-200 border-t-strobe dark:border-white/10" /></div>
    ) : !cierre ? (
      <p className="text-sm text-gray-500 dark:text-muted">No se pudo cargar el cierre de caja.</p>
    ) : (
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-void">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-gray-500 dark:text-muted">Efectivo</p>
          <p className="mt-2 font-display text-2xl text-emerald-500 dark:text-emerald-300">{formatMoney(cierre.efectivo?.monto || 0)}</p>
          <p className="mt-1 font-mono text-[9px] text-gray-400 dark:text-muted">{cierre.efectivo?.cantidad || 0} entradas</p>
        </div>
        <div className="border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-void">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-gray-500 dark:text-muted">Transferencia</p>
          <p className="mt-2 font-display text-2xl text-uv">{formatMoney(cierre.transferencia?.monto || 0)}</p>
          <p className="mt-1 font-mono text-[9px] text-gray-400 dark:text-muted">{cierre.transferencia?.cantidad || 0} entradas</p>
        </div>
        <div className="border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-void">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-gray-500 dark:text-muted">Total recaudado</p>
          <p className="mt-2 font-display text-2xl text-strobe">{formatMoney(cierre.total_recaudado || 0)}</p>
          <p className="mt-1 font-mono text-[9px] text-gray-400 dark:text-muted">{(cierre.efectivo?.cantidad || 0) + (cierre.transferencia?.cantidad || 0) + (cierre.web?.cantidad || 0)} entradas totales</p>
        </div>
      </div>
    )}
  </section>

  </div></div>

  <CashierSaleSheet open={saleOpen} busy={busy} ticketPrice={ticketPrice} onClose={() => setSaleOpen(false)} onSubmit={submitGeneralSale}/><CashierFeedback feedback={feedback} canUndo={canUndoFeedback} onClose={resetTerminal} onUndo={undoTransaction}/></main>
}

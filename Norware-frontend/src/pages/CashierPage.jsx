import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CashierSaleSheet from '../components/CashierSaleSheet'
import GuardQrScanner from '../components/GuardQrScanner'
import Icon from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { activeEvent, formatMoney } from '../data/mockData'
import {
  cashierDemoCapacity,
  cashierDemoHints,
  createDemoCashierTransaction,
  findDemoCashierPersonByDni,
  parseCashierQr,
  undoDemoCashierTransaction,
} from '../data/cashierMockData'
import { api } from '../lib/api'

const TEN_MINUTES = 10 * 60

/** @type {{ id: number, club: string, precio_publicado: number }} */
const CASHIER_EVENT_FALLBACK = Object.freeze({
  id: Number(activeEvent.id),
  club: String(activeEvent.club),
  precio_publicado: Number(activeEvent.precio_publicado),
})

function resolveCashierEvent(session) {
  const suppliedEvent = session?.evento && typeof session.evento === 'object' ? session.evento : {}
  const suppliedId = Number(suppliedEvent.id ?? session?.evento_id)
  const suppliedPrice = Number(suppliedEvent.precio_publicado ?? suppliedEvent.precio)

  return {
    id: Number.isFinite(suppliedId) && suppliedId > 0 ? suppliedId : CASHIER_EVENT_FALLBACK.id,
    club: String(suppliedEvent.club || suppliedEvent.nombre || CASHIER_EVENT_FALLBACK.club),
    precio_publicado: Number.isFinite(suppliedPrice) && suppliedPrice >= 0
      ? suppliedPrice
      : CASHIER_EVENT_FALLBACK.precio_publicado,
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
      setCapacityStatus(session?.isDemo ? 'demo' : 'live')
    } catch {
      if (controller.signal.aborted || capacityRequestRef.current.sequence !== sequence) return
      if (session?.isDemo) {
        setCapacity((current) => current || cashierDemoCapacity)
        setCapacityStatus('demo')
      } else {
        setCapacity(null)
        setCapacityStatus('unavailable')
      }
    }
  }, [eventId, session?.isDemo])

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
    const person = parseCashierQr(qrCode)
    if (!person) {
      setSelected(null)
      setInlineError('QR desconocido. No se encontró una entrada válida para caja.')
      return
    }
    setSelected(person)
    setInlineError('')
  }, [])

  const searchDni = (event) => {
    event.preventDefault()
    if (!/^\d{7,8}$/.test(dni)) {
      setInlineError('Ingresá un DNI válido de 7 u 8 dígitos.')
      return
    }
    if (!session?.isDemo) {
      setSelected(null)
      setInlineError('La búsqueda por DNI no está disponible: la API no documenta un endpoint para esta operación.')
      return
    }
    const person = findDemoCashierPersonByDni(dni)
    if (!person) {
      setSelected(null)
      setInlineError('No encontramos una persona pendiente de cobro con ese DNI.')
      return
    }
    setSelected(person)
    setInlineError('')
  }

  const adjustCapacity = useCallback((delta) => {
    setCapacity((current) => {
      const baseCapacity = current || (session?.isDemo ? cashierDemoCapacity : null)
      if (!baseCapacity) return current
      const ingresados = Math.max(0, Number(baseCapacity.ingresados || 0) + delta)
      return {
        ...baseCapacity,
        ingresados,
        porcentaje: Math.round((ingresados / Number(baseCapacity.aforo_max || 1)) * 100),
      }
    })
  }, [session?.isDemo])

  const registerSuccess = (result, type, detail, { addedEntries = 1, usedFallback = false } = {}) => {
    const createdItems = Array.isArray(result.creados) ? result.creados : []
    const transactionId = result.id || result.operacion_id || createdItems[0]?.id
    const transaction = transactionId ? {
      id: transactionId,
      type,
      createdAt: Date.now(),
      detail,
      addedEntries,
      usedFallback,
    } : null
    setLastTransaction(transaction)
    setUndoRemaining(transaction ? TEN_MINUTES : 0)
    adjustCapacity(addedEntries)
    setFeedback({ type: 'success', message: result.mensaje || 'Operación registrada', detail, transaction })
  }

  const runAction = async (type, paymentMethod = null) => {
    if (busy) return
    if (!selected?.id) {
      setInlineError(type === 'web' ? 'Escaneá una entrada web antes de validar.' : 'Buscá una persona por DNI antes de cobrar.')
      return
    }
    setBusy(true)
    setInlineError('')
    try {
      let result
      let usedFallback = false
      try {
        if (type === 'web') result = await api.post(`/puerta/cajera/escanear-web/${selected.id}/`, {})
        else result = await api.post(`/puerta/cajera/cobrar-lista/${selected.id}/`, { metodo_pago: paymentMethod, monto_pagado: Number(selected.monto_pago || ticketPrice) })
      } catch (error) {
        if (error.status !== 0 || !session?.isDemo) throw error
        result = createDemoCashierTransaction(type, { metodo_pago: paymentMethod })
        usedFallback = true
      }
      registerSuccess(result, type, `${selected.nombre} ${selected.apellido}`, { addedEntries: 1, usedFallback })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'No pudimos registrar la operación.', detail: error.data?.detail || 'Revisá el estado del ingreso e intentá otra vez.' })
    } finally {
      setBusy(false)
    }
  }

  const submitGeneralSale = async (people) => {
    setBusy(true)
    try {
      const payload = { evento_id: eventId, personas: people }
      let result
      let usedFallback = false
      try {
        result = await api.post('/puerta/cajera/venta-general/', payload)
      } catch (error) {
        if (error.status !== 0 || !session?.isDemo) throw error
        result = createDemoCashierTransaction('venta', payload)
        usedFallback = true
      }
      setSaleOpen(false)
      const detail = `${people.length} entrada${people.length === 1 ? '' : 's'} · ${formatMoney(people.length * ticketPrice)}`
      registerSuccess(result, 'venta', detail, { addedEntries: people.length, usedFallback })
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
      let result
      let usedFallback = transaction.usedFallback === true
      if (usedFallback) {
        result = undoDemoCashierTransaction(transaction.id)
      } else {
        try {
          result = await api.post(`/puerta/cajera/deshacer/${transaction.id}/`, {})
        } catch (error) {
          if (error.status !== 0 || !session?.isDemo) throw error
          result = undoDemoCashierTransaction(transaction.id)
          usedFallback = true
        }
      }
      setLastTransaction(null)
      setUndoRemaining(0)
      setFeedback({ type: 'undone', message: result.mensaje || 'Operación deshecha', detail: transaction.detail })
      if (usedFallback) adjustCapacity(-Number(transaction.addedEntries || 0))
      else loadCapacity()
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'No pudimos deshacer la operación.', detail: 'El plazo puede haber vencido.' })
    } finally { setBusy(false) }
  }

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

  <div className="p-4 pb-[max(28px,env(safe-area-inset-bottom))]"><section aria-labelledby="scanner-title"><div className="mb-3 flex items-end justify-between"><div><p className="eyebrow">Identificar</p><h1 id="scanner-title" className="display-title mt-2 text-3xl">ESCANEAR ENTRADA</h1></div><span className="font-mono text-[9px] uppercase text-emerald-300">Cámara activa</span></div><GuardQrScanner key={scannerKey} active={!busy && !feedback && !saleOpen} onScan={handleQrScan}/>{session?.isDemo && <p className="mt-2 text-center font-mono text-[9px] uppercase text-muted">QR demo: {cashierDemoHints.webQr}</p>}</section>

  <form onSubmit={searchDni} className="mt-4 border border-white/15 bg-floor p-3"><label className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted">Buscar lista por DNI</label><div className="mt-2 flex gap-2"><input inputMode="numeric" value={dni} onChange={(event) => { setDni(event.target.value.replace(/\D/g, '').slice(0, 8)); setInlineError('') }} className="field min-h-14 flex-1 text-center text-lg tracking-wider" placeholder="38 987 654"/><button disabled={busy} className="grid min-h-14 w-16 place-items-center bg-white text-void disabled:opacity-40" aria-label="Buscar DNI"><Icon name="search" size={22}/></button></div>{session?.isDemo && <p className="mt-2 font-mono text-[9px] uppercase text-muted">Demo: {cashierDemoHints.listDni}</p>}</form>

  {inlineError && <div className="mt-4 border border-door-red/50 bg-door-red/10 p-4"><p className="font-mono text-xs font-bold uppercase text-door-red">Atención</p><p className="mt-2 text-sm leading-5">{inlineError}</p></div>}

  <section className="mt-4 min-h-40 border-2 border-white/15 bg-floor p-5" aria-live="polite">{selected ? <><div className="flex items-center justify-between"><p className="eyebrow">Resultado inmediato</p><span className={`border px-2 py-1 font-mono text-[9px] font-bold uppercase ${isWeb ? 'border-strobe text-strobe' : 'border-amber-300 text-amber-300'}`}>{isWeb ? 'Entrada web' : 'Lista RRPP'}</span></div><h2 className="display-title mt-4 text-4xl">{selected.nombre} {selected.apellido}</h2><div className="mt-5 grid grid-cols-2 gap-4 font-mono"><div><p className="text-[9px] uppercase text-muted">DNI</p><p className="mt-1 text-sm font-bold">{selected.dni}</p></div><div><p className="text-[9px] uppercase text-muted">Estado</p><p className="mt-1 text-sm font-bold">{String(selected.estado).replaceAll('_', ' ')}</p></div>{isList && <><div><p className="text-[9px] uppercase text-muted">RRPP</p><p className="mt-1 text-sm font-bold">{selected.rrpp_nombre}</p></div><div><p className="text-[9px] uppercase text-muted">A cobrar</p><p className="mt-1 text-sm font-bold text-strobe">{formatMoney(selected.monto_pago)}</p></div></>}</div></> : <div className="grid min-h-32 place-items-center text-center"><div><Icon name="ticket" size={30} className="mx-auto text-muted"/><p className="mt-3 font-mono text-[10px] uppercase leading-5 text-muted">Escaneá un QR o buscá un DNI.<br/>El resultado aparece acá.</p></div></div>}</section>

  <section className="mt-4" aria-labelledby="actions-title"><p id="actions-title" className="eyebrow mb-3">Acciones rápidas</p><div className="grid grid-cols-2 gap-3"><button type="button" disabled={!isWeb || busy} onClick={() => runAction('web')} className="flex min-h-24 flex-col items-center justify-center gap-2 bg-strobe px-3 text-void disabled:bg-white/5 disabled:text-muted"><Icon name="ticket" size={25}/><span className="font-display text-lg">ENTRADA WEB</span></button><button type="button" disabled={!isList || busy} onClick={() => runAction('lista', 'efectivo')} className="flex min-h-24 flex-col items-center justify-center gap-2 bg-emerald-400 px-3 text-void disabled:bg-white/5 disabled:text-muted"><Icon name="cash" size={25}/><span className="font-display text-lg">EFECTIVO</span></button><button type="button" disabled={!isList || busy} onClick={() => runAction('lista', 'transferencia')} className="flex min-h-24 flex-col items-center justify-center gap-2 bg-uv px-3 text-white disabled:bg-white/5 disabled:text-muted"><Icon name="share" size={25}/><span className="font-display text-lg">TRANSFERENCIA</span></button><button type="button" disabled={busy} onClick={() => setSaleOpen(true)} className="flex min-h-24 flex-col items-center justify-center gap-2 bg-amber-300 px-3 text-void disabled:opacity-50"><Icon name="plus" size={25}/><span className="font-display text-lg">VENTA GENERAL</span></button></div></section>

  {lastTransaction && undoRemaining > 0 && <section className="mt-4 border border-amber-300/60 bg-amber-300/5 p-4"><div className="flex items-center gap-3"><Icon name="clock" className="shrink-0 text-amber-300"/><div className="min-w-0 flex-1"><p className="font-mono text-[9px] font-bold uppercase text-amber-300">Última operación · {formatCountdown(undoRemaining)}</p><p className="mt-1 truncate text-xs text-muted">{lastTransaction.detail}</p></div><button type="button" disabled={busy} onClick={() => undoTransaction()} className="min-h-11 border border-amber-300 px-3 font-mono text-[9px] font-bold uppercase text-amber-300 disabled:opacity-40">Deshacer</button></div></section>}</div></div>

  <CashierSaleSheet open={saleOpen} busy={busy} ticketPrice={ticketPrice} onClose={() => setSaleOpen(false)} onSubmit={submitGeneralSale}/><CashierFeedback feedback={feedback} canUndo={canUndoFeedback} onClose={resetTerminal} onUndo={undoTransaction}/></main>
}

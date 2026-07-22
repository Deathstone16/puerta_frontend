import { useEffect, useId, useRef, useState } from 'react'

const CAMERA_ERRORS = {
  NotAllowedError: 'Necesitamos permiso para usar la cámara.',
  NotFoundError: 'No encontramos una cámara disponible.',
  NotReadableError: 'La cámara está siendo usada por otra aplicación.',
  OverconstrainedError: 'La cámara trasera no está disponible.',
}

function cameraErrorMessage(error) {
  return CAMERA_ERRORS[error?.name] || 'No pudimos iniciar la cámara. Revisá los permisos e intentá de nuevo.'
}

export default function GuardQrScanner({ active, onScan }) {
  const reactId = useId()
  const elementId = `guard-qr-${reactId.replace(/:/g, '')}`
  const scannerRef = useRef(null)
  const callbackRef = useRef(onScan)
  const detectedRef = useRef(false)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => { callbackRef.current = onScan }, [onScan])

  useEffect(() => {
    if (!active) {
      setStatus('idle')
      setError('')
      detectedRef.current = false
      return undefined
    }

    let cancelled = false
    let scanner

    async function startScanner() {
      setStatus('starting')
      setError('')
      detectedRef.current = false

      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        scanner = new Html5Qrcode(elementId, { verbose: false })
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.floor(Math.min(width, height) * 0.72)
              return { width: size, height: size }
            },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (detectedRef.current) return
            detectedRef.current = true
            setStatus('detected')
            callbackRef.current(decodedText)
          },
          () => {},
        )
        if (!cancelled) setStatus('scanning')
      } catch (startError) {
        if (!cancelled) {
          setStatus('error')
          setError(cameraErrorMessage(startError))
        }
      }
    }

    startScanner()

    return () => {
      cancelled = true
      detectedRef.current = true
      const current = scannerRef.current || scanner
      scannerRef.current = null
      if (!current) return

      const cleanup = async () => {
        try {
          if (current.isScanning) await current.stop()
          current.clear()
        } catch {
          // El elemento puede desmontarse antes de que la cámara termine de cerrar.
        }
      }
      cleanup()
    }
  }, [active, attempt, elementId])

  return (
    <div className="relative aspect-square w-full overflow-hidden border border-white/15 bg-black">
      <div id={elementId} className="guard-qr-reader absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_bottom,rgba(10,10,16,.55),transparent_24%,transparent_76%,rgba(10,10,16,.55)),linear-gradient(to_right,rgba(10,10,16,.55),transparent_24%,transparent_76%,rgba(10,10,16,.55))]" />
      <div className="pointer-events-none absolute inset-[14%] z-20 border border-strobe/50">
        <span className="absolute -left-px -top-px size-8 border-l-4 border-t-4 border-strobe" />
        <span className="absolute -right-px -top-px size-8 border-r-4 border-t-4 border-strobe" />
        <span className="absolute -bottom-px -left-px size-8 border-b-4 border-l-4 border-strobe" />
        <span className="absolute -bottom-px -right-px size-8 border-b-4 border-r-4 border-strobe" />
        {status === 'scanning' && <span className="absolute inset-x-2 top-0 h-px animate-scan bg-strobe shadow-[0_0_14px_#22D3EE]" />}
      </div>

      {(status === 'idle' || status === 'starting') && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-void/85 p-6 text-center">
          <div><span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-2 border-white/15 border-t-strobe"/><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-muted">Iniciando cámara</p></div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-void p-6 text-center">
          <div><p className="font-display text-3xl text-door-red">SIN CÁMARA</p><p className="mt-3 text-sm leading-6 text-muted">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)} className="btn-secondary mt-6 w-full">Reintentar</button></div>
        </div>
      )}

      {status === 'detected' && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-strobe/20 backdrop-blur-sm"><p className="border border-strobe bg-void px-5 py-3 font-mono text-xs font-bold uppercase text-strobe">Código detectado</p></div>
      )}
    </div>
  )
}

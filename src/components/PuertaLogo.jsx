/**
 * PuertaLogo — Logo completo "Puerta": ícono P + texto "uerta".
 * Usa currentColor, por lo que cambia de color con el tema automáticamente.
 *
 * Props:
 *   size: number (default 32) — height of the P icon in px
 *   className: string — additional CSS classes (applied to wrapper)
 *   showText: boolean (default true) — whether to show "uerta" text
 */
export default function PuertaLogo({ size = 32, className = '', showText = true }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-gray-900 dark:text-white ${className}`} aria-label="Puerta">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path d="M20 10 L20 90 L38 90 L38 52 C38 36 48 28 58 28 C72 28 80 38 80 52 C80 66 72 76 58 76 L58 76 C80 76 95 63 95 46 C95 26 78 10 55 10 Z" />
      </svg>
      {showText && (
        <span className="font-display uppercase leading-none" style={{ fontSize: size * 0.75 }}>
          uerta
        </span>
      )}
    </span>
  )
}

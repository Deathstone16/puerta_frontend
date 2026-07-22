/**
 * Sello — SVG stamp/seal component for visual status feedback.
 *
 * Renders an irregular octagon (simulating a hand-stamped look) with
 * rotation, color, and text driven by an `estado` prop.
 *
 * Usage:
 *   <Sello estado="aprobado_guardia" size="lg" animate />
 *   <Sello estado="cancelado" size="sm" texto="RECHAZADO" />
 */

export const SELLO_CONFIG = {
  aprobado_guardia: { color: '#8B5CF6', rotation: -4, defaultText: 'APROBADO' },
  rebotado_guardia: { color: '#E23B5A', rotation: 3, defaultText: 'REBOTADO' },
  ingresado_final: { color: '#22D3EE', rotation: -2, defaultText: 'INGRESADO' },
  ingresado: { color: '#8B5CF6', rotation: -2, defaultText: 'INGRESADO' },
  cancelado: { color: '#E23B5A', rotation: 5, defaultText: 'CANCELADO' },
  procesando: { color: '#8A87A3', rotation: -3, defaultText: 'PROCESANDO' },
}

export const SELLO_SIZES = { sm: 80, md: 128, lg: 180 }

const FALLBACK_CONFIG = { color: '#8A87A3', rotation: 0, defaultText: '' }

// Irregular octagon path — intentionally imperfect for hand-stamped feel
const OCTAGON_PATH = 'M 15 5 L 85 8 L 95 20 L 92 80 L 82 95 L 18 92 L 5 82 L 8 18 Z'

export default function Sello({ estado, size = 'md', texto, animate = false, className = '' }) {
  const config = SELLO_CONFIG[estado] ?? FALLBACK_CONFIG
  const dimension = SELLO_SIZES[size] ?? SELLO_SIZES.md
  const displayText = texto ?? config.defaultText

  return (
    <div
      className={`inline-flex items-center justify-center ${animate ? 'animate-pulse-seal' : ''} ${className}`.trim()}
      style={{ opacity: 0.9 }}
      data-testid="sello"
      data-estado={estado}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        style={{ transform: `rotate(${config.rotation}deg)` }}
      >
        <path
          d={OCTAGON_PATH}
          stroke={config.color}
          strokeWidth={4}
          fill="none"
          strokeLinejoin="round"
        />
        <text
          x="50"
          y="52"
          textAnchor="middle"
          dominantBaseline="central"
          fill={config.color}
          fontSize={dimension <= 80 ? 11 : dimension <= 128 ? 10 : 9}
          fontFamily="'Space Mono', monospace"
          fontWeight="bold"
          letterSpacing="0.08em"
        >
          {displayText.toUpperCase()}
        </text>
      </svg>
    </div>
  )
}

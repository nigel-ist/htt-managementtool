'use client'

/**
 * HTT Capability Map — radar / spider chart rendering capability scores.
 * Pure SVG, no external chart library required.
 */

import { HTT_CAPABILITIES, HTT_CAPABILITY_LABELS, type CapabilityScores } from '@/app/[tenant]/htt/types'

interface CapabilityMapProps {
  current: CapabilityScores
  previous?: CapabilityScores | null
  size?: number
}

const N = HTT_CAPABILITIES.length  // 6
const LEVELS = 5                   // rings for scores 1–5
const CENTER = 160
const RADIUS = 120

function polarToCart(angleDeg: number, r: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)]
}

function scoreToR(score: number): number {
  return (score / LEVELS) * RADIUS
}

function buildPath(scores: CapabilityScores): string {
  return HTT_CAPABILITIES.map((cap, i) => {
    const angle = (360 / N) * i
    const [x, y] = polarToCart(angle, scoreToR(scores[cap]))
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ') + ' Z'
}

export default function CapabilityMap({ current, previous, size = 320 }: CapabilityMapProps) {
  const vb = `0 0 ${CENTER * 2} ${CENTER * 2}`

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox={vb}
        width={size}
        height={size}
        className="overflow-visible"
        aria-label="HTT Capability Map"
      >
        {/* Grid rings */}
        {Array.from({ length: LEVELS }).map((_, li) => {
          const r = ((li + 1) / LEVELS) * RADIUS
          const points = Array.from({ length: N }).map((_, i) => {
            const [x, y] = polarToCart((360 / N) * i, r)
            return `${x.toFixed(1)},${y.toFixed(1)}`
          }).join(' ')
          return (
            <polygon
              key={li}
              points={points}
              fill="none"
              stroke="rgb(var(--border))"
              strokeWidth="1"
            />
          )
        })}

        {/* Axis lines */}
        {HTT_CAPABILITIES.map((_, i) => {
          const [x, y] = polarToCart((360 / N) * i, RADIUS)
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={x.toFixed(1)}
              y2={y.toFixed(1)}
              stroke="rgb(var(--border))"
              strokeWidth="1"
            />
          )
        })}

        {/* Previous baseline (ghost) */}
        {previous && (
          <path
            d={buildPath(previous)}
            fill="rgb(var(--color-primary) / 0.08)"
            stroke="rgb(var(--color-primary) / 0.3)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        )}

        {/* Current baseline */}
        <path
          d={buildPath(current)}
          fill="rgb(var(--color-primary) / 0.18)"
          stroke="rgb(var(--color-primary))"
          strokeWidth="2"
        />

        {/* Score dots */}
        {HTT_CAPABILITIES.map((cap, i) => {
          const angle = (360 / N) * i
          const [x, y] = polarToCart(angle, scoreToR(current[cap]))
          return (
            <circle
              key={cap}
              cx={x.toFixed(1)}
              cy={y.toFixed(1)}
              r="4"
              fill="rgb(var(--color-primary))"
            />
          )
        })}

        {/* Labels */}
        {HTT_CAPABILITIES.map((cap, i) => {
          const angle = (360 / N) * i
          const [x, y] = polarToCart(angle, RADIUS + 22)
          const anchor = x < CENTER - 5 ? 'end' : x > CENTER + 5 ? 'start' : 'middle'
          return (
            <text
              key={cap}
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="10"
              fill="rgb(var(--text-2))"
              fontFamily="inherit"
            >
              {HTT_CAPABILITY_LABELS[cap]}
            </text>
          )
        })}

        {/* Score value labels on axes */}
        {HTT_CAPABILITIES.map((cap, i) => {
          const score = current[cap]
          const angle = (360 / N) * i
          const [x, y] = polarToCart(angle, scoreToR(score) - 10)
          if (score < 1.5) return null
          return (
            <text
              key={`val-${cap}`}
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="rgb(var(--color-primary))"
              fontWeight="600"
              fontFamily="inherit"
            >
              {score}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      {previous && (
        <div className="flex items-center gap-4 text-xs text-[rgb(var(--text-3))]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 bg-[rgb(var(--color-primary))]" />
            Current
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 border-t-2 border-dashed border-[rgb(var(--color-primary)/0.4)]" />
            Previous
          </span>
        </div>
      )}
    </div>
  )
}

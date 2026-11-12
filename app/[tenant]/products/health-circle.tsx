'use client'

interface Props {
  value: number       // 0-100
  size?: number       // px, default 52
  strokeWidth?: number
  label?: string
  className?: string
}

function scoreColor(v: number): string {
  if (v >= 70) return '#16a34a' // green-600
  if (v >= 40) return '#d97706' // amber-600
  return '#dc2626'              // red-600
}

export default function HealthCircle({ value, size = 52, strokeWidth = 4, label, className = '' }: Props) {
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const filled = (pct / 100) * circumference
  const color = scoreColor(pct)

  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`} title={label ? `${label}: ${pct}%` : `${pct}%`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Fill */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
        {/* Text (counter-rotate) */}
        <text
          x={cx} y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ transform: `rotate(90deg) translate(0px, -${size}px)`, fontSize: size < 44 ? '9px' : '11px', fontWeight: 600, fill: color, transformOrigin: `${cx}px ${cy}px` }}
        >
          {pct}
        </text>
      </svg>
      {label && (
        <span className="text-[9px] font-medium text-center leading-tight text-[rgb(var(--text-3))] max-w-[56px]">
          {label}
        </span>
      )}
    </div>
  )
}

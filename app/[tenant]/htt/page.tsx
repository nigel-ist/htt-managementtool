/**
 * HTT Module overview page.
 *
 * Shows the user's current HTT stage, capability scores (bar chart + radar map),
 * progression history, and the inline HTT Coach AI panel.
 *
 * If no baseline exists, shows orienting moment + prompt to take diagnostic.
 */
import Link from 'next/link'
import { getLatestBaseline, getAllBaselines } from './actions'
import CapabilityMap from '@/components/htt/CapabilityMap'
import HttCoach from '@/components/htt/HttCoach'
import type { CapabilityScores, HttBaseline } from './types'

interface HttPageProps {
  params: { tenant: string }
}

const STAGES = [
  { num: 1, label: 'Acquisition',    desc: 'First exposure to HTT concepts and language.' },
  { num: 2, label: 'Fluency',        desc: 'Applying HTT concepts with growing confidence.' },
  { num: 3, label: 'Maintenance',    desc: 'Established capability, actively reinforcing.' },
  { num: 4, label: 'Generalisation', desc: 'Transferring HTT thinking to novel situations independently.' },
  { num: 5, label: 'Adaptive',       desc: 'Evaluating and evolving the framework itself.' },
]

const CAPABILITIES: { key: keyof CapabilityScores; label: string; desc: string }[] = [
  { key: 'critical_thinking',  label: 'Critical Thinking',   desc: 'Evaluating evidence, questioning assumptions, reasoning to sound conclusions.' },
  { key: 'mental_models',      label: 'Mental Models',       desc: 'Building and applying conceptual frameworks to interpret complex situations.' },
  { key: 'perspective_taking', label: 'Perspective Taking',  desc: 'Triarchic Intelligence — Analytical, Social, and Survival intelligences.' },
  { key: 'adaptability',       label: 'Adaptability',        desc: 'Adjusting thinking and behaviour effectively as conditions change.' },
  { key: 'independence',       label: 'Independence',        desc: 'Initiating and sustaining cognitive work without external direction.' },
  { key: 'creativity',         label: 'Creativity',          desc: 'Generating novel solutions and seeing possibilities others miss.' },
]

function ScoreBar({ score, delta }: { score: number; delta: number | null }) {
  const pct = ((score - 1) / 4) * 100
  const colour =
    score <= 1.5 ? 'bg-gray-400' :
    score <= 2.5 ? 'bg-blue-400' :
    score <= 3.5 ? 'bg-violet-500' :
    score <= 4.5 ? 'bg-amber-400' :
                   'bg-emerald-500'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-[rgb(var(--bg-subtle))] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colour}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
        <span className="text-sm font-semibold text-[rgb(var(--fg))] tabular-nums">{score.toFixed(1)}</span>
        {delta !== null && delta !== 0 && (
          <span className={`text-xs font-medium tabular-nums ${delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  )
}

function StageIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-stretch gap-0">
      {STAGES.map((stage, i) => {
        const isActive = stage.num === current
        const isPast = stage.num < current
        return (
          <div key={stage.num} className="flex-1 relative">
            {i > 0 && (
              <div className={`absolute left-0 top-3 h-0.5 w-full -translate-y-0.5 ${isPast || isActive ? 'bg-[rgb(var(--color-primary,59_130_246))]' : 'bg-[rgb(var(--border))]'}`} />
            )}
            <div className="relative flex flex-col items-center gap-2 px-1">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 text-[10px] font-bold ${
                isActive
                  ? 'bg-[rgb(var(--color-primary,59_130_246))] border-[rgb(var(--color-primary,59_130_246))] text-white'
                  : isPast
                    ? 'bg-[rgb(var(--color-primary,59_130_246))] border-[rgb(var(--color-primary,59_130_246))] text-white'
                    : 'bg-[rgb(var(--bg-card))] border-[rgb(var(--border))] text-[rgb(var(--fg-muted))]'
              }`}>
                {isPast ? '✓' : stage.num}
              </div>
              <div className={`text-center ${isActive ? 'text-[rgb(var(--fg))]' : 'text-[rgb(var(--fg-muted))]'}`}>
                <div className={`text-[10px] font-semibold ${isActive ? 'text-[rgb(var(--color-primary,59_130_246))]' : ''}`}>{stage.label}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default async function HttPage({ params }: HttPageProps) {
  const { tenant: tenantSlug } = params
  const [baseline, allBaselines] = await Promise.all([
    getLatestBaseline(tenantSlug),
    getAllBaselines(tenantSlug),
  ])

  const currentStage = STAGES.find(s => s.num === (baseline?.stage ?? 1))

  // No baseline yet — show orienting moment + prompt to take diagnostic
  if (!baseline) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">How to Think</h1>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
            Newbridge Innovations&apos; framework for building human cognitive capability.
          </p>
        </div>

        {/* Orienting Moment */}
        <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-8 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a14.974 14.974 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            Orienting Moment
          </div>

          <h2 className="text-xl font-semibold text-[rgb(var(--fg))] mb-3">
            What to Think vs. How to Think
          </h2>
          <p className="text-sm text-[rgb(var(--fg-muted))] leading-relaxed mb-4 max-w-2xl">
            Most tools — including AI — are excellent at telling you <strong className="text-[rgb(var(--fg))]">what to think</strong>: surfacing data, generating options, producing summaries. This platform does that too. But <strong className="text-[rgb(var(--fg))]">How to Think</strong> is a different capability — the analytical, adaptive, and independent reasoning skills that AI cannot replace.
          </p>
          <p className="text-sm text-[rgb(var(--fg-muted))] leading-relaxed mb-6 max-w-2xl">
            The HTT framework tracks your development across six cognitive capabilities and five stages of mastery. The AI interactions throughout this platform are designed in HTT Mode — they ask what you notice, what assumptions are embedded, and what you&apos;d need to believe — not just what the answer is.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {CAPABILITIES.map(cap => (
              <div key={cap.key} className="bg-[rgb(var(--bg-subtle))] rounded-lg px-3 py-2.5">
                <div className="text-xs font-semibold text-[rgb(var(--fg))] mb-0.5">{cap.label}</div>
                <div className="text-[11px] text-[rgb(var(--fg-muted))] leading-snug">{cap.desc}</div>
              </div>
            ))}
          </div>

          <Link
            href={`/${tenantSlug}/htt/baseline`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[rgb(var(--color-primary,59_130_246))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Take the baseline diagnostic
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <p className="text-xs text-[rgb(var(--fg-muted))] text-center">
          The diagnostic takes about 5 minutes. Your scores are private to you and are never shared with other users.
        </p>
      </div>
    )
  }

  // Baseline exists — show full dashboard
  const previousBaseline: HttBaseline | undefined = allBaselines.length > 1
    ? allBaselines[allBaselines.length - 2]
    : undefined

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">How to Think</h1>
          <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
            Your cognitive capability profile — last assessed {new Date(baseline.assessed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>
        <Link
          href={`/${tenantSlug}/htt/baseline`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--fg))] text-sm font-medium hover:bg-[rgb(var(--bg-subtle))] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Re-assess
        </Link>
      </div>

      {/* Stage indicator */}
      <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6 mb-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--fg-muted))] mb-1">Current Stage</div>
            <div className="text-2xl font-semibold text-[rgb(var(--fg))]">
              Stage {baseline.stage} — {currentStage?.label}
            </div>
            <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">{currentStage?.desc}</p>
          </div>
          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[rgb(var(--color-primary,59_130_246))]/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-[rgb(var(--color-primary,59_130_246))]">{baseline.stage}</span>
          </div>
        </div>
        <StageIndicator current={baseline.stage} />
      </div>

      {/* Two-column: capability map + bar scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Capability Map */}
        <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4">Capability Map</h2>
          <div className="flex justify-center">
            <CapabilityMap
              current={baseline.scores}
              previous={previousBaseline?.scores ?? null}
              size={280}
            />
          </div>
          {previousBaseline && (
            <p className="text-xs text-[rgb(var(--fg-muted))] text-center mt-2">
              Dashed outline = previous assessment ({new Date(previousBaseline.assessed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })})
            </p>
          )}
        </div>

        {/* Capability bar scores */}
        <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4">Capability Scores</h2>
          <div className="space-y-4">
            {CAPABILITIES.map(cap => {
              const score = baseline.scores[cap.key] ?? 1
              const prevScore = previousBaseline?.scores[cap.key] ?? null
              const delta = prevScore !== null ? score - prevScore : null
              return (
                <div key={cap.key}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm font-medium text-[rgb(var(--fg))]">{cap.label}</span>
                    <span className="text-xs text-[rgb(var(--fg-muted))]">
                      {score <= 1.5 ? 'Acquisition' : score <= 2.5 ? 'Fluency' : score <= 3.5 ? 'Maintenance' : score <= 4.5 ? 'Generalisation' : 'Adaptive'}
                    </span>
                  </div>
                  <ScoreBar score={score} delta={delta} />
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-[rgb(var(--border))] flex items-center justify-between text-xs text-[rgb(var(--fg-muted))]">
            <span>Scores 1 (Acquisition) → 5 (Adaptive)</span>
            <span>Source: {baseline.source === 'diagnostic' ? 'Self-assessment' : baseline.source === 'seminar' ? 'C-Suite Seminar' : 'Coach Inferred'}</span>
          </div>
        </div>
      </div>

      {/* HTT Coach AI */}
      <div className="mb-5">
        <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">HTT Coach</h2>
              <p className="text-xs text-[rgb(var(--fg-muted))] mt-0.5">
                Stage-aware AI coaching — prompts are calibrated to your Stage {baseline.stage} profile.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--fg-muted))]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              claude-haiku-4-5
            </div>
          </div>
          <HttCoach tenantSlug={tenantSlug} stage={baseline.stage} moduleContext="htt" />
        </div>
      </div>

      {/* Value Case */}
      <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))] mb-3">Why This Matters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[rgb(var(--bg-subtle))] rounded-lg p-4">
            <div className="text-lg font-bold text-[rgb(var(--color-primary,59_130_246))] mb-1">AI augments</div>
            <p className="text-xs text-[rgb(var(--fg-muted))] leading-snug">
              AI accelerates execution — but only humans decide what&apos;s worth doing, why, and under what constraints. HTT sharpens that judgment.
            </p>
          </div>
          <div className="bg-[rgb(var(--bg-subtle))] rounded-lg p-4">
            <div className="text-lg font-bold text-[rgb(var(--color-primary,59_130_246))] mb-1">Thinking transfers</div>
            <p className="text-xs text-[rgb(var(--fg-muted))] leading-snug">
              Capability built in one domain — products, finance, people — transfers to every other. Stage 4+ thinkers see patterns that others miss.
            </p>
          </div>
          <div className="bg-[rgb(var(--bg-subtle))] rounded-lg p-4">
            <div className="text-lg font-bold text-[rgb(var(--color-primary,59_130_246))] mb-1">Measurable growth</div>
            <p className="text-xs text-[rgb(var(--fg-muted))] leading-snug">
              The five-stage model gives a shared language for coaching conversations and makes development visible across the organisation.
            </p>
          </div>
        </div>
      </div>

      {/* Assessment history */}
      {allBaselines.length > 1 && (
        <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4">Assessment History</h2>
          <div className="space-y-2">
            {[...allBaselines].reverse().map((b, i) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-[rgb(var(--border))] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-[rgb(var(--color-primary,59_130_246))] text-white' : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))]'}`}>
                    {b.stage}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[rgb(var(--fg))]">Stage {b.stage} — {STAGES.find(s => s.num === b.stage)?.label}</div>
                    <div className="text-xs text-[rgb(var(--fg-muted))]">{new Date(b.assessed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
                <div className="text-xs text-[rgb(var(--fg-muted))]">
                  {b.source === 'diagnostic' ? 'Self-assessment' : b.source === 'seminar' ? 'Seminar' : 'Coach'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

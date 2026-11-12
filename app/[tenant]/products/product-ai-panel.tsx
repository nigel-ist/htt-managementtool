'use client'

import { useState } from 'react'
import type { Product } from './types'

interface Props {
  tenantSlug: string
  product: Product
}

const GENERATION_TYPES = [
  { key: 'overview',           label: 'Overview',              prompt: 'Write a concise executive overview of this product: what it is, who it serves, and why it matters for Brinkman.' },
  { key: 'bc_analysis',        label: 'BC Analysis',           prompt: 'Analyse this product through a Brinkman Capital lens: assess strategic fit, capital efficiency, and investment readiness.' },
  { key: 'capital_people',     label: 'Capital & People',      prompt: 'Identify the capital requirements and key people/skills needed to successfully scale this product.' },
  { key: 'client_prediction',  label: 'Client Prediction',     prompt: 'Predict the client segments most likely to adopt this product, their decision criteria, and estimated conversion likelihood.' },
  { key: 'revenue_prediction', label: 'Revenue Prediction',    prompt: 'Project revenue potential for this product over 1, 3, and 5 years based on market size, pricing, and adoption curve.' },
  { key: 'field_strategy',     label: 'Field Strategy',        prompt: 'Outline a field delivery strategy for this product: how it is deployed, quality controlled, and scaled operationally.' },
  { key: 'competition',        label: 'Competition Analysis',  prompt: 'Analyse the competitive landscape for this product. Who are the main competitors, what are their strengths, and where is Brinkman\'s advantage?' },
  { key: 'consensus_survey',   label: 'Consensus Survey',      prompt: 'Design a 5-question internal consensus survey to assess organisational alignment and readiness to invest in this product.' },
  { key: 'value_chain',        label: 'Value Chain',           prompt: 'Map the value chain for this product: inputs, transformation activities, outputs, and where the most value is created or at risk.' },
  { key: 'ma_analysis',        label: 'M&A Analysis',          prompt: 'Assess this product\'s M&A potential: could it be acquired, could it drive acquisitions, what would a deal thesis look like?' },
  { key: 'skills_mapping',     label: 'Skills Mapping',        prompt: 'Map the specific skills and capabilities required to deliver this product at scale, and identify any gaps in the current team.' },
  { key: 'market_analysis',    label: 'Market Analysis',       prompt: 'Assess the market opportunity for this product: total addressable market, growth rate, key trends, and timing.' },
  { key: 'risk_analysis',      label: 'Risk Analysis',         prompt: 'Identify the top risks associated with this product — operational, market, regulatory, and competitive — and suggest mitigations.' },
  { key: 'go_to_market',       label: 'Go-to-Market',          prompt: 'Develop a go-to-market strategy for this product: target segments, channels, messaging, and launch sequence.' },
  { key: 'pricing_strategy',   label: 'Pricing Strategy',      prompt: 'Recommend a pricing strategy for this product: model, price points, discounting approach, and competitive positioning.' },
  { key: 'partnership',        label: 'Partnership Strategy',  prompt: 'Identify potential partners, joint-venture opportunities, or distribution alliances that could accelerate this product\'s growth.' },
]

export default function ProductAIPanel({ tenantSlug, product }: Props) {
  const [selected, setSelected] = useState(GENERATION_TYPES[0].key)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const genType = GENERATION_TYPES.find((g) => g.key === selected)!

  async function generate() {
    setLoading(true)
    setError(null)

    const context = [
      `Product: ${product.name}`,
      `Stage: ${product.type}`,
      product.description ? `Description: ${product.description}` : null,
      product.data?.features?.length ? `Features: ${product.data.features.join(', ')}` : null,
      product.data?.deliverables?.length ? `Deliverables: ${product.data.deliverables.join(', ')}` : null,
      product.data?.business_units?.length ? `Business Units: ${product.data.business_units.join(', ')}` : null,
      product.data?.scores?.brinkman_fit != null ? `Brinkman Fit: ${product.data.scores.brinkman_fit}%` : null,
      product.data?.scores?.opportunity != null ? `Opportunity Score: ${product.data.scores.opportunity}` : null,
      product.data?.scores?.competition != null ? `Competitive Advantage: ${product.data.scores.competition}` : null,
    ].filter(Boolean).join('\n')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'product_analysis',
          context,
          prompt: genType.prompt,
          tenantSlug,
        }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const { result: text, error: aiErr } = await res.json()
      if (aiErr) throw new Error(aiErr)
      setResult(text)
      setOpen(true)
    } catch {
      setError('Could not generate. Check ANTHROPIC_API_KEY is set.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-10 border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--surface))] overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <h2 className="text-sm font-semibold text-[rgb(var(--text-1))]">AI Analysis</h2>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">AI</span>
        </div>
        <select
          value={selected}
          onChange={(e) => { setSelected(e.target.value); setResult(null) }}
          className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
        >
          {GENERATION_TYPES.map((g) => (
            <option key={g.key} value={g.key}>{g.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 shrink-0">
          {result && (
            <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">
              {open ? 'Hide' : 'Show'}
            </button>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-600 text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? (
              <><svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating…</>
            ) : result ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>
      {error && <div className="px-5 pb-4 text-sm text-red-600 dark:text-red-400">{error}</div>}
      {result && open && (
        <div className="px-5 pb-5 border-t border-[rgb(var(--border))]">
          <div className="pt-4 space-y-3">
            {result.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm text-[rgb(var(--text-2))] leading-relaxed">{para}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

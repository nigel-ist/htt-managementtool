/**
 * HTT shared types, constants, and pure utilities.
 * No 'use server' — safe to import in both Server and Client components.
 */

export const HTT_CAPABILITIES = [
  'critical_thinking',
  'mental_models',
  'perspective_taking',
  'adaptability',
  'independence',
  'creativity',
] as const

export type HttCapability = typeof HTT_CAPABILITIES[number]

export const HTT_CAPABILITY_LABELS: Record<HttCapability, string> = {
  critical_thinking:  'Critical Thinking',
  mental_models:      'Mental Models',
  perspective_taking: 'Perspective Taking',
  adaptability:       'Adaptability',
  independence:       'Independence',
  creativity:         'Creativity',
}

export const HTT_STAGE_NAMES: Record<number, string> = {
  1: 'Acquisition',
  2: 'Fluency',
  3: 'Maintenance',
  4: 'Generalisation',
  5: 'Adaptive',
}

export interface CapabilityScores {
  critical_thinking:  number
  mental_models:      number
  perspective_taking: number
  adaptability:       number
  independence:       number
  creativity:         number
}

export interface HttBaseline {
  id:          string
  stage:       number
  scores:      CapabilityScores
  source:      string
  assessed_at: string
}

export interface HttInteraction {
  id:               string
  module_context:   string
  prompt_type:      string
  capability_focus: string | null
  htt_stage:        number
  user_message:     string
  ai_response:      string
  response_signal:  string | null
  created_at:       string
}

export type PromptType = 'coach' | 'embedded' | 'reflection'
export type ResponseSignal = 'helpful' | 'not_helpful' | 'skipped'

/**
 * Derive an overall HTT stage (1–5) from the mean of capability scores.
 *
 * Mean 1.0–1.6 → Stage 1 (Acquisition)
 * Mean 1.7–2.4 → Stage 2 (Fluency)
 * Mean 2.5–3.2 → Stage 3 (Maintenance)
 * Mean 3.3–4.0 → Stage 4 (Generalisation)
 * Mean 4.1–5.0 → Stage 5 (Adaptive)
 */
export function deriveStage(scores: CapabilityScores): number {
  const values = Object.values(scores)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean <= 1.6) return 1
  if (mean <= 2.4) return 2
  if (mean <= 3.2) return 3
  if (mean <= 4.0) return 4
  return 5
}

/**
 * Build a stage-aware system prompt for the HTT Coach.
 * Scaffolding decreases as stage increases.
 */
export function buildCoachSystemPrompt(stage: number, moduleContext: string): string {
  const stageName = HTT_STAGE_NAMES[stage] ?? 'Unknown'
  const moduleLabel = moduleContext.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const stageGuidance: Record<number, string> = {
    1: `The learner is at Stage 1 (Acquisition). They are new to structured thinking. Use very explicit, step-by-step guidance. Name the thinking tool you're using (e.g. "Let's use a simple pros/cons framework"). Break every question into small, concrete parts. Provide examples relevant to ${moduleLabel}. Avoid jargon. End every response with one specific, actionable next step.`,

    2: `The learner is at Stage 2 (Fluency). They understand some structured thinking but need guided practice. Use open-ended questions to prompt them (e.g. "What evidence supports that?"). Introduce a mental model by name, then show how it applies. Reduce explicit step-by-step instructions but still scaffold when they seem stuck. End with a reflective question.`,

    3: `The learner is at Stage 3 (Maintenance). They can apply thinking tools with prompting. Your role is to maintain and deepen their practice. Ask them to explain their reasoning before you engage. Challenge assumptions gently. Connect their thinking across multiple frameworks. Reduce scaffolding — guide, don't lead. Ask: "What other lenses could you apply here?"`,

    4: `The learner is at Stage 4 (Generalisation). They transfer thinking skills across contexts. Push for cross-domain connections: "How does this compare to a situation outside ${moduleLabel}?" Challenge them to identify blind spots in their own analysis. Introduce edge cases and second-order effects. Your prompts should feel like a senior colleague's challenge, not a teacher's instruction.`,

    5: `The learner is at Stage 5 (Adaptive). They generate novel thinking approaches. Engage as a peer. Ask for their mental model of the problem before offering any framing. Challenge them to identify where conventional frameworks break down. Ask: "What would a contrarian argue?" Offer alternative frameworks only when their reasoning is incomplete. This is collaborative, generative dialogue.`,
  }

  return `You are the HTT Coach — a thinking skills coach embedded in The Innovation Lab's management platform.

Current context: ${moduleLabel} module
Learner's HTT Stage: ${stage} (${stageName})

${stageGuidance[stage] ?? stageGuidance[3]}

Core principles:
- Always ground your coaching in the learner's specific situation and question
- Ask one focused question at a time rather than multiple
- If they share data or context, engage with it specifically — don't be generic
- Keep responses concise (200 words max unless they ask for more)
- Never evaluate their thinking as "right" or "wrong" — help them stress-test it themselves`
}

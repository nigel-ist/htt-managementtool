/**
 * Seed data for the Think Survey (Reasoning Fluidity Assessment).
 *
 * Call seedThinkSurvey(tenantSlug) from a server action or admin script.
 * The survey is created in 'draft' status — activate when ready to share.
 */
import { createServiceClient } from '@/lib/supabase/server'
import type { SurveyQuestion, SurveyScoreConfig } from '@/app/[tenant]/surveys/types'
import { randomUUID } from 'crypto'

// ── Question IDs ───────────────────────────────────────────────────────────
// Part A: q1–q18  (1-5 Likert, NCS-18)
// Part B: q19–q31 (1-6 Likert, AOT-13)
// Part C: qC1–qC3 (multiple choice, CRT-3)

const QUESTIONS: SurveyQuestion[] = [
  // ── Part A — Cognitive Engagement (1-5 Likert) ─────────────────────────
  { id: 'q1',  section: 'Part A — Cognitive Engagement', type: 'likert5', text: 'I would prefer complex to simple problems.' },
  { id: 'q2',  type: 'likert5', text: 'I like to have the responsibility of handling a situation that requires a lot of thinking.' },
  { id: 'q3',  type: 'likert5', text: 'Thinking is not my idea of fun.', reverse_scored: true },
  { id: 'q4',  type: 'likert5', text: 'I would rather do something that requires little thought than something that is sure to challenge my thinking abilities.', reverse_scored: true },
  { id: 'q5',  type: 'likert5', text: 'I try to anticipate and avoid situations where there is a likely chance I will have to think in depth about something.', reverse_scored: true },
  { id: 'q6',  type: 'likert5', text: 'I find satisfaction in deliberating hard and for long hours.' },
  { id: 'q7',  type: 'likert5', text: 'I only think as hard as I have to.', reverse_scored: true },
  { id: 'q8',  type: 'likert5', text: 'I prefer to think about small, daily projects rather than long-term ones.', reverse_scored: true },
  { id: 'q9',  type: 'likert5', text: 'I like tasks that require little thought once I\'ve learned them.', reverse_scored: true },
  { id: 'q10', type: 'likert5', text: 'The idea of relying on thought to make my way to the top appeals to me.' },
  { id: 'q11', type: 'likert5', text: 'I really enjoy a task that involves coming up with new solutions to problems.' },
  { id: 'q12', type: 'likert5', text: 'Learning new ways to think doesn\'t excite me very much.', reverse_scored: true },
  { id: 'q13', type: 'likert5', text: 'I prefer my life to be filled with puzzles that I must solve.' },
  { id: 'q14', type: 'likert5', text: 'The notion of thinking abstractly is appealing to me.' },
  { id: 'q15', type: 'likert5', text: 'I would prefer a task that is intellectual, difficult, and important to one that is somewhat important but does not require much thought.' },
  { id: 'q16', type: 'likert5', text: 'I feel relief rather than satisfaction after completing a task that required a lot of mental effort.', reverse_scored: true },
  { id: 'q17', type: 'likert5', text: "It's enough for me that something gets the job done; I don't care how or why it works.", reverse_scored: true },
  { id: 'q18', type: 'likert5', text: 'I usually end up deliberating about issues even when they do not affect me personally.' },

  // ── Part B — Open Reasoning Style (1-6 Likert) ─────────────────────────
  { id: 'q19', section: 'Part B — Open Reasoning Style', type: 'likert6', text: 'People should always take into consideration evidence that goes against their opinions.' },
  { id: 'q20', type: 'likert6', text: 'Changing your mind is a sign of weakness.', reverse_scored: true },
  { id: 'q21', type: 'likert6', text: 'I like to think that my actions are motivated by sound reasons.' },
  { id: 'q22', type: 'likert6', text: 'It is important to stick to your opinions even when evidence is brought to bear against them.', reverse_scored: true },
  { id: 'q23', type: 'likert6', text: 'Intuition is the best guide in making decisions.', reverse_scored: true },
  { id: 'q24', type: 'likert6', text: 'Considering too many different opinions often leads to muddled thinking.', reverse_scored: true },
  { id: 'q25', type: 'likert6', text: 'One should disregard evidence that conflicts with your current opinions.', reverse_scored: true },
  { id: 'q26', type: 'likert6', text: 'Coming to decisions quickly is a sign of wisdom.', reverse_scored: true },
  { id: 'q27', type: 'likert6', text: 'Allowing oneself to be convinced by a solid opposing argument is a sign of good character.' },
  { id: 'q28', type: 'likert6', text: 'If something I think feels right then I am comfortable, whether or not it is true.', reverse_scored: true },
  { id: 'q29', type: 'likert6', text: 'A person should always consider new information.' },
  { id: 'q30', type: 'likert6', text: 'People should revise their conclusions in response to relevant new information.' },
  { id: 'q31', type: 'likert6', text: 'Certain opinions are just too important to abandon no matter how good a case can be made against them.', reverse_scored: true },

  // ── Part C — Reflective Override (multiple choice) ──────────────────────
  {
    id: 'qC1', section: 'Part C — Reflective Override', type: 'multichoice',
    text: 'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?',
    options: ['10 cents', '5 cents', '15 cents', '20 cents'],
    correct_answer: '5 cents',
  },
  {
    id: 'qC2', type: 'multichoice',
    text: 'If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?',
    options: ['1 minute', '20 minutes', '100 minutes', '5 minutes'],
    correct_answer: '5 minutes',
  },
  {
    id: 'qC3', type: 'multichoice',
    text: 'In a lake, there is a patch of lily pads. Every day the patch doubles in size. If it takes 48 days for the patch to cover the entire lake, how long would it take for the patch to cover half of the lake?',
    options: ['12 days', '24 days', '47 days', '36 days'],
    correct_answer: '47 days',
  },
]

const SCORING_CONFIG: SurveyScoreConfig = {
  subscales: [
    {
      id: 'CE', name: 'Cognitive Engagement',
      description: 'Drive to engage in effortful thinking (Need for Cognition, NCS-18)',
      question_ids: ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','q11','q12','q13','q14','q15','q16','q17','q18'],
      raw_min: 18, raw_max: 90, normalize: true,
    },
    {
      id: 'ORS', name: 'Open Reasoning Style',
      description: 'Willingness to revise beliefs on new evidence (AOT-13)',
      question_ids: ['q19','q20','q21','q22','q23','q24','q25','q26','q27','q28','q29','q30','q31'],
      raw_min: 13, raw_max: 78, normalize: true,
    },
    {
      id: 'RO', name: 'Reflective Override',
      description: 'Ability to override intuitive answers (CRT-3; 0–3 correct)',
      question_ids: ['qC1','qC2','qC3'],
      raw_min: 0, raw_max: 3, normalize: true,
    },
  ],
  composite: {
    name: 'Reasoning Fluidity (RFA)',
    weights: { CE: 0.40, ORS: 0.40, RO: 0.20 },
  },
  bands: [
    // Composite bands
    { subscale_id: 'composite', min: 80, max: 100, label: 'Fluid Reasoner', description: 'Strong drive + open style + reflective override; thrives in novel, ambiguous spaces.' },
    { subscale_id: 'composite', min: 60, max: 79,  label: 'Engaged Reasoner', description: 'Above-average; may default to intuition under pressure.' },
    { subscale_id: 'composite', min: 40, max: 59,  label: 'Contextual Reasoner', description: 'Domain-dependent; benefits from structured prompting.' },
    { subscale_id: 'composite', min: 20, max: 39,  label: 'Intuitive Processor', description: 'Prefers low-effort heuristics; resists belief revision.' },
    { subscale_id: 'composite', min: 0,  max: 19,  label: 'Anchored Thinker', description: 'High closure-seeking; fast and comfortable over deep and deliberate.' },
    // CE bands
    { subscale_id: 'CE', min: 67, max: 100, label: 'High', description: 'Intellectually driven; seeks complex problems.' },
    { subscale_id: 'CE', min: 34, max: 66,  label: 'Moderate', description: 'Selectively engaged in deep thinking.' },
    { subscale_id: 'CE', min: 0,  max: 33,  label: 'Low', description: 'Prefers low-effort tasks; high-closure style.' },
    // ORS bands
    { subscale_id: 'ORS', min: 67, max: 100, label: 'High', description: 'Epistemically open; updates readily on evidence.' },
    { subscale_id: 'ORS', min: 34, max: 66,  label: 'Moderate', description: 'Situationally open; context-dependent.' },
    { subscale_id: 'ORS', min: 0,  max: 33,  label: 'Low', description: 'Resists belief revision; confirmation bias risk.' },
    // RO bands
    { subscale_id: 'RO', min: 67, max: 100, label: '3/3 — Validated', description: 'Likert profile behaviorally confirmed.' },
    { subscale_id: 'RO', min: 34, max: 66,  label: '2/3 — Plausible', description: 'Partial reflective override; profile plausible.' },
    { subscale_id: 'RO', min: 1,  max: 33,  label: '1/3 — Caution', description: 'Significant intuitive pull; CE/ORS self-report may be inflated.' },
    { subscale_id: 'RO', min: 0,  max: 0,   label: '0/3 — Intuitive', description: 'Strong intuitive processor; Likert scores likely overestimate Gf.' },
  ],
  answer_keys: { qC1: '5 cents', qC2: '5 minutes', qC3: '47 days' },
}

export async function seedThinkSurvey(tenantSlug: string): Promise<{ id: string } | null> {
  const service = createServiceClient()

  const { data: tenant } = await service.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return null

  const { data, error } = await service.from('surveys').insert({
    id: randomUUID(),
    tenant_id: tenant.id,
    title: 'Think Survey — Reasoning Fluidity Assessment',
    description: 'A 34-item hybrid instrument measuring cognitive engagement, open reasoning style, and reflective override. Based on NCS-18, AOT-13, and CRT-3.',
    status: 'draft',
    survey_type: 'standard',
    questions: QUESTIONS,
    scoring_config: SCORING_CONFIG,
    share_token: randomUUID(),
  }).select('id').single()

  if (error) { console.error('seedThinkSurvey error:', error); return null }
  return data
}

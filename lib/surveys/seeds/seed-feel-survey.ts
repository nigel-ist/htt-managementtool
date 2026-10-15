/**
 * Seed data for the Feel Survey (Integrated Personality & Work Values Assessment).
 *
 * Sections:
 *   Section 1 — Big Five Personality / OCEAN   (50 items, 1-5 Likert)
 *   Section 2 — Honesty-Humility / HEXACO      (16 items, 1-5 Likert)
 *   Section 3 — Schwartz Work Values            (30 items, 1-5 Likert)
 */
import { createServiceClient } from '@/lib/supabase/server'
import type { SurveyQuestion, SurveyScoreConfig } from '@/app/[tenant]/surveys/types'
import { randomUUID } from 'crypto'

const S1 = 'Section 1 — Big Five Personality (OCEAN)'
const S2 = 'Section 2 — Honesty-Humility (HEXACO)'
const S3 = 'Section 3 — Schwartz Work Values'

// Helper to build question objects quickly
function q(id: string, text: string, section?: string, reverse?: boolean): SurveyQuestion {
  return { id, text, type: 'likert5', ...(section ? { section } : {}), ...(reverse ? { reverse_scored: true } : {}) }
}

const QUESTIONS: SurveyQuestion[] = [
  // ── Section 1 — Big Five (OCEAN) ──────────────────────────────────────
  q('f1',  'Am the life of the party.', S1),
  q('f2',  'Feel little concern for others.', undefined, true),
  q('f3',  'Am always prepared.'),
  q('f4',  'Get stressed out easily.', undefined, true),
  q('f5',  'Have a rich vocabulary.'),
  q('f6',  "Don't talk a lot.", undefined, true),
  q('f7',  'Am interested in people.'),
  q('f8',  'Leave my belongings around.', undefined, true),
  q('f9',  'Am relaxed most of the time.'),
  q('f10', 'Have difficulty understanding abstract ideas.', undefined, true),
  q('f11', 'Feel comfortable around people.'),
  q('f12', 'Insult people.', undefined, true),
  q('f13', 'Pay attention to details.'),
  q('f14', 'Worry about things.', undefined, true),
  q('f15', 'Have a vivid imagination.'),
  q('f16', 'Keep in the background.', undefined, true),
  q('f17', "Sympathize with others' feelings."),
  q('f18', 'Make a mess of things.', undefined, true),
  q('f19', 'Seldom feel blue.'),
  q('f20', 'Am not interested in abstract ideas.', undefined, true),
  q('f21', 'Start conversations.'),
  q('f22', "Am not interested in other people's problems.", undefined, true),
  q('f23', 'Get chores done right away.'),
  q('f24', 'Am easily disturbed.', undefined, true),
  q('f25', 'Have excellent ideas.'),
  q('f26', 'Have little to say.', undefined, true),
  q('f27', 'Have a soft heart.'),
  q('f28', 'Often forget to put things back in their proper place.', undefined, true),
  q('f29', 'Get upset easily.', undefined, true),
  q('f30', 'Do not have a good imagination.', undefined, true),
  q('f31', 'Talk to a lot of different people at parties.'),
  q('f32', 'Am not really interested in others.', undefined, true),
  q('f33', 'Like order.'),
  q('f34', 'Change my mood a lot.', undefined, true),
  q('f35', 'Am quick to understand things.'),
  q('f36', "Don't like to draw attention to myself.", undefined, true),
  q('f37', 'Take time out for others.'),
  q('f38', 'Shirk my duties.', undefined, true),
  q('f39', 'Have frequent mood swings.', undefined, true),
  q('f40', 'Use difficult words.'),
  q('f41', "Don't mind being the center of attention."),
  q('f42', "Feel others' emotions."),
  q('f43', 'Follow a schedule.'),
  q('f44', 'Get irritated easily.', undefined, true),
  q('f45', 'Spend time reflecting on things.'),
  q('f46', 'Am quiet around strangers.', undefined, true),
  q('f47', 'Make people feel at ease.'),
  q('f48', 'Am exacting in my work.'),
  q('f49', 'Often feel blue.', undefined, true),
  q('f50', 'Am full of ideas.'),

  // ── Section 2 — Honesty-Humility (HEXACO) ────────────────────────────
  q('f51', "I wouldn't pretend to like someone just to get that person to do favors for me.", S2),
  q('f52', 'If I want something from a person I dislike, I will act very nicely toward that person in order to get it.', undefined, true),
  q('f53', "I wouldn't use flattery to get a raise or promotion at work, even if I thought it would succeed."),
  q('f54', "I'm not very good at flattering people to get what I want."),
  q('f55', "If I knew that I could never get caught, I would be willing to steal a million dollars.", undefined, true),
  q('f56', "I would be tempted to buy stolen property if I were sure I wouldn't get in trouble.", undefined, true),
  q('f57', 'I would never accept a bribe, even if it were very large.'),
  q('f58', 'I think that paying taxes is part of a civic duty and would never consider tax fraud, even if I was quite sure I could get away with it.'),
  q('f59', "I'd be tempted to use counterfeit money, if I were sure I could get away with it.", undefined, true),
  q('f60', 'Having a lot of money is not especially important to me.'),
  q('f61', 'I would like to live in a very expensive, high-class neighbourhood.', undefined, true),
  q('f62', 'I would not want people to treat me as though I were superior to them.'),
  q('f63', 'I think that I am an ordinary person.'),
  q('f64', "I wouldn't want people to treat me as though I were superior even if I had become famous."),
  q('f65', 'I am an ordinary person and I don\'t need others to treat me as though I am someone special.'),
  q('f66', 'I think I deserve more respect than the average person.', undefined, true),

  // ── Section 3 — Schwartz Work Values ─────────────────────────────────
  q('f67', 'I love to take on new and exciting challenges at work.', S3),
  q('f68', 'I crave variety and dislike doing the same tasks repeatedly.'),
  q('f69', "I feel most alive at work when I'm doing something that gives me a rush."),
  q('f70', 'Helping my colleagues is one of the most important parts of my job.'),
  q('f71', 'Caring for the wellbeing of the people I work with is central to how I work.'),
  q('f72', 'The greatest satisfaction at work comes from contributing to those around me.'),
  q('f73', 'I believe my work should contribute to a more just and equal society.'),
  q('f74', 'I stand up for people who are treated unfairly in my workplace.'),
  q('f75', 'Protecting the environment and doing socially responsible work matters deeply to me.'),
  q('f76', 'It is important to me to be seen as successful and competent in my role.'),
  q('f77', 'Achieving my professional goals is one of my greatest sources of satisfaction.'),
  q('f78', 'I work hard to demonstrate my capabilities to others.'),
  q('f79', 'I think it is important to follow the rules and procedures in my organization.'),
  q('f80', 'I usually do what my supervisor or team expects of me without questioning it.'),
  q('f81', 'Maintaining order and meeting expectations is an important part of being a good employee.'),
  q('f82', 'I value the freedom to approach my work in my own creative way.'),
  q('f83', 'Having independence in how I do my work is very important to me.'),
  q('f84', 'I hold to my own values and methods at work, even when others disagree.'),
  q('f85', 'It is important that I genuinely enjoy the day-to-day tasks of my work.'),
  q('f86', 'I seek out work that is pleasurable and brings me personal satisfaction.'),
  q('f87', "If I'm not enjoying my work, I don't perform at my best."),
  q('f88', 'Doing things the established way is more important than constantly changing.'),
  q('f89', 'I respect the history and traditions of the organizations I work for.'),
  q('f90', 'Maintaining consistency with how things have always been done matters to me.'),
  q('f91', 'It is important to me to have authority and be in charge at work.'),
  q('f92', 'I aspire to hold a position of power and influence in my organization.'),
  q('f93', 'I value the prestige and status that comes with professional success.'),
  q('f94', 'Having a stable, secure job is one of my top priorities.'),
  q('f95', 'I like to know what to expect at work and prefer predictable environments.'),
  q('f96', 'Job security and a safe, harmonious work environment are very important to me.'),
]

const SCORING_CONFIG: SurveyScoreConfig = {
  subscales: [
    // Big Five — OCEAN (0-40 each, no normalization needed for display)
    { id: 'E', name: 'Extraversion', question_ids: ['f1','f6','f11','f16','f21','f26','f31','f36','f41','f46'], raw_min: 0, raw_max: 40, normalize: false },
    { id: 'A', name: 'Agreeableness', question_ids: ['f2','f7','f12','f17','f22','f27','f32','f37','f42','f47'], raw_min: 0, raw_max: 40, normalize: false },
    { id: 'C', name: 'Conscientiousness', question_ids: ['f3','f8','f13','f18','f23','f28','f33','f38','f43','f48'], raw_min: 0, raw_max: 40, normalize: false },
    { id: 'N', name: 'Neuroticism', question_ids: ['f4','f9','f14','f19','f24','f29','f34','f39','f44','f49'], raw_min: 0, raw_max: 40, normalize: false },
    { id: 'O', name: 'Openness to Experience', question_ids: ['f5','f10','f15','f20','f25','f30','f35','f40','f45','f50'], raw_min: 0, raw_max: 40, normalize: false },
    // HEXACO facets (average of 4 items → 1-5 scale; store as raw sum /4 by convention; raw_min=4, raw_max=20)
    { id: 'SIN', name: 'Sincerity', question_ids: ['f51','f52','f53','f54'], raw_min: 4, raw_max: 20, normalize: false },
    { id: 'FAI', name: 'Fairness', question_ids: ['f55','f56','f57','f58'], raw_min: 4, raw_max: 20, normalize: false },
    { id: 'GRD', name: 'Greed Avoidance', question_ids: ['f59','f60','f61','f62'], raw_min: 4, raw_max: 20, normalize: false },
    { id: 'MOD', name: 'Modesty', question_ids: ['f63','f64','f65','f66'], raw_min: 4, raw_max: 20, normalize: false },
    // Schwartz Work Values (sum of 3 items each → 3-15 range)
    { id: 'STIM', name: 'Stimulation', question_ids: ['f67','f68','f69'], raw_min: 3, raw_max: 15, normalize: false },
    { id: 'BENV', name: 'Benevolence', question_ids: ['f70','f71','f72'], raw_min: 3, raw_max: 15, normalize: false },
    { id: 'UNIV', name: 'Universalism', question_ids: ['f73','f74','f75'], raw_min: 3, raw_max: 15, normalize: false },
    { id: 'ACHV', name: 'Achievement', question_ids: ['f76','f77','f78'], raw_min: 3, raw_max: 15, normalize: false },
    { id: 'CONF', name: 'Conformity', question_ids: ['f79','f80','f81'], raw_min: 3, raw_max: 15, normalize: false },
    { id: 'SELF', name: 'Self-Direction', question_ids: ['f82','f83','f84'], raw_min: 3, raw_max: 15, normalize: false },
    { id: 'HEDO', name: 'Hedonism', question_ids: ['f85','f86','f87'], raw_min: 3, raw_max: 15, normalize: false },
    { id: 'TRAD', name: 'Tradition', question_ids: ['f88','f89','f90'], raw_min: 3, raw_max: 15, normalize: false },
    { id: 'POWR', name: 'Power', question_ids: ['f91','f92','f93'], raw_min: 3, raw_max: 15, normalize: false },
    { id: 'SECU', name: 'Security', question_ids: ['f94','f95','f96'], raw_min: 3, raw_max: 15, normalize: false },
  ],
  bands: [
    // Big Five bands (0-40)
    ...(['E','A','C','O'] as const).flatMap(id => [
      { subscale_id: id, min: 30, max: 40, label: 'High' },
      { subscale_id: id, min: 20, max: 29, label: 'Moderate' },
      { subscale_id: id, min: 0,  max: 19, label: 'Low' },
    ]),
    // Neuroticism reversed interpretation (high = more neurotic)
    { subscale_id: 'N', min: 30, max: 40, label: 'High', description: 'Heightened emotional reactivity; may benefit from structured support.' },
    { subscale_id: 'N', min: 20, max: 29, label: 'Moderate', description: 'Moderate stress sensitivity; generally recovers well.' },
    { subscale_id: 'N', min: 0,  max: 19, label: 'Low', description: 'Calm under pressure; emotionally stable; resilient.' },
    // HEXACO facets (4-20 raw)
    ...(['SIN','FAI','GRD','MOD'] as const).flatMap(id => [
      { subscale_id: id, min: 14, max: 20, label: 'High' },
      { subscale_id: id, min: 10, max: 13, label: 'Moderate' },
      { subscale_id: id, min: 4,  max: 9,  label: 'Low' },
    ]),
    // Schwartz values (3-15)
    ...(['STIM','BENV','UNIV','ACHV','CONF','SELF','HEDO','TRAD','POWR','SECU'] as const).flatMap(id => [
      { subscale_id: id, min: 12, max: 15, label: 'High — Core driver' },
      { subscale_id: id, min: 7,  max: 11, label: 'Moderate — Situational' },
      { subscale_id: id, min: 3,  max: 6,  label: 'Low — Not a significant driver' },
    ]),
  ],
  higher_order: {
    'Openness to Change': ['STIM', 'SELF', 'HEDO'],
    'Self-Enhancement':   ['ACHV', 'POWR'],
    'Conservation':       ['CONF', 'TRAD', 'SECU'],
    'Self-Transcendence': ['BENV', 'UNIV'],
  },
}

export async function seedFeelSurvey(tenantSlug: string): Promise<{ id: string } | null> {
  const service = createServiceClient()

  const { data: tenant } = await service.from('tenants').select('id').eq('slug', tenantSlug).single()
  if (!tenant) return null

  const { data, error } = await service.from('surveys').insert({
    id: randomUUID(),
    tenant_id: tenant.id,
    title: 'Feel Survey — Personality & Work Values Assessment',
    description: 'A 96-item consolidated assessment measuring Big Five personality (OCEAN), Honesty-Humility (HEXACO), and Schwartz Work Values across three sections.',
    status: 'draft',
    survey_type: 'standard',
    questions: QUESTIONS,
    scoring_config: SCORING_CONFIG,
    share_token: randomUUID(),
  }).select('id').single()

  if (error) { console.error('seedFeelSurvey error:', error); return null }
  return data
}

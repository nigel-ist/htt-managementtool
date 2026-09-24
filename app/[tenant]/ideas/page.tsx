import HttCoach from '@/components/htt/HttCoach'
import { getHttStageForUser } from '@/lib/htt/stage'
import Link from 'next/link'
import { getIdeas } from './actions'
import { STATUS_META } from './types'

export const metadata = { title: 'Ideas' }

interface Props { params: { tenant: string } }

export default async function IdeasPage({ params }: Props) {
  const { tenant: slug } = params
  const [ideas, httStage] = await Promise.all([
    getIdeas(slug),
    getHttStageForUser(slug),
  ])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(var(--text-1))]">Ideas</h1>
          <p className="text-sm text-[rgb(var(--text-3))] mt-0.5">{ideas.length} idea{ideas.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href={`/${slug}/ideas/new`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgb(var(--color-primary))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add idea
        </Link>
      </div>

      {ideas.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[rgb(var(--border))] rounded-xl">
          <p className="text-sm text-[rgb(var(--text-3))]">No ideas yet. Capture the first one.</p>
          <Link href={`/${slug}/ideas/new`} className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgb(var(--color-primary))] text-white text-sm font-medium hover:opacity-90 transition-opacity">Add idea</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map(idea => {
            const meta = STATUS_META[idea.status]
            return (
              <Link key={idea.id} href={`/${slug}/ideas/${idea.id}`}
                className="flex items-start gap-3 px-4 py-3 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl hover:border-[rgb(var(--color-primary)/0.4)] transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[rgb(var(--text-1))] group-hover:text-[rgb(var(--color-primary))] transition-colors">{idea.title}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${meta.color}`}>{meta.label}</span>
                  </div>
                  {idea.description && <p className="mt-1 text-xs text-[rgb(var(--text-3))] line-clamp-2">{idea.description}</p>}
                  {idea.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {idea.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[rgb(var(--surface-2))] text-[rgb(var(--text-3))]">{t}</span>)}
                    </div>
                  )}
                </div>
                <span className="text-xs text-[rgb(var(--text-3))] flex-shrink-0 mt-0.5">{new Date(idea.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* HTT Coach */}
      {httStage != null && (
        <div className="mt-10 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-[rgb(var(--text-1))]">HTT Coach</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 font-medium">Idea thinking</span>
          </div>
          <p className="text-xs text-[rgb(var(--text-3))] mb-4">Stage-aware coaching for evaluating ideas, stress-testing assumptions, and deciding what to pursue.</p>
          <HttCoach tenantSlug={slug} stage={httStage} moduleContext="ideas" />
        </div>
      )}
    </div>
  )
}

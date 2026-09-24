import { redirect } from 'next/navigation'
import { createSurvey } from '../actions'
import Link from 'next/link'
import NewSurveyForm from './form'

export default async function NewSurveyPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await Promise.resolve(params)
  async function handleCreate(formData: FormData) {
    'use server'
    await createSurvey(tenant, formData)
    redirect(`/${tenant}/surveys`)
  }
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/${tenant}/surveys`} className="text-sm text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))]">← Back to Surveys</Link>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-1))] mt-2">New Survey</h1>
      </div>
      <NewSurveyForm createAction={handleCreate} />
    </div>
  )
}

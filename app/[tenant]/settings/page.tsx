import { redirect } from 'next/navigation'

interface Props { params: { tenant: string } }

export default function SettingsPage({ params }: Props) {
  redirect(`/${params.tenant}/settings/modules`)
}

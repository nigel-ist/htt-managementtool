import { getModuleRoleSettings } from './actions'
import ModulesAccessClient from './modules-client'

export const metadata = { title: 'Module Access — Settings' }

interface Props { params: { tenant: string } }

export default async function ModuleAccessPage({ params }: Props) {
  const { tenant: slug } = params
  const { enabledModules, roleDefaults } = await getModuleRoleSettings(slug)

  return (
    <ModulesAccessClient
      tenantSlug={slug}
      enabledModules={enabledModules}
      roleDefaults={roleDefaults}
    />
  )
}

import { redirect } from 'next/navigation'

// Static segment "slug" has no content — redirect to the tenants list.
export default function SlugPlaceholderPage() {
  redirect('/admin/tenants')
}

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ElectronicOfferingForm from '@/components/forms/ElectronicOfferingForm'

export default async function AccountingOfferingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  const isAuthorized = profile?.roles?.includes('ACCOUNTING') || profile?.roles?.includes('ADMIN')
  if (!isAuthorized) redirect('/dashboard')

  // Get all active districts
  const { data: districts } = await supabase
    .from('districts')
    .select('*')
    .eq('active', true)
    .order('sort_order')

  return (
    <div className="py-8 px-4">
      <ElectronicOfferingForm districts={districts || []} />
    </div>
  )
}

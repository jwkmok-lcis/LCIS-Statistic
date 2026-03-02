import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getWeeklySummary } from './actions'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Default range: last 4 weeks
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 28)

  const initial = await getWeeklySummary(
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0],
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
      <ReportsClient initial={initial} />
    </div>
  )
}

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProphesyingForm from '@/components/forms/ProphesyingForm'

export default async function ProphesyingPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; district?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const districtId = params.district
  const weekDate = params.week
  if (!districtId || !weekDate) redirect('/leader/dashboard')

  const { data: district } = await supabase
    .from('districts')
    .select('name')
    .eq('id', districtId)
    .single()

  if (!district) redirect('/leader/dashboard')

  let existingCount: number | null = null
  let existingNotes: string | null = null

  const { data: weeklyRecord } = await supabase
    .from('weekly_records')
    .select('id')
    .eq('district_id', districtId)
    .eq('week_date', weekDate)
    .single()

  if (weeklyRecord) {
    const { data: stats } = await supabase
      .from('prophesying_stats')
      .select('prophecy_count, notes')
      .eq('weekly_record_id', weeklyRecord.id)
      .single()

    if (stats) {
      existingCount = stats.prophecy_count
      existingNotes = stats.notes
    }
  }

  return (
    <div className="py-8 px-4">
      <ProphesyingForm
        districtId={districtId}
        districtName={district.name}
        weekDate={weekDate}
        existingCount={existingCount}
        existingNotes={existingNotes}
      />
    </div>
  )
}

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SmallGroupForm from '@/components/forms/SmallGroupForm'

export default async function SmallGroupPage({
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

  let existingAdultCount: number | null = null
  let existingHighschoolerCount: number | null = null
  let existingChildrenCount: number | null = null
  let existingNotes: string | null = null

  const { data: weeklyRecord } = await supabase
    .from('weekly_records')
    .select('id')
    .eq('district_id', districtId)
    .eq('week_date', weekDate)
    .single()

  if (weeklyRecord) {
    const { data: stats } = await supabase
      .from('small_group_stats')
      .select('adult_count, highschooler_count, children_count, notes')
      .eq('weekly_record_id', weeklyRecord.id)
      .single()

    if (stats) {
      existingAdultCount = stats.adult_count
      existingHighschoolerCount = stats.highschooler_count
      existingChildrenCount = stats.children_count
      existingNotes = stats.notes
    }
  }

  return (
    <div className="py-8 px-4">
      <SmallGroupForm
        districtId={districtId}
        districtName={district.name}
        weekDate={weekDate}
        existingAdultCount={existingAdultCount}
        existingHighschoolerCount={existingHighschoolerCount}
        existingChildrenCount={existingChildrenCount}
        existingNotes={existingNotes}
      />
    </div>
  )
}

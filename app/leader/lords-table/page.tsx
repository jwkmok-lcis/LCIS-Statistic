import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LordsTableForm from '@/components/forms/LordsTableForm'

export default async function LordsTablePage({
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

  // Get district name
  const { data: district } = await supabase
    .from('districts')
    .select('name')
    .eq('id', districtId)
    .single()

  if (!district) redirect('/leader/dashboard')

  // Load existing data if any
  let existingAttendance: number | null = null
  let existingNotes: string | null = null

  const { data: weeklyRecord } = await supabase
    .from('weekly_records')
    .select('id')
    .eq('district_id', districtId)
    .eq('week_date', weekDate)
    .single()

  if (weeklyRecord) {
    const { data: stats } = await supabase
      .from('lords_table_stats')
      .select('attendance, notes')
      .eq('weekly_record_id', weeklyRecord.id)
      .single()

    if (stats) {
      existingAttendance = stats.attendance
      existingNotes = stats.notes
    }
  }

  return (
    <div className="py-8 px-4">
      <LordsTableForm
        districtId={districtId}
        districtName={district.name}
        weekDate={weekDate}
        existingAttendance={existingAttendance}
        existingNotes={existingNotes}
      />
    </div>
  )
}

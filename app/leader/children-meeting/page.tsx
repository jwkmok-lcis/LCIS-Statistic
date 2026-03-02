import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AttendanceForm from '@/components/forms/AttendanceForm'
import type { Member } from '@/lib/types'

export default async function ChildrenMeetingPage({
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

  // Get members for this district & meeting type
  const { data: membersData } = await supabase
    .from('members')
    .select('*')
    .eq('district_id', districtId)
    .eq('meeting_type', 'CHILDREN_MEETING')
    .eq('active', true)
    .order('name')

  const members: Member[] = membersData || []

  // Get existing attendance for this week
  let existingAttendance: Record<string, boolean> = {}

  const { data: weeklyRecord } = await supabase
    .from('weekly_records')
    .select('id')
    .eq('district_id', districtId)
    .eq('week_date', weekDate)
    .single()

  if (weeklyRecord) {
    const { data: session } = await supabase
      .from('meeting_sessions')
      .select('id')
      .eq('weekly_record_id', weeklyRecord.id)
      .eq('meeting_type', 'CHILDREN_MEETING')
      .single()

    if (session) {
      const { data: records } = await supabase
        .from('attendance_records')
        .select('member_id, present')
        .eq('meeting_session_id', session.id)

      if (records) {
        records.forEach((r) => {
          existingAttendance[r.member_id] = r.present
        })
      }
    }
  }

  // Initialize members not yet in attendance as absent
  members.forEach((m) => {
    if (!(m.id in existingAttendance)) {
      existingAttendance[m.id] = false
    }
  })

  return (
    <div className="py-8 px-4">
      <AttendanceForm
        districtId={districtId}
        districtName={district.name}
        weekDate={weekDate}
        meetingType="CHILDREN_MEETING"
        meetingLabel="Children's Meeting"
        members={members}
        existingAttendance={existingAttendance}
      />
    </div>
  )
}

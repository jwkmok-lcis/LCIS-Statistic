'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Get or create a weekly record for a district+week
export async function getOrCreateWeeklyRecord(districtId: string, weekDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Try to find existing
  const { data: existing } = await supabase
    .from('weekly_records')
    .select('*')
    .eq('district_id', districtId)
    .eq('week_date', weekDate)
    .single()

  if (existing) return existing

  // Create new
  const { data, error } = await supabase
    .from('weekly_records')
    .insert({
      district_id: districtId,
      week_date: weekDate,
      submitted_by: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Save Lord's Table stats
export async function saveLordsTableStats(weeklyRecordId: string, attendance: number, notes?: string) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('lords_table_stats')
    .select('id')
    .eq('weekly_record_id', weeklyRecordId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('lords_table_stats')
      .update({ attendance, notes })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('lords_table_stats')
      .insert({ weekly_record_id: weeklyRecordId, attendance, notes })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/leader/dashboard')
}

// Save Prophesying stats
export async function saveProphesyingStats(weeklyRecordId: string, prophecyCount: number, notes?: string) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('prophesying_stats')
    .select('id')
    .eq('weekly_record_id', weeklyRecordId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('prophesying_stats')
      .update({ prophecy_count: prophecyCount, notes })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('prophesying_stats')
      .insert({ weekly_record_id: weeklyRecordId, prophecy_count: prophecyCount, notes })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/leader/dashboard')
}

// Save Small Group stats
export async function saveSmallGroupStats(
  weeklyRecordId: string,
  adultCount: number,
  highschoolerCount: number,
  childrenCount: number,
  notes?: string
) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('small_group_stats')
    .select('id')
    .eq('weekly_record_id', weeklyRecordId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('small_group_stats')
      .update({
        adult_count: adultCount,
        highschooler_count: highschoolerCount,
        children_count: childrenCount,
        notes,
      })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('small_group_stats')
      .insert({
        weekly_record_id: weeklyRecordId,
        adult_count: adultCount,
        highschooler_count: highschoolerCount,
        children_count: childrenCount,
        notes,
      })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/leader/dashboard')
}

// Save offering record (upsert per category)
export async function saveOfferingRecord(
  weeklyRecordId: string,
  category: string,
  envelopeCount: number,
  totalAmount: number,
  notes?: string
) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('offering_records')
    .select('id')
    .eq('weekly_record_id', weeklyRecordId)
    .eq('category', category)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('offering_records')
      .update({ envelope_count: envelopeCount, total_amount: totalAmount, notes })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('offering_records')
      .insert({
        weekly_record_id: weeklyRecordId,
        category,
        envelope_count: envelopeCount,
        total_amount: totalAmount,
        notes,
      })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/leader/dashboard')
}

// Save attendance for a meeting session (bulk upsert)
export async function saveAttendance(
  weeklyRecordId: string,
  meetingType: 'CHILDREN_MEETING' | 'YOUTH_MEETING',
  attendanceMap: Record<string, boolean> // memberId -> present
) {
  const supabase = await createClient()

  // Get or create meeting session
  let { data: session } = await supabase
    .from('meeting_sessions')
    .select('id')
    .eq('weekly_record_id', weeklyRecordId)
    .eq('meeting_type', meetingType)
    .single()

  if (!session) {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .insert({ weekly_record_id: weeklyRecordId, meeting_type: meetingType })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    session = data
  }

  // For each member, upsert attendance
  for (const [memberId, present] of Object.entries(attendanceMap)) {
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('meeting_session_id', session.id)
      .eq('member_id', memberId)
      .single()

    if (existing) {
      await supabase
        .from('attendance_records')
        .update({ present })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('attendance_records')
        .insert({
          meeting_session_id: session.id,
          member_id: memberId,
          present,
        })
    }
  }

  revalidatePath('/leader/dashboard')
}

// Add a member (children or youth)
export async function addMember(
  districtId: string,
  meetingType: 'CHILDREN_MEETING' | 'YOUTH_MEETING',
  name: string,
  schoolYear?: string,
  dateOfBirth?: string,
  gender?: string,
  parentContact?: string,
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('members')
    .insert({
      district_id: districtId,
      meeting_type: meetingType,
      name,
      school_year: schoolYear || null,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      parent_contact: parentContact || null,
    })

  if (error) throw new Error(error.message)
  revalidatePath('/leader')
}

// Update a member
export async function updateMember(
  memberId: string,
  updates: { name?: string; school_year?: string; date_of_birth?: string; gender?: string; parent_contact?: string; active?: boolean }
) {
  const supabase = await createClient()
  const { error } = await supabase.from('members').update(updates).eq('id', memberId)
  if (error) throw new Error(error.message)
  revalidatePath('/leader')
}

'use server'

import { createClient } from '@/utils/supabase/server'

export async function getWeeklySummary(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get all districts
  const { data: districts } = await supabase
    .from('districts')
    .select('id, name')
    .eq('active', true)
    .order('sort_order')

  if (!districts) return { districts: [], weeks: [], data: {} }

  // Get weekly records in range
  const { data: weeklyRecords } = await supabase
    .from('weekly_records')
    .select('id, district_id, week_date')
    .gte('week_date', startDate)
    .lte('week_date', endDate)
    .order('week_date', { ascending: false })

  if (!weeklyRecords || weeklyRecords.length === 0) {
    const weeks = getWeeksBetween(startDate, endDate)
    return { districts, weeks, data: {} }
  }

  const recordIds = weeklyRecords.map(r => r.id)

  // Fetch all stats in parallel
  const [lordsTable, prophesying, smallGroup, offerings, electronicOfferings] = await Promise.all([
    supabase.from('lords_table_stats').select('weekly_record_id, attendance').in('weekly_record_id', recordIds),
    supabase.from('prophesying_stats').select('weekly_record_id, prophecy_count').in('weekly_record_id', recordIds),
    supabase.from('small_group_stats').select('weekly_record_id, adult_count, highschooler_count, children_count').in('weekly_record_id', recordIds),
    supabase.from('offering_records').select('weekly_record_id, category, envelope_count, total_amount').in('weekly_record_id', recordIds),
    supabase.from('electronic_offerings').select('district_id, week_date, category, amount').gte('week_date', startDate).lte('week_date', endDate),
  ])

  // Get attendance data
  const [sessions] = await Promise.all([
    supabase.from('meeting_sessions').select('id, weekly_record_id, meeting_type').in('weekly_record_id', recordIds),
  ])
  
  const attendanceCounts: Record<string, { present: number; total: number }> = {}
  if (sessions.data && sessions.data.length > 0) {
    const sessionIds = sessions.data.map(s => s.id)
    const { data: attendanceData } = await supabase
      .from('attendance_records')
      .select('meeting_session_id, present')
      .in('meeting_session_id', sessionIds)

    if (attendanceData) {
      // Group by session
      for (const rec of attendanceData) {
        if (!attendanceCounts[rec.meeting_session_id]) {
          attendanceCounts[rec.meeting_session_id] = { present: 0, total: 0 }
        }
        attendanceCounts[rec.meeting_session_id].total++
        if (rec.present) attendanceCounts[rec.meeting_session_id].present++
      }
    }
  }

  // Build lookup: recordId -> { districtId, weekDate }
  const recordMap: Record<string, { district_id: string; week_date: string }> = {}
  for (const r of weeklyRecords) {
    recordMap[r.id] = { district_id: r.district_id, week_date: r.week_date }
  }

  // Build data: { "districtId:weekDate": { ... } }
  type CellData = {
    lordsTable: number | null
    prophesying: number | null
    smallGroup: { adults: number; highschoolers: number; children: number } | null
    offerings: { envelopes: number; amount: number }
    electronicOfferings: number
    childrenAttendance: { present: number; total: number } | null
    youthAttendance: { present: number; total: number } | null
  }

  const data: Record<string, CellData> = {}

  function getCell(districtId: string, weekDate: string): CellData {
    const key = `${districtId}:${weekDate}`
    if (!data[key]) {
      data[key] = {
        lordsTable: null,
        prophesying: null,
        smallGroup: null,
        offerings: { envelopes: 0, amount: 0 },
        electronicOfferings: 0,
        childrenAttendance: null,
        youthAttendance: null,
      }
    }
    return data[key]
  }

  // Lord's Table
  for (const lt of lordsTable.data || []) {
    const rec = recordMap[lt.weekly_record_id]
    if (rec) getCell(rec.district_id, rec.week_date).lordsTable = lt.attendance
  }

  // Prophesying
  for (const pr of prophesying.data || []) {
    const rec = recordMap[pr.weekly_record_id]
    if (rec) getCell(rec.district_id, rec.week_date).prophesying = pr.prophecy_count
  }

  // Small Group
  for (const sg of smallGroup.data || []) {
    const rec = recordMap[sg.weekly_record_id]
    if (rec) {
      getCell(rec.district_id, rec.week_date).smallGroup = {
        adults: sg.adult_count,
        highschoolers: sg.highschooler_count,
        children: sg.children_count,
      }
    }
  }

  // Offerings
  for (const of_ of offerings.data || []) {
    const rec = recordMap[of_.weekly_record_id]
    if (rec) {
      const cell = getCell(rec.district_id, rec.week_date)
      cell.offerings.envelopes += of_.envelope_count
      cell.offerings.amount += of_.total_amount
    }
  }

  // Electronic offerings
  for (const eo of electronicOfferings.data || []) {
    getCell(eo.district_id, eo.week_date).electronicOfferings += eo.amount
  }

  // Attendance
  for (const session of sessions.data || []) {
    const rec = recordMap[session.weekly_record_id]
    if (rec && attendanceCounts[session.id]) {
      const cell = getCell(rec.district_id, rec.week_date)
      if (session.meeting_type === 'CHILDREN_MEETING') {
        cell.childrenAttendance = attendanceCounts[session.id]
      } else if (session.meeting_type === 'YOUTH_MEETING') {
        cell.youthAttendance = attendanceCounts[session.id]
      }
    }
  }

  const weeks = getWeeksBetween(startDate, endDate)

  return { districts, weeks, data }
}

function getWeeksBetween(start: string, end: string): string[] {
  const weeks: string[] = []
  const startD = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  
  // Start from the first Sunday on or after startDate
  const d = new Date(startD)
  const dayOfWeek = d.getDay()
  if (dayOfWeek !== 0) d.setDate(d.getDate() + (7 - dayOfWeek))
  
  while (d <= endD) {
    weeks.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() + 7)
  }
  
  return weeks.reverse() // most recent first
}

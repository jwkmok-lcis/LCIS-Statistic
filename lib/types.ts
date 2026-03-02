export type UserRole = 'ADMIN' | 'DISTRICT_LEADER' | 'ACCOUNTING' | 'CHILDREN_COORDINATOR' | 'YOUTH_COORDINATOR'

export type MeetingType = 'LORDS_TABLE' | 'PROPHESYING' | 'CHILDREN_MEETING' | 'YOUTH_MEETING' | 'SMALL_GROUP'

export type OfferingCategory = 'GENERAL' | 'BUILDING_PROJECT' | 'SPECIFIC_PURPOSE' | 'DESIGNATED' | 'SPECIAL_PLEDGE'

export interface Profile {
  id: string
  email: string
  name: string
  roles: UserRole[]
  active: boolean
  created_at: string
  updated_at: string
}

export interface District {
  id: string
  name: string
  description: string | null
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface UserDistrict {
  id: string
  user_id: string
  district_id: string
  created_at: string
}

export interface WeeklyRecord {
  id: string
  district_id: string
  week_date: string
  submitted_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  district?: District
}

export interface LordsTableStats {
  id: string
  weekly_record_id: string
  attendance: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ProphesyingStats {
  id: string
  weekly_record_id: string
  prophecy_count: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SmallGroupStats {
  id: string
  weekly_record_id: string
  adult_count: number
  highschooler_count: number
  children_count: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  district_id: string
  meeting_type: 'CHILDREN_MEETING' | 'YOUTH_MEETING'
  name: string
  date_of_birth: string | null
  school_year: string | null
  gender: 'M' | 'F' | null
  parent_contact: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface MeetingSession {
  id: string
  weekly_record_id: string
  meeting_type: 'CHILDREN_MEETING' | 'YOUTH_MEETING'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  meeting_session_id: string
  member_id: string
  present: boolean
  notes: string | null
  created_at: string
  // Joined
  member?: Member
}

export interface OfferingRecord {
  id: string
  weekly_record_id: string
  category: OfferingCategory
  envelope_count: number
  total_amount: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ElectronicOffering {
  id: string
  district_id: string
  week_date: string
  category: OfferingCategory
  amount: number
  reference: string | null
  entered_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PledgeCampaign {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface PledgeRecord {
  id: string
  pledge_campaign_id: string
  district_id: string
  week_date: string
  envelope_count: number
  total_amount: number
  notes: string | null
  entered_by: string | null
  created_at: string
  updated_at: string
}

export interface ChurchEvent {
  id: string
  name: string
  event_date: string | null
  end_date: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface EventParticipation {
  id: string
  event_id: string
  district_id: string
  participant_count: number
  notes: string | null
  created_at: string
  updated_at: string
}

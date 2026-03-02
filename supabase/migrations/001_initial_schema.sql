-- ============================================================
-- Church Statistics App - Initial Database Schema
-- ============================================================

-- ==================== ENUMS ====================

CREATE TYPE user_role AS ENUM ('ADMIN', 'DISTRICT_LEADER', 'ACCOUNTING', 'CHILDREN_COORDINATOR', 'YOUTH_COORDINATOR');
CREATE TYPE meeting_type AS ENUM (
  'LORDS_TABLE',
  'PROPHESYING',
  'CHILDREN_MEETING',
  'YOUTH_MEETING',
  'SMALL_GROUP'
);
CREATE TYPE offering_category AS ENUM (
  'GENERAL',
  'BUILDING_PROJECT',
  'SPECIFIC_PURPOSE',
  'DESIGNATED',
  'SPECIAL_PLEDGE'
);

-- ==================== CORE TABLES ====================

-- Districts / Zones
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE districts IS 'Church districts/zones. Each district submits weekly statistics independently.';

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  roles user_role[] NOT NULL DEFAULT '{DISTRICT_LEADER}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles with role array. A user can hold multiple roles.';

-- Which districts a user can manage
CREATE TABLE user_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, district_id)
);

COMMENT ON TABLE user_districts IS 'Maps users to districts they can submit statistics for.';

-- ==================== WEEKLY SERVICE RECORDS ====================

-- Weekly service record (one per district per week)
CREATE TABLE weekly_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
  week_date DATE NOT NULL,  -- always a Lord's Day (Sunday) date
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(district_id, week_date)
);

COMMENT ON TABLE weekly_records IS 'One record per district per week. Parent for all meeting stats that week.';

-- Lord's Table Meeting stats
CREATE TABLE lords_table_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_record_id UUID NOT NULL REFERENCES weekly_records(id) ON DELETE CASCADE,
  attendance INTEGER NOT NULL DEFAULT 0 CHECK (attendance >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(weekly_record_id)
);

COMMENT ON TABLE lords_table_stats IS 'Lord''s Table Meeting attendance (high schooler age and above).';

-- Prophesying Meeting stats
CREATE TABLE prophesying_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_record_id UUID NOT NULL REFERENCES weekly_records(id) ON DELETE CASCADE,
  prophecy_count INTEGER NOT NULL DEFAULT 0 CHECK (prophecy_count >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(weekly_record_id)
);

COMMENT ON TABLE prophesying_stats IS 'Prophesying Meeting stats. Tracks number of prophecies given.';

-- Small Group Meeting stats
CREATE TABLE small_group_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_record_id UUID NOT NULL REFERENCES weekly_records(id) ON DELETE CASCADE,
  adult_count INTEGER NOT NULL DEFAULT 0 CHECK (adult_count >= 0),
  highschooler_count INTEGER NOT NULL DEFAULT 0 CHECK (highschooler_count >= 0),
  children_count INTEGER NOT NULL DEFAULT 0 CHECK (children_count >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(weekly_record_id)
);

COMMENT ON TABLE small_group_stats IS 'Small Group Meeting stats. Separate counts for adults, high schoolers, children.';

-- ==================== MEMBERSHIP-BASED MEETINGS ====================
-- (Children's Meeting & Youth Meeting have member rosters with weekly attendance)

-- Members (children and youth)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
  meeting_type meeting_type NOT NULL CHECK (meeting_type IN ('CHILDREN_MEETING', 'YOUTH_MEETING')),
  name TEXT NOT NULL,
  date_of_birth DATE,
  school_year TEXT,  -- e.g. 'Year 7', 'Grade 10', 'P5'
  gender TEXT CHECK (gender IN ('M', 'F', NULL)),
  parent_contact TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE members IS 'Roster of children and youth for membership-tracked meetings.';
CREATE INDEX idx_members_district ON members(district_id);
CREATE INDEX idx_members_meeting_type ON members(meeting_type);

-- Weekly meeting sessions (one per meeting type per district per week)
CREATE TABLE meeting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_record_id UUID NOT NULL REFERENCES weekly_records(id) ON DELETE CASCADE,
  meeting_type meeting_type NOT NULL CHECK (meeting_type IN ('CHILDREN_MEETING', 'YOUTH_MEETING')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(weekly_record_id, meeting_type)
);

COMMENT ON TABLE meeting_sessions IS 'A specific children''s or youth meeting session for a given week.';

-- Attendance records (per member per session)
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_session_id UUID NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meeting_session_id, member_id)
);

COMMENT ON TABLE attendance_records IS 'Individual attendance check for each member in a meeting session.';
CREATE INDEX idx_attendance_session ON attendance_records(meeting_session_id);
CREATE INDEX idx_attendance_member ON attendance_records(member_id);

-- ==================== OFFERINGS ====================

-- Weekly offering record (per district per week per category)
CREATE TABLE offering_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_record_id UUID NOT NULL REFERENCES weekly_records(id) ON DELETE CASCADE,
  category offering_category NOT NULL,
  envelope_count INTEGER NOT NULL DEFAULT 0 CHECK (envelope_count >= 0),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(weekly_record_id, category)
);

COMMENT ON TABLE offering_records IS 'Offering tallies per category per district per week. Counts envelopes and total amount.';

-- Electronic offerings (entered by accounting per district)
CREATE TABLE electronic_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
  week_date DATE NOT NULL,
  category offering_category NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  reference TEXT,  -- bank reference / transaction ID
  entered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE electronic_offerings IS 'Electronic offerings recorded by accounting. Separate from physical envelope counts.';
CREATE INDEX idx_electronic_offerings_district_week ON electronic_offerings(district_id, week_date);

-- Special pledge offerings (dynamic fields — admin can create new pledge campaigns)
CREATE TABLE pledge_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pledge_campaigns IS 'Special pledge offering campaigns. Admin can create new ones as needed.';

-- Pledge offering records per district per week per campaign
CREATE TABLE pledge_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_campaign_id UUID NOT NULL REFERENCES pledge_campaigns(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
  week_date DATE NOT NULL,
  envelope_count INTEGER NOT NULL DEFAULT 0 CHECK (envelope_count >= 0),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  notes TEXT,
  entered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pledge_campaign_id, district_id, week_date)
);

COMMENT ON TABLE pledge_records IS 'Pledge offering records per district per week for a specific campaign.';

-- ==================== EVENT PARTICIPATION (Reporting Only) ====================

-- Event definitions (for reporting integration with external registration app)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_date DATE,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE events IS 'Event definitions for reporting. Registration handled by external app.';

-- Event participation counts per district (imported or manually entered for reports)
CREATE TABLE event_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
  participant_count INTEGER NOT NULL DEFAULT 0 CHECK (participant_count >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, district_id)
);

COMMENT ON TABLE event_participation IS 'Event participation counts per district. Used for reports only.';

-- ==================== TRIGGERS ====================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER trg_districts_updated_at BEFORE UPDATE ON districts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_weekly_records_updated_at BEFORE UPDATE ON weekly_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_lords_table_stats_updated_at BEFORE UPDATE ON lords_table_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_prophesying_stats_updated_at BEFORE UPDATE ON prophesying_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_small_group_stats_updated_at BEFORE UPDATE ON small_group_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_meeting_sessions_updated_at BEFORE UPDATE ON meeting_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_offering_records_updated_at BEFORE UPDATE ON offering_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_electronic_offerings_updated_at BEFORE UPDATE ON electronic_offerings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pledge_campaigns_updated_at BEFORE UPDATE ON pledge_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pledge_records_updated_at BEFORE UPDATE ON pledge_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_event_participation_updated_at BEFORE UPDATE ON event_participation FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==================== AUTO-CREATE PROFILE ON SIGNUP ====================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==================== PERFORMANCE INDEXES ====================

CREATE INDEX idx_weekly_records_district_week ON weekly_records(district_id, week_date);
CREATE INDEX idx_weekly_records_week_date ON weekly_records(week_date);
CREATE INDEX idx_offering_records_weekly ON offering_records(weekly_record_id);
CREATE INDEX idx_pledge_records_campaign ON pledge_records(pledge_campaign_id);
CREATE INDEX idx_user_districts_user ON user_districts(user_id);
CREATE INDEX idx_user_districts_district ON user_districts(district_id);

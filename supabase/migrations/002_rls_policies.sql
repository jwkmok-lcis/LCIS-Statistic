-- ============================================================
-- Church Statistics App - Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lords_table_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE prophesying_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE small_group_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE offering_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledge_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledge_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participation ENABLE ROW LEVEL SECURITY;

-- ==================== HELPER FUNCTIONS ====================

CREATE OR REPLACE FUNCTION get_user_roles(uid UUID)
RETURNS user_role[] AS $$
  SELECT roles FROM profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT 'ADMIN' = ANY(roles) FROM profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_has_district(uid UUID, did UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_districts WHERE user_id = uid AND district_id = did
  ) OR is_admin(uid);
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_role(uid UUID, r user_role)
RETURNS BOOLEAN AS $$
  SELECT r = ANY(roles) FROM profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER;

-- ==================== PROFILES ====================

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL USING (is_admin(auth.uid()));

-- ==================== DISTRICTS ====================

CREATE POLICY "Everyone can view active districts"
  ON districts FOR SELECT USING (active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage districts"
  ON districts FOR ALL USING (is_admin(auth.uid()));

-- ==================== USER_DISTRICTS ====================

CREATE POLICY "Users can view own district assignments"
  ON user_districts FOR SELECT USING (
    user_id = auth.uid() OR is_admin(auth.uid())
  );

CREATE POLICY "Admins can manage district assignments"
  ON user_districts FOR ALL USING (is_admin(auth.uid()));

-- ==================== WEEKLY RECORDS ====================

-- Users can view records for their assigned districts
CREATE POLICY "Users can view own district weekly records"
  ON weekly_records FOR SELECT USING (
    user_has_district(auth.uid(), district_id)
  );

-- Users can insert records for their assigned districts
CREATE POLICY "Leaders can create weekly records for their districts"
  ON weekly_records FOR INSERT WITH CHECK (
    user_has_district(auth.uid(), district_id)
  );

-- Users can update records for their assigned districts
CREATE POLICY "Leaders can update weekly records for their districts"
  ON weekly_records FOR UPDATE USING (
    user_has_district(auth.uid(), district_id)
  );

-- Admins can delete
CREATE POLICY "Admins can delete weekly records"
  ON weekly_records FOR DELETE USING (is_admin(auth.uid()));

-- ==================== LORD'S TABLE STATS ====================

CREATE POLICY "View lords table stats via weekly record"
  ON lords_table_stats FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

CREATE POLICY "Insert lords table stats via weekly record"
  ON lords_table_stats FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

CREATE POLICY "Update lords table stats via weekly record"
  ON lords_table_stats FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

-- ==================== PROPHESYING STATS ====================

CREATE POLICY "View prophesying stats via weekly record"
  ON prophesying_stats FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

CREATE POLICY "Insert prophesying stats via weekly record"
  ON prophesying_stats FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

CREATE POLICY "Update prophesying stats via weekly record"
  ON prophesying_stats FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

-- ==================== SMALL GROUP STATS ====================

CREATE POLICY "View small group stats via weekly record"
  ON small_group_stats FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

CREATE POLICY "Insert small group stats via weekly record"
  ON small_group_stats FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

CREATE POLICY "Update small group stats via weekly record"
  ON small_group_stats FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

-- ==================== MEMBERS ====================

CREATE POLICY "View members in own districts"
  ON members FOR SELECT USING (
    user_has_district(auth.uid(), district_id)
  );

CREATE POLICY "Coordinators and admins can insert members"
  ON members FOR INSERT WITH CHECK (
    user_has_district(auth.uid(), district_id)
    AND (
      is_admin(auth.uid())
      OR has_role(auth.uid(), 'CHILDREN_COORDINATOR')
      OR has_role(auth.uid(), 'YOUTH_COORDINATOR')
      OR has_role(auth.uid(), 'DISTRICT_LEADER')
    )
  );

CREATE POLICY "Coordinators and admins can update members"
  ON members FOR UPDATE USING (
    user_has_district(auth.uid(), district_id)
    AND (
      is_admin(auth.uid())
      OR has_role(auth.uid(), 'CHILDREN_COORDINATOR')
      OR has_role(auth.uid(), 'YOUTH_COORDINATOR')
      OR has_role(auth.uid(), 'DISTRICT_LEADER')
    )
  );

-- ==================== MEETING SESSIONS ====================

CREATE POLICY "View meeting sessions via weekly record"
  ON meeting_sessions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

CREATE POLICY "Insert meeting sessions via weekly record"
  ON meeting_sessions FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

CREATE POLICY "Update meeting sessions via weekly record"
  ON meeting_sessions FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

-- ==================== ATTENDANCE RECORDS ====================

CREATE POLICY "View attendance via meeting session"
  ON attendance_records FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meeting_sessions ms
      JOIN weekly_records wr ON wr.id = ms.weekly_record_id
      WHERE ms.id = meeting_session_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

CREATE POLICY "Insert attendance via meeting session"
  ON attendance_records FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM meeting_sessions ms
      JOIN weekly_records wr ON wr.id = ms.weekly_record_id
      WHERE ms.id = meeting_session_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

CREATE POLICY "Update attendance via meeting session"
  ON attendance_records FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM meeting_sessions ms
      JOIN weekly_records wr ON wr.id = ms.weekly_record_id
      WHERE ms.id = meeting_session_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

-- ==================== OFFERING RECORDS ====================

CREATE POLICY "View offering records via weekly record"
  ON offering_records FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

CREATE POLICY "Leaders can insert offering records"
  ON offering_records FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

CREATE POLICY "Leaders can update offering records"
  ON offering_records FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM weekly_records wr
      WHERE wr.id = weekly_record_id
      AND user_has_district(auth.uid(), wr.district_id)
    )
  );

-- ==================== ELECTRONIC OFFERINGS ====================

CREATE POLICY "View electronic offerings"
  ON electronic_offerings FOR SELECT USING (
    is_admin(auth.uid())
    OR has_role(auth.uid(), 'ACCOUNTING')
    OR user_has_district(auth.uid(), district_id)
  );

CREATE POLICY "Accounting and admins can insert electronic offerings"
  ON electronic_offerings FOR INSERT WITH CHECK (
    is_admin(auth.uid()) OR has_role(auth.uid(), 'ACCOUNTING')
  );

CREATE POLICY "Accounting and admins can update electronic offerings"
  ON electronic_offerings FOR UPDATE USING (
    is_admin(auth.uid()) OR has_role(auth.uid(), 'ACCOUNTING')
  );

CREATE POLICY "Admins can delete electronic offerings"
  ON electronic_offerings FOR DELETE USING (is_admin(auth.uid()));

-- ==================== PLEDGE CAMPAIGNS ====================

CREATE POLICY "Everyone can view active pledge campaigns"
  ON pledge_campaigns FOR SELECT USING (active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage pledge campaigns"
  ON pledge_campaigns FOR ALL USING (is_admin(auth.uid()));

-- ==================== PLEDGE RECORDS ====================

CREATE POLICY "View pledge records for own districts"
  ON pledge_records FOR SELECT USING (
    user_has_district(auth.uid(), district_id)
  );

CREATE POLICY "Leaders can insert pledge records"
  ON pledge_records FOR INSERT WITH CHECK (
    user_has_district(auth.uid(), district_id)
  );

CREATE POLICY "Leaders can update pledge records"
  ON pledge_records FOR UPDATE USING (
    user_has_district(auth.uid(), district_id)
  );

-- ==================== EVENTS (Reporting Only) ====================

CREATE POLICY "Everyone can view events"
  ON events FOR SELECT USING (true);

CREATE POLICY "Admins can manage events"
  ON events FOR ALL USING (is_admin(auth.uid()));

-- ==================== EVENT PARTICIPATION ====================

CREATE POLICY "View event participation for own districts"
  ON event_participation FOR SELECT USING (
    user_has_district(auth.uid(), district_id) OR is_admin(auth.uid())
  );

CREATE POLICY "Admins can manage event participation"
  ON event_participation FOR ALL USING (is_admin(auth.uid()));

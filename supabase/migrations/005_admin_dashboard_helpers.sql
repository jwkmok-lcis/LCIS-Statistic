-- Add helper function for admin dashboard alerts
CREATE OR REPLACE FUNCTION count_users_without_districts()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::integer
  FROM profiles p
  WHERE p.active = true
    AND NOT EXISTS (
      SELECT 1 FROM user_districts ud WHERE ud.user_id = p.id
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION count_users_without_districts() TO authenticated;

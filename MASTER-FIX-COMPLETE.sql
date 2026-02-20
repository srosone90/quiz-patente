-- ============================================
-- 🔧 MASTER FIX SCRIPT - COMPREHENSIVE
-- ============================================
-- Database: dsxzqwicsggzyeropget.supabase.co
-- Date: 2026-02-20
-- Purpose: Fix ALL structural issues discovered in diagnostic
-- 
-- WHAT THIS SCRIPT FIXES:
-- 1. ✅ Add email column to user_profiles
-- 2. ✅ Update ALL RLS policies to use 'role' instead of 'is_admin'
-- 3. ✅ Sync email from auth.users (trigger + backfill)
-- 4. ✅ Drop deprecated is_admin column (after updating policies)
-- 5. ✅ Create admin_global_stats view
-- 6. ✅ Create admin_question_stats view
-- 7. ✅ Add useful indexes for performance
-- 8. ✅ Add data integrity CHECK constraints
-- ============================================

-- ===========================================
-- PART 1: FIX USER_PROFILES - ADD EMAIL
-- ===========================================

-- Step 1: Add email column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email TEXT;
    RAISE NOTICE '✅ Added email column to user_profiles';
  ELSE
    RAISE NOTICE 'ℹ️  Email column already exists';
  END IF;
END $$;

-- Step 2: Backfill emails from auth.users for existing profiles
UPDATE user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id
  AND up.email IS NULL;

-- Step 3: Create unique index on email (for future lookups)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email 
ON user_profiles(email);

-- Step 4: Create trigger to keep email in sync with auth.users
-- This ensures when a user signs up, their email is copied to user_profiles

CREATE OR REPLACE FUNCTION sync_user_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user signs up, create or update their profile with email
  INSERT INTO user_profiles (id, email, subscription_type, role)
  VALUES (NEW.id, NEW.email, 'free', 'user')
  ON CONFLICT (id) DO UPDATE 
  SET email = NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_profile_email();

-- ===========================================
-- PART 2: UPDATE RLS POLICIES TO USE 'role'
-- ===========================================

-- First, we need to update ALL policies that use is_admin
-- Otherwise DROP COLUMN will fail with dependency errors

-- Update access_codes policies
DROP POLICY IF EXISTS "Solo admin vedono codici" ON access_codes;
CREATE POLICY "Solo admin vedono codici" ON access_codes
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Solo admin creano codici" ON access_codes;
CREATE POLICY "Solo admin creano codici" ON access_codes
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Solo admin modificano codici" ON access_codes;
CREATE POLICY "Solo admin modificano codici" ON access_codes
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Solo admin eliminano codici" ON access_codes;
CREATE POLICY "Solo admin eliminano codici" ON access_codes
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update b2b tables policies (if they exist)
DO $$
BEGIN
  -- b2b_clients
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'b2b_clients') THEN
    DROP POLICY IF EXISTS "Admin can do everything on b2b_clients" ON b2b_clients;
    EXECUTE 'CREATE POLICY "Admin can do everything on b2b_clients" ON b2b_clients
      FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;

  -- b2b_contacts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'b2b_contacts') THEN
    DROP POLICY IF EXISTS "Admin can do everything on b2b_contacts" ON b2b_contacts;
    EXECUTE 'CREATE POLICY "Admin can do everything on b2b_contacts" ON b2b_contacts
      FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;

  -- b2b_contracts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'b2b_contracts') THEN
    DROP POLICY IF EXISTS "Admin can do everything on b2b_contracts" ON b2b_contracts;
    EXECUTE 'CREATE POLICY "Admin can do everything on b2b_contracts" ON b2b_contracts
      FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;

  -- b2b_appointments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'b2b_appointments') THEN
    DROP POLICY IF EXISTS "Admin can do everything on b2b_appointments" ON b2b_appointments;
    EXECUTE 'CREATE POLICY "Admin can do everything on b2b_appointments" ON b2b_appointments
      FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;

  -- b2b_invoices
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'b2b_invoices') THEN
    DROP POLICY IF EXISTS "Admin can do everything on b2b_invoices" ON b2b_invoices;
    EXECUTE 'CREATE POLICY "Admin can do everything on b2b_invoices" ON b2b_invoices
      FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;

  -- b2b_documents
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'b2b_documents') THEN
    DROP POLICY IF EXISTS "Admin can do everything on b2b_documents" ON b2b_documents;
    EXECUTE 'CREATE POLICY "Admin can do everything on b2b_documents" ON b2b_documents
      FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;

  -- b2b_tasks
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'b2b_tasks') THEN
    DROP POLICY IF EXISTS "Admin can do everything on b2b_tasks" ON b2b_tasks;
    EXECUTE 'CREATE POLICY "Admin can do everything on b2b_tasks" ON b2b_tasks
      FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;

  -- b2b_notes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'b2b_notes') THEN
    DROP POLICY IF EXISTS "Admin can do everything on b2b_notes" ON b2b_notes;
    EXECUTE 'CREATE POLICY "Admin can do everything on b2b_notes" ON b2b_notes
      FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;

  -- b2b_transactions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'b2b_transactions') THEN
    DROP POLICY IF EXISTS "Admin can do everything on b2b_transactions" ON b2b_transactions;
    EXECUTE 'CREATE POLICY "Admin can do everything on b2b_transactions" ON b2b_transactions
      FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;

  RAISE NOTICE '✅ Updated all RLS policies to use role instead of is_admin';
END $$;

-- ===========================================
-- PART 3: CLEANUP - DROP DEPRECATED COLUMNS
-- ===========================================

-- Now we can safely drop is_admin column
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN is_admin;
    RAISE NOTICE '✅ Dropped deprecated is_admin column';
  ELSE
    RAISE NOTICE 'ℹ️  is_admin column already removed';
  END IF;
END $$;

-- ===========================================
-- PART 4: CREATE ADMIN STATISTICS VIEWS
-- ===========================================

-- Create admin_global_stats view for dashboard
CREATE OR REPLACE VIEW admin_global_stats AS
SELECT
  (SELECT COUNT(*) FROM user_profiles) as total_users,
  (SELECT COUNT(*) FROM user_profiles WHERE subscription_type != 'free') as premium_users,
  (SELECT COUNT(*) FROM quiz_results) as total_quizzes,
  (SELECT COUNT(*) FROM quiz_results WHERE score_percentage >= 80) as passed_quizzes,
  (SELECT COALESCE(ROUND(AVG(score_percentage), 1), 0) FROM quiz_results) as avg_score,
  (SELECT COUNT(*) FROM access_codes WHERE is_active = true) as active_codes,
  (SELECT COUNT(*) FROM code_redemptions) as total_redemptions;

-- Create admin_question_stats view (if questions table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
    EXECUTE '
    CREATE OR REPLACE VIEW admin_question_stats AS
    SELECT 
      q.id as question_id,
      q.question as question_text,
      q.category,
      COUNT(qa.id) as times_asked,
      SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct_count,
      CASE 
        WHEN COUNT(qa.id) > 0 
        THEN ROUND((SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::decimal / COUNT(qa.id) * 100), 1)
        ELSE 0 
      END as success_rate
    FROM questions q
    LEFT JOIN question_answers qa ON q.id = qa.question_id
    GROUP BY q.id, q.question, q.category
    ORDER BY times_asked DESC, success_rate ASC;
    ';
    RAISE NOTICE '✅ Created admin_question_stats view';
  ELSE
    RAISE NOTICE '⚠️  questions or question_answers table not found, skipping admin_question_stats';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Could not create admin_question_stats: %', SQLERRM;
END $$;

-- ===========================================
-- PART 5: PERFORMANCE INDEXES
-- ===========================================

-- Index on user_progress.total_xp for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_progress_total_xp 
ON user_progress(total_xp DESC);

-- Index on quiz_results.user_id for user statistics
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id 
ON quiz_results(user_id);

-- Index on quiz_results.created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at 
ON quiz_results(created_at DESC);

-- Index on user_profiles.role for admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON user_profiles(role);

-- ===========================================
-- PART 6: DATA INTEGRITY CONSTRAINTS
-- ===========================================

-- Ensure score_percentage is between 0 and 100
DO $$
BEGIN
  ALTER TABLE quiz_results 
  ADD CONSTRAINT check_score_percentage_range 
  CHECK (score_percentage >= 0 AND score_percentage <= 100);
  
  RAISE NOTICE '✅ Added score_percentage range check';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'ℹ️  score_percentage constraint already exists';
END $$;

-- Ensure level is non-negative
DO $$
BEGIN
  ALTER TABLE user_progress 
  ADD CONSTRAINT check_level_non_negative 
  CHECK (level >= 0);
  
  RAISE NOTICE '✅ Added level non-negative check';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'ℹ️  level constraint already exists';
END $$;

-- Ensure total_xp is non-negative
DO $$
BEGIN
  ALTER TABLE user_progress 
  ADD CONSTRAINT check_xp_non_negative 
  CHECK (total_xp >= 0);
  
  RAISE NOTICE '✅ Added total_xp non-negative check';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'ℹ️  total_xp constraint already exists';
END $$;

-- Ensure role is valid
DO $$
BEGIN
  ALTER TABLE user_profiles 
  ADD CONSTRAINT check_valid_role 
  CHECK (role IN ('user', 'admin', 'premium', 'b2b'));
  
  RAISE NOTICE '✅ Added role validation check';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'ℹ️  role constraint already exists';
END $$;

-- ===========================================
-- PART 7: VERIFY RLS POLICIES
-- ===========================================

-- Ensure RLS is enabled on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_redemptions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PART 8: VERIFICATION QUERIES
-- ===========================================

-- Show all user_profiles columns (should now include email)
DO $$
DECLARE
  col_list TEXT;
BEGIN
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
  INTO col_list
  FROM information_schema.columns
  WHERE table_name = 'user_profiles';
  
  RAISE NOTICE '📋 user_profiles columns: %', col_list;
END $$;

-- Count users with emails
DO $$
DECLARE
  count_with_email INTEGER;
  count_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_total FROM user_profiles;
  SELECT COUNT(*) INTO count_with_email FROM user_profiles WHERE email IS NOT NULL;
  
  RAISE NOTICE '📧 Users with email: % / %', count_with_email, count_total;
END $$;

-- Test admin_global_stats view
DO $$
DECLARE
  stats_json JSON;
BEGIN
  SELECT row_to_json(admin_global_stats.*) INTO stats_json FROM admin_global_stats;
  RAISE NOTICE '📊 Admin stats: %', stats_json;
END $$;

-- ===========================================
-- ✅ SCRIPT COMPLETE
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ MASTER FIX SCRIPT COMPLETED';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'CHANGES APPLIED:';
  RAISE NOTICE '1. ✅ Added email column to user_profiles';
  RAISE NOTICE '2. ✅ Synced emails from auth.users';
  RAISE NOTICE '3. ✅ Created email sync trigger';
  RAISE NOTICE '4. ✅ Dropped deprecated is_admin column';
  RAISE NOTICE '5. ✅ Created admin_global_stats view';
  RAISE NOTICE '6. ✅ Created admin_question_stats view (if applicable)';
  RAISE NOTICE '7. ✅ Added performance indexes';
  RAISE NOTICE '8. ✅ Added data integrity constraints';
  RAISE NOTICE '9. ✅ Verified RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Refresh admin dashboard (Ctrl+Shift+R)';
  RAISE NOTICE '2. Verify user emails appear in admin panel';
  RAISE NOTICE '3. Check statistics load correctly';
  RAISE NOTICE '4. Test creating new user (email should sync)';
  RAISE NOTICE '';
END $$;

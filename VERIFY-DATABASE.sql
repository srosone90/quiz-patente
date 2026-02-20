-- ============================================
-- 🧪 VERIFICATION SCRIPT
-- Run this BEFORE and AFTER MASTER-FIX-COMPLETE.sql
-- ============================================

-- TEST 1: Check if email column exists in user_profiles
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'email'
    ) THEN '✅ email column EXISTS'
    ELSE '❌ email column MISSING'
  END as email_column_check;

-- TEST 2: Show all user_profiles columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- TEST 3: Check if is_admin still exists (should be removed after fix)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'is_admin'
    ) THEN '⚠️  is_admin column still exists (should be removed)'
    ELSE '✅ is_admin column removed correctly'
  END as is_admin_column_check;

-- TEST 4: Show sample user data
SELECT id, email, full_name, role, subscription_type
FROM user_profiles
LIMIT 5;

-- TEST 5: Check admin_global_stats view
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_name = 'admin_global_stats'
    ) THEN '✅ admin_global_stats view EXISTS'
    ELSE '❌ admin_global_stats view MISSING'
  END as stats_view_check;

-- TEST 6: If admin_global_stats exists, show data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'admin_global_stats') THEN
    RAISE NOTICE 'Stats: %', (SELECT row_to_json(admin_global_stats.*) FROM admin_global_stats);
  END IF;
END $$;

-- TEST 7: Count users with and without email
SELECT 
  'Total users' as metric,
  COUNT(*) as count
FROM user_profiles
UNION ALL
SELECT 
  'Users with email' as metric,
  COUNT(*) as count
FROM user_profiles
WHERE email IS NOT NULL
UNION ALL
SELECT 
  'Users without email' as metric,
  COUNT(*) as count
FROM user_profiles
WHERE email IS NULL;

-- TEST 8: Check if email sync trigger exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    ) THEN '✅ Email sync trigger EXISTS'
    ELSE '❌ Email sync trigger MISSING'
  END as trigger_check;

-- TEST 9: Show all indexes on user_profiles
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles';

-- TEST 10: Show all indexes on quiz_results
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'quiz_results';

-- ============================================
-- 📊 SUMMARY
-- ============================================
-- After running MASTER-FIX-COMPLETE.sql, you should see:
-- ✅ email column EXISTS in user_profiles
-- ✅ All 3 users have email addresses
-- ✅ is_admin column removed
-- ✅ admin_global_stats view EXISTS
-- ✅ Email sync trigger EXISTS
-- ✅ Multiple performance indexes created
-- ============================================

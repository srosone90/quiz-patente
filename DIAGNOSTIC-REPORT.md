# 🔍 COMPREHENSIVE DATABASE DIAGNOSTIC REPORT

**Data:** 20 Febbraio 2026  
**Database:** dsxzqwicsggzyeropget.supabase.co

---

## 📊 DATABASE STRUCTURE DISCOVERED

### ✅ Existing Tables (7 total)

| Table | Rows | Status |
|-------|------|--------|
| user_profiles | 3 | ✅ Exists |
| user_progress | 1 | ✅ Exists |
| quiz_results | 3 | ✅ Exists |
| access_codes | 0 | ✅ Exists (empty) |
| code_redemptions | 0 | ✅ Exists (empty) |
| b2b_clients | 2 | ✅ Exists |
| b2b_contracts | 1 | ✅ Exists |

---

## 🔴 CRITICAL ISSUES FOUND

### 1. **user_profiles.email DOES NOT EXIST** ❌

**Problem:**  
- Admin page tries to display `user.email` (line 424 of admin/page.tsx)
- user_profiles table has NO email column
- Email is stored in `auth.users` (Supabase Auth system)

**Current Columns in user_profiles:**
- id, full_name, subscription_type, subscription_expires_at
- created_at, updated_at
- **is_admin** (boolean - DEPRECATED but still exists)
- user_id, display_name, bio, avatar_url
- is_public, show_stats, show_achievements
- **role** (string - CURRENT admin field)

**Impact:**
- Admin panel shows "N/A" for all user emails
- Cannot identify which user is which without email

**Solution Required:**
- Option A: Add email column to user_profiles + sync trigger from auth.users
- Option B: Create database VIEW or function that joins auth.users.email

---

### 2. **Duplicate Admin Fields** ⚠️

**Problem:**  
- user_profiles has **BOTH** `is_admin` (boolean) AND `role` (string)
- Code uses `role='admin'` (correct)
- Old `is_admin` column is unused but still exists

**What Happens:**
- Confusion in database structure
- Wasted storage
- Potential for inconsistent data if someone sets one but not the other

**Solution:**
```sql
-- Drop deprecated is_admin column
ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_admin;
```

---

### 3. **admin_global_stats View May Not Exist** ⚠️

**Problem:**  
- Admin dashboard calls `getAdminGlobalStats()` which queries `admin_global_stats` view
- This view may not exist (not verified in diagnostic)
- If missing, admin statistics panel shows errors

**Solution Required:**
- Create or recreate `admin_global_stats` view with proper aggregations

---

### 4. **admin_question_stats View May Not Exist** ⚠️

**Problem:**  
- Admin dashboard calls `getAdminQuestionStats()` which queries `admin_question_stats` view
- This view may not exist (not verified in diagnostic)
- If missing, question statistics show errors

**Solution Required:**
- Create or recreate `admin_question_stats` view

---

## ✅ ISSUES ALREADY FIXED

### 1. **XP System** ✅
- Fixed in FIX-RICORSIONE-INFINITA.sql
- Trigger uses correct_answers * 10
- Verified: 22 correct = 220 XP

### 2. **RLS Infinite Recursion** ✅
- Fixed with is_current_user_admin() SECURITY DEFINER function
- Admin can now see all users

### 3. **score_percentage Column** ✅
- AdvancedAnalytics now correctly uses score_percentage
- No longer queries non-existent 'score' or 'passed' columns

### 4. **Review Mode Question Limit** ✅
- Fixed: Free users = 10, Premium = 20 questions

### 5. **Real-time Quiz Updates** ✅
- Custom 'quizCompleted' event added
- Dashboard updates without page refresh

---

## 📋 MINOR ISSUES

### 1. **user_progress Column Naming** ℹ️
- Database has: `total_quizzes_completed`
- Code correctly uses: `total_quizzes_completed`
- Admin interface uses: `total_quizzes` (just naming, not a problem)
- **Status:** Not a bug, just inconsistent naming

### 2. **access_codes Empty** ℹ️
- Table exists but has 0 rows
- This is normal if no codes have been generated yet

### 3. **code_redemptions Empty** ℹ️
- Table exists but has 0 rows
- Normal if no codes have been redeemed yet

---

## 🔧 COMPLETE COLUMN INVENTORY

### quiz_results (3 rows)
✅ **All columns verified working:**
- id (number)
- user_id (string/UUID)
- **score_percentage** (number 0-100) ✅
- **correct_answers** (number) ✅
- **total_questions** (number) ✅
- quiz_type (string: 'free' or premium type)
- completed_at (timestamp)
- created_at (timestamp)

**No 'score' column ❌**  
**No 'passed' column ❌**  
**No 'category' column ❌**

### user_progress (1 row)
- id (UUID)
- user_id (UUID)
- total_xp (number) ✅
- level (number) ✅
- current_streak (number)
- longest_streak (number)
- best_streak (number)
- last_activity_date (date)
- **total_quizzes_completed** (number) ✅
- total_questions_answered (number)
- correct_answers (number)
- created_at (timestamp)
- updated_at (timestamp)

### user_profiles (3 rows)
- id (UUID - this IS the auth.uid)
- full_name (string)
- subscription_type (string)
- subscription_expires_at (timestamp nullable)
- created_at (timestamp)
- updated_at (timestamp)
- **is_admin (boolean - DEPRECATED)** ⚠️
- user_id (UUID nullable - purpose unclear)
- display_name (string nullable)
- bio (text nullable)
- avatar_url (string nullable)
- is_public (boolean)
- show_stats (boolean)
- show_achievements (boolean)
- **role (string - CURRENT)** ✅
- **email (MISSING!)** ❌

---

## 🎯 REQUIRED ACTIONS (Priority Order)

### Priority 1: CRITICAL (Admin Can't See Emails)

1. **Add email to user_profiles**
   - Create migration to add column
   - Create trigger to sync from auth.users
   - Backfill existing users' emails

OR

1. **Create user_profiles_with_email VIEW**
   - Join user_profiles with auth.users
   - Update TypeScript to query view instead of table

### Priority 2: HIGH (Database Cleanup)

2. **Drop deprecated is_admin column**
   - Safe to drop (not used anywhere)
   - Run: `ALTER TABLE user_profiles DROP COLUMN is_admin`

3. **Create/Verify admin_global_stats view**
   - Check if exists
   - Create if missing with proper aggregations

4. **Create/Verify admin_question_stats view**
   - Check if exists
   - Create if missing

### Priority 3: MEDIUM (Nice to Have)

5. **Standardize column names**
   - Consider renaming total_quizzes_completed → total_quizzes
   - Or update admin interface to use full name

---

## 💡 RECOMMENDATIONS

### Security
- ✅ RLS policies working correctly
- ✅ SECURITY DEFINER function prevents recursion
- ✅ Admin checks use role='admin' correctly

### Performance
- Consider adding indexes on:
  - user_progress.total_xp (for leaderboard)
  - quiz_results.user_id (for user stats)
  - quiz_results.created_at (for time-based queries)

### Data Integrity
- Consider adding CHECK constraints:
  - score_percentage BETWEEN 0 AND 100
  - level >= 0
  - total_xp >= 0

---

## 📝 NEXT STEPS

1. Run comprehensive SQL fix script (to be generated)
2. Update TypeScript code if needed (e.g., query view instead of table)
3. Test admin panel with all 3 users
4. Verify email column appears correctly
5. Confirm no RLS errors
6. Check all statistics load properly

---

**Generated by:** Comprehensive Database Diagnostic  
**Script:** diagnose-database.js  
**Status:** Analysis Complete ✅

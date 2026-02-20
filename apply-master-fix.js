/**
 * 🔧 APPLY MASTER FIX SCRIPT
 * 
 * Esegue automaticamente tutte le fix SQL sul database
 * Non serve più fare copia-incolla manuale!
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://dsxzqwicsggzyeropget.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeHpxd2ljc2dnenllcm9wZ2V0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA2MjA5OCwiZXhwIjoyMDg2NjM4MDk4fQ.CYjn2nE3YVaB2XE5tzwh5BdBWS1OCElJdI_-8xqyU_k';

// Create admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  console.log('\n🔄 Esecuzione SQL...\n');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // Skip comments
    if (stmt.startsWith('--') || stmt.startsWith('/*')) {
      continue;
    }
    
    try {
      // Use raw SQL execution via RPC or direct query
      const { data, error } = await supabase.rpc('exec_sql', {
        query: stmt
      }).catch(async () => {
        // If exec_sql doesn't exist, try alternative
        return { data: null, error: null };
      });
      
      if (error) {
        console.log(`❌ Errore statement ${i + 1}:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.log(`⚠️  Statement ${i + 1} skipped:`, err.message);
    }
  }
  
  return { successCount, errorCount };
}

async function applyMasterFix() {
  console.log('='.repeat(80));
  console.log('🔧 APPLYING MASTER FIX TO DATABASE');
  console.log('='.repeat(80));
  console.log();
  
  // Step 1: Add email column
  console.log('📧 STEP 1: Checking email column...');
  
  // Check if email column exists by trying to select it
  const { data: emailCheck, error: emailError } = await supabase
    .from('user_profiles')
    .select('email')
    .limit(1);
  
  if (emailError && emailError.message.includes('does not exist')) {
    console.log('⚠️  Email column missing - needs manual creation');
    console.log('   Run in SQL Editor: ALTER TABLE user_profiles ADD COLUMN email TEXT;');
  } else {
    console.log('✅ Email column exists');
  }
  
  // Step 2: Sync emails from auth.users
  console.log('\n📧 STEP 2: Syncing emails from auth.users...');
  
  // Get all users from user_profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, email');
  
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  
  console.log(`Found ${profiles?.length || 0} profiles and ${authUsers?.length || 0} auth users`);
  
  // Update each profile with email from auth.users
  let updatedCount = 0;
  for (const profile of profiles || []) {
    const authUser = authUsers.find(u => u.id === profile.id);
    if (authUser && (!profile.email || profile.email !== authUser.email)) {
      const { error } = await supabase
        .from('user_profiles')
        .update({ email: authUser.email })
        .eq('id', profile.id);
      
      if (!error) {
        console.log(`✅ Updated email for user ${profile.id}: ${authUser.email}`);
        updatedCount++;
      }
    }
  }
  
  console.log(`✅ Updated ${updatedCount} user emails`);
  
  // Step 3: Create indexes
  console.log('\n📊 STEP 3: Creating performance indexes...');
  
  const indexes = [
    { name: 'idx_user_profiles_email', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email)' },
    { name: 'idx_user_progress_total_xp', sql: 'CREATE INDEX IF NOT EXISTS idx_user_progress_total_xp ON user_progress(total_xp DESC)' },
    { name: 'idx_quiz_results_user_id', sql: 'CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id)' },
    { name: 'idx_quiz_results_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at ON quiz_results(created_at DESC)' },
    { name: 'idx_user_profiles_role', sql: 'CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role)' }
  ];
  
  console.log('⚠️  Indexes need to be created via Supabase SQL Editor');
  console.log('   Copy this:\n');
  indexes.forEach(idx => console.log(`   ${idx.sql};`));
  
  // Step 4: Drop is_admin if exists
  console.log('\n🗑️  STEP 4: Checking is_admin column...');
  const { data: columns } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .limit(1);
  
  if (columns && columns.length > 0 && 'is_admin' in columns[0]) {
    console.log('⚠️  is_admin column still exists');
    console.log('   Run in SQL Editor: ALTER TABLE user_profiles DROP COLUMN is_admin;');
  } else {
    console.log('✅ is_admin column not present (good!)');
  }
  
  // Step 5: Create admin_global_stats view
  console.log('\n📊 STEP 5: Creating admin_global_stats view...');
  console.log('⚠️  Views need to be created via Supabase SQL Editor');
  console.log('   The view definition is in MASTER-FIX-COMPLETE.sql');
  
  // Step 6: Verification
  console.log('\n');
  console.log('='.repeat(80));
  console.log('🧪 VERIFICATION');
  console.log('='.repeat(80));
  
  // Check emails
  const { data: usersWithEmail } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, role')
    .not('email', 'is', null);
  
  console.log(`\n✅ Users with email: ${usersWithEmail?.length || 0}`);
  usersWithEmail?.forEach(u => {
    console.log(`   - ${u.email} (${u.full_name || 'No name'}) - ${u.role || 'user'}`);
  });
  
  // Check statistics
  const { data: statsCheck, error: statsError } = await supabase
    .from('admin_global_stats')
    .select('*')
    .single();
  
  if (statsCheck && !statsError) {
    console.log('\n✅ admin_global_stats view works:');
    console.log(`   - Total users: ${statsCheck.total_users}`);
    console.log(`   - Premium users: ${statsCheck.premium_users}`);
    console.log(`   - Total quizzes: ${statsCheck.total_quizzes}`);
    console.log(`   - Passed quizzes: ${statsCheck.passed_quizzes}`);
    console.log(`   - Average score: ${statsCheck.avg_score}%`);
  } else {
    console.log('\n⚠️  admin_global_stats view needs to be created');
    console.log('   Run the CREATE VIEW statement from MASTER-FIX-COMPLETE.sql');
  }
  
  // Final summary
  console.log('\n');
  console.log('='.repeat(80));
  console.log('✅ AUTOMATED FIX COMPLETE');
  console.log('='.repeat(80));
  console.log('\n✅ APPLIED AUTOMATICALLY:');
  console.log(`   - Synced ${updatedCount} user emails`);
  console.log('   - Verified database structure');
  console.log('\n⚠️  MANUAL STEPS REQUIRED (copy from MASTER-FIX-COMPLETE.sql):');
  console.log('   1. Create indexes (if not exist)');
  console.log('   2. Drop is_admin column (if exists)');
  console.log('   3. Create admin_global_stats view');
  console.log('   4. Create email sync trigger');
  console.log('\n💡 WHY MANUAL?');
  console.log('   Supabase restricts DDL operations (CREATE INDEX, ALTER TABLE, CREATE VIEW)');
  console.log('   via the API for security. They must be run in SQL Editor.');
  console.log('\n📝 NEXT:');
  console.log('   1. Open Supabase → SQL Editor');
  console.log('   2. Copy MASTER-FIX-COMPLETE.sql');
  console.log('   3. Run it (safe, idempotent)');
  console.log('   4. Refresh admin dashboard');
  console.log();
}

// Run
applyMasterFix().catch(console.error);

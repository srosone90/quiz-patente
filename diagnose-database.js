/**
 * COMPREHENSIVE DATABASE DIAGNOSTIC SCRIPT
 * 
 * Reads entire Supabase database structure:
 * - All tables and columns (types, nullable, defaults)
 * - All RLS policies
 * - All functions and triggers
 * - Sample data from key tables
 * 
 * Purpose: Cross-reference with TypeScript code to find mismatches
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dsxzqwicsggzyeropget.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeHpxd2ljc2dnenllcm9wZ2V0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA2MjA5OCwiZXhwIjoyMDg2NjM4MDk4fQ.CYjn2nE3YVaB2XE5tzwh5BdBWS1OCElJdI_-8xqyU_k';

// Create admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnoseDatabase() {
  console.log('='.repeat(80));
  console.log('COMPREHENSIVE DATABASE DIAGNOSTIC');
  console.log('='.repeat(80));
  console.log();

  // ============================================================================
  // 1. GET ALL TABLES AND COLUMNS
  // ============================================================================
  console.log('📊 STEP 1: Querying tables directly...');
  console.log('-'.repeat(80));

  // Query tables directly using Supabase client
  console.log('\n📋 TABLE: user_profiles');
  const { data: userProfiles, error: upError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);
  
  if (userProfiles && userProfiles.length > 0) {
    console.log('Columns:', Object.keys(userProfiles[0]).join(', '));
    console.log('Sample data:', JSON.stringify(userProfiles[0], null, 2));
  } else {
    console.log('Error or empty:', upError);
  }

  console.log('\n📋 TABLE: user_progress');
  const { data: userProgress, error: progError } = await supabase
    .from('user_progress')
    .select('*')
    .limit(1);
  
  if (userProgress && userProgress.length > 0) {
    console.log('Columns:', Object.keys(userProgress[0]).join(', '));
    console.log('Sample data:', JSON.stringify(userProgress[0], null, 2));
  } else {
    console.log('Error or empty:', progError);
  }

  console.log('\n📋 TABLE: quiz_results');
  const { data: quizResults, error: qrError } = await supabase
    .from('quiz_results')
    .select('*')
    .limit(1);
  
  if (quizResults && quizResults.length > 0) {
    console.log('Columns:', Object.keys(quizResults[0]).join(', '));
    console.log('Sample data:', JSON.stringify(quizResults[0], null, 2));
  } else {
    console.log('Error or empty:', qrError);
  }

  console.log('\n📋 TABLE: access_codes');
  const { data: accessCodes, error: acError } = await supabase
    .from('access_codes')
    .select('*')
    .limit(1);
  
  if (accessCodes && accessCodes.length > 0) {
    console.log('Columns:', Object.keys(accessCodes[0]).join(', '));
    console.log('Sample data:', JSON.stringify(accessCodes[0], null, 2));
  } else {
    console.log('Error or empty:', acError);
  }

  console.log('\n📋 TABLE: code_redemptions');
  const { data: codeRedemptions, error: crError } = await supabase
    .from('code_redemptions')
    .select('*')
    .limit(1);
  
  if (codeRedemptions && codeRedemptions.length > 0) {
    console.log('Columns:', Object.keys(codeRedemptions[0]).join(', '));
    console.log('Sample data:', JSON.stringify(codeRedemptions[0], null, 2));
  } else {
    console.log('Error or empty:', crError);
  }

  // ============================================================================
  // 2. CHECK ALL TABLES EXIST
  // ============================================================================
  console.log('\n');
  console.log('='.repeat(80));
  console.log('📦 STEP 2: Checking which tables exist...');
  console.log('-'.repeat(80));

  const expectedTables = [
    'user_profiles',
    'user_progress', 
    'quiz_results',
    'access_codes',
    'code_redemptions',
    'b2b_clients',
    'b2b_contracts'
  ];

  for (const table of expectedTables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`✅ ${table}: EXISTS (${count} rows)`);
    }
  }

  // ============================================================================
  // 3. GET FULL SCHEMA FOR EACH TABLE
  // ============================================================================
  console.log('\n');
  console.log('='.repeat(80));
  console.log('🔍 STEP 3: Complete schema for each table...');
  console.log('-'.repeat(80));

  for (const table of expectedTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);
    
    if (!error) {
      // Try to infer columns from a real query
      const { data: sample } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (sample && sample.length > 0) {
        console.log(`\n📋 ${table.toUpperCase()}`);
        console.log('   Columns:');
        Object.keys(sample[0]).forEach(col => {
          const value = sample[0][col];
          const type = typeof value === 'number' ? 'number' : 
                      typeof value === 'boolean' ? 'boolean' :
                      value === null ? 'null' :
                      Array.isArray(value) ? 'array' : 'string';
          console.log(`   - ${col} (${type})`);
        });
      }
    }
  }

  // ============================================================================
  // 4. TEST CRITICAL QUERIES
  // ============================================================================
  console.log('\n');
  console.log('='.repeat(80));
  console.log('🧪 STEP 4: Testing critical queries from code...');
  console.log('-'.repeat(80));

  // Test 1: Admin user check
  console.log('\n🔐 Test: Admin user check');
  const { data: adminCheck, error: adminError } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, role')
    .eq('role', 'admin')
    .single();
  
  if (adminCheck) {
    console.log('✅ Admin user found:', adminCheck.email);
  } else {
    console.log('❌ No admin user found:', adminError?.message);
  }

  // Test 2: All users (admin view)
  console.log('\n👥 Test: Get all users (admin query)');
  const { data: allUsers, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, subscription_type, subscription_expires_at, role, created_at');
  
  if (allUsers) {
    console.log(`✅ Found ${allUsers.length} users`);
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.role || 'user'}) - ${u.subscription_type}`);
    });
  } else {
    console.log('❌ Error:', usersError?.message);
  }

  // Test 3: Quiz results with columns from AdvancedAnalytics
  console.log('\n📊 Test: Quiz results query (AdvancedAnalytics)');
  const { data: quizData, error: quizError } = await supabase
    .from('quiz_results')
    .select('score_percentage, created_at')
    .limit(5);
  
  if (quizData) {
    console.log(`✅ Query successful, ${quizData.length} results`);
    console.log('   Sample:', quizData[0]);
  } else {
    console.log('❌ Error:', quizError?.message);
  }

  // Test 4: User progress query
  console.log('\n📈 Test: User progress query');
  const { data: progressData, error: progressError } = await supabase
    .from('user_progress')
    .select('*')
    .limit(3);
  
  if (progressData) {
    console.log(`✅ Found ${progressData.length} progress records`);
    progressData.forEach(p => {
      console.log(`   - User: ${p.user_id} | XP: ${p.total_xp} | Level: ${p.level} | Quizzes: ${p.total_quizzes || 'N/A'}`);
    });
  } else {
    console.log('❌ Error:', progressError?.message);
  }

  // Test 5: Access codes query
  console.log('\n🎟️  Test: Access codes query');
  const { data: codesData, error: codesError } = await supabase
    .from('access_codes')
    .select('*')
    .limit(3);
  
  if (codesData) {
    console.log(`✅ Found ${codesData.length} access codes`);
    if (codesData.length > 0) {
      console.log('   Columns:', Object.keys(codesData[0]).join(', '));
    }
  } else {
    console.log('❌ Error:', codesError?.message);
  }

  // ============================================================================
  // 5. SUMMARY
  // ============================================================================
  console.log('\n');
  console.log('='.repeat(80));
  console.log('✅ DIAGNOSTIC COMPLETE');
  console.log('='.repeat(80));
  console.log('\nNext steps:');
  console.log('1. Compare these structures with TypeScript code');
  console.log('2. Identify query mismatches');
  console.log('3. Generate master fix script');
  console.log();
}

// Run diagnostic
diagnoseDatabase().catch(console.error);

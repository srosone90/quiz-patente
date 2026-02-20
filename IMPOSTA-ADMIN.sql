-- ============================================
-- IMPOSTA ADMIN: srosone90@gmail.com
-- ============================================
-- Questo script imposta il ruolo admin per il tuo account
-- UUID: a6627320-e650-46cd-a928-fc3824a8697b
-- ============================================

-- STEP 1: Verifica utente PRIMA dell'aggiornamento
SELECT 
    up.id,
    au.email,
    up.full_name,
    up.subscription_type,
    up.role as ruolo_attuale,
    up.total_xp,
    up.level
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE au.email = 'srosone90@gmail.com';

-- STEP 2: Imposta ruolo ADMIN
UPDATE user_profiles 
SET role = 'admin' 
WHERE id = 'a6627320-e650-46cd-a928-fc3824a8697b';

-- STEP 3: Verifica utente DOPO l'aggiornamento
SELECT 
    up.id,
    au.email,
    up.full_name,
    up.subscription_type,
    up.role as ruolo_aggiornato,
    up.total_xp,
    up.level
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE au.email = 'srosone90@gmail.com';

-- STEP 4: Verifica policies attive
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('user_profiles', 'quiz_results', 'user_progress')
ORDER BY tablename, policyname;

-- ============================================
-- RISULTATO ATTESO:
-- ============================================
-- Step 1: role = NULL o 'user'
-- Step 2: 1 row updated
-- Step 3: role = 'admin' ✅
-- Step 4: 10 policies attive
-- ============================================

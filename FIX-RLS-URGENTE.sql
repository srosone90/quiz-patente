-- ============================================
-- FIX URGENTE: RLS policies bloccano accesso admin
-- ============================================
-- PROBLEMA: Le policy sono troppo restrittive
-- SOLUZIONE: Permetti agli utenti di vedere il PROPRIO profilo SEMPRE
--            E agli admin di vedere TUTTI i profili
-- ============================================

-- STEP 1: ELIMINA tutte le policy conflittuali su user_profiles
DROP POLICY IF EXISTS "Public profiles readable" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Utenti vedono solo il proprio profilo" ON user_profiles;
DROP POLICY IF EXISTS "Utenti possono leggere il proprio profilo" ON user_profiles;

-- STEP 2: Crea policy CORRETTE per lettura profili
-- Policy 1: Ogni utente DEVE poter vedere il proprio profilo
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Gli admin possono vedere TUTTI i profili
CREATE POLICY "Admins can view all profiles"
ON user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- STEP 3: Verifica che le nuove policy siano attive
SELECT 
    tablename,
    policyname,
    cmd,
    qual as "USING condition"
FROM pg_policies
WHERE tablename = 'user_profiles'
AND cmd = 'SELECT'
ORDER BY policyname;

-- STEP 4: Verifica che il tuo ruolo admin sia impostato
SELECT 
    id,
    full_name,
    subscription_type,
    role
FROM user_profiles
WHERE id = 'a6627320-e650-46cd-a928-fc3824a8697b';

-- ============================================
-- RISULTATO ATTESO:
-- ============================================
-- Step 1-2: Policies create
-- Step 3: 2 policies SELECT attive
--   - "Admins can view all profiles"
--   - "Users can view own profile"
-- Step 4: role = 'admin' ✅
-- ============================================

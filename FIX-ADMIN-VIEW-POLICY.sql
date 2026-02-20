-- ============================================
-- FIX POLICY ADMIN VIEW
-- ============================================
-- PROBLEMA: La policy admin_view_all_profiles mostra solo utenti con role='admin'
-- SOLUZIONE: Modificare per mostrare TUTTI gli utenti SE chi richiede è admin
-- ============================================

-- STEP 1: Elimina la policy sbagliata
DROP POLICY IF EXISTS "admin_view_all_profiles" ON user_profiles;

-- STEP 2: Crea la policy CORRETTA
CREATE POLICY "admin_view_all_profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  -- Se l'utente corrente è admin, può vedere TUTTI i profili
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- STEP 3: Verifica policies attive
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '✅ Lettura'
        WHEN cmd = 'UPDATE' THEN '🔧 Aggiornamento'
        WHEN cmd = 'INSERT' THEN '➕ Inserimento'
    END as "Tipo"
FROM pg_policies
WHERE tablename = 'user_profiles'
AND cmd = 'SELECT'
ORDER BY policyname;

-- STEP 4: Test - Conta quanti utenti vede l'admin (dovrebbe essere 3)
SELECT 
    COUNT(*) as "Totale Utenti Visibili"
FROM user_profiles;

-- STEP 5: Mostra tutti gli utenti
SELECT 
    id,
    full_name,
    subscription_type,
    role,
    created_at
FROM user_profiles
ORDER BY created_at DESC;

-- ============================================
-- RISULTATO ATTESO:
-- ============================================
-- Step 3: 2 policies SELECT (user_view_own_profile + admin_view_all_profiles)
-- Step 4: 3 utenti visibili
-- Step 5: Lista di 3 utenti
-- ============================================

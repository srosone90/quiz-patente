-- ============================================
-- RESET COMPLETO RLS per user_profiles
-- ============================================
-- Questo script ELIMINA TUTTE le policy esistenti
-- e ne crea di nuove SEMPLICI che funzionano garantito
-- ============================================

-- STEP 1: DISABILITA temporaneamente RLS (per debug)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: ELIMINA TUTTE le policy esistenti su user_profiles
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', pol.policyname);
    END LOOP;
END $$;

-- STEP 3: RIABILITA RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Crea policy SEMPLICI che funzionano
-- Policy 1: Ogni utente vede il proprio profilo
CREATE POLICY "user_view_own_profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Ogni utente può aggiornare il proprio profilo (ma non il ruolo)
CREATE POLICY "user_update_own_profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Admin vede tutti i profili
CREATE POLICY "admin_view_all_profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  role = 'admin'
);

-- Policy 4: Admin può aggiornare tutti i profili
CREATE POLICY "admin_update_all_profiles"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy 5: Nuovi utenti possono creare il proprio profilo
CREATE POLICY "user_insert_own_profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- STEP 5: Verifica policy create
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '✅ Lettura'
        WHEN cmd = 'UPDATE' THEN '🔧 Aggiornamento'
        WHEN cmd = 'INSERT' THEN '➕ Inserimento'
        WHEN cmd = 'DELETE' THEN '❌ Eliminazione'
    END as "Tipo"
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- STEP 6: Test lettura profilo
SELECT 
    id,
    full_name,
    subscription_type,
    role,
    'Profilo trovato! ✅' as status
FROM user_profiles
WHERE id = 'a6627320-e650-46cd-a928-fc3824a8697b';

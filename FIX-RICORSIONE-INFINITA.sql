-- ============================================
-- FIX RICORSIONE INFINITA - SECURITY DEFINER
-- ============================================
-- PROBLEMA: La policy fa EXISTS su user_profiles per controllare admin
--           MA è dentro la policy di user_profiles → ricorsione infinita!
-- SOLUZIONE: Funzione SECURITY DEFINER che bypassa RLS
-- ============================================

-- STEP 1: Elimina le policy problematiche
DROP POLICY IF EXISTS "user_view_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_view_all_profiles" ON user_profiles;

-- STEP 2: Crea funzione che bypassa RLS per controllare admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Crea UNA SOLA policy per SELECT che usa la funzione
CREATE POLICY "view_profiles_unified"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  -- Ogni utente vede il proprio profilo
  auth.uid() = id
  OR
  -- OPPURE se l'utente è admin, vede tutti (usa funzione SECURITY DEFINER)
  is_current_user_admin()
);

-- STEP 4: Verifica policies
SELECT 
    policyname,
    cmd,
    'Policy creata ✅' as status
FROM pg_policies
WHERE tablename = 'user_profiles'
AND cmd = 'SELECT';

-- STEP 5: Test - Conta utenti visibili
SELECT COUNT(*) as "Totale Utenti" FROM user_profiles;

-- STEP 6: Mostra tutti gli utenti
SELECT 
    id,
    full_name,
    subscription_type,
    role
FROM user_profiles
ORDER BY created_at DESC;

-- ============================================
-- RISULTATO ATTESO:
-- ============================================
-- Step 4: 1 policy SELECT (view_profiles_unified)
-- Step 5: 3 utenti
-- Step 6: Lista di 3 utenti
-- ============================================

-- ============================================
-- SPIEGAZIONE TECNICA:
-- ============================================
-- SECURITY DEFINER = la funzione viene eseguita con i permessi
-- del proprietario del database, NON dell'utente corrente
-- Questo permette di leggere user_profiles SENZA attivare RLS
-- all'interno della funzione, evitando la ricorsione infinita
-- ============================================

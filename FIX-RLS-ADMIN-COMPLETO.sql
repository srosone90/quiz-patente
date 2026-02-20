-- ====================================================================
-- FIX DEFINITIVO: Admin può vedere tutti gli utenti
-- ====================================================================
-- Risolve: Lista utenti vuota in admin panel, RLS policies troppo restrittive
-- ====================================================================

-- STEP 1: Aggiungi colonna 'role' alla tabella user_profiles (se non esiste)
-- ====================================================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Crea indice per performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- STEP 2: Verifica struttura tabella
-- ====================================================================
-- Mostra tutte le colonne di user_profiles
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'user_profiles'
-- ORDER BY ordinal_position;

-- STEP 3: DROP policies esistenti
-- ====================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can insert during signup" ON user_profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON user_profiles;

-- STEP 4: Crea policy per LETTURA profili
-- ====================================================================
-- Admin possono vedere TUTTI i profili, utenti normali solo il proprio
CREATE POLICY "Users can view profiles"
ON user_profiles
FOR SELECT
USING (
  -- Vede il proprio profilo
  auth.uid() = id
  OR
  -- Oppure è admin
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- STEP 5: Crea policy per AGGIORNAMENTO profili
-- ====================================================================
-- Admin possono modificare TUTTI i profili, utenti normali solo il proprio
CREATE POLICY "Users can update profiles"
ON user_profiles
FOR UPDATE
USING (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- STEP 6: Crea policy per INSERIMENTO (signup)
-- ====================================================================
CREATE POLICY "Anyone can insert during signup"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- STEP 7: Crea policy per ELIMINAZIONE (solo admin)
-- ====================================================================
CREATE POLICY "Only admins can delete profiles"
ON user_profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- ====================================================================
-- STEP 8: Imposta almeno un admin (IMPORTANTE!)
-- ====================================================================
-- ⚠️ SOSTITUISCI 'tuaemail@example.com' CON LA TUA EMAIL REALE
-- ====================================================================

-- Verifica quale è la tua email
-- SELECT id, email FROM user_profiles LIMIT 10;

-- Imposta admin (MODIFICA QUESTA RIGA!)
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'METTI_QUI_LA_TUA_EMAIL@example.com';

-- Se non ricordi l'email, puoi anche usare l'ID utente Supabase:
-- UPDATE user_profiles SET role = 'admin' WHERE id = 'UUID_DEL_TUO_UTENTE';

-- ====================================================================
-- VERIFICA SUCCESSO
-- ====================================================================

-- Controlla admin creati
SELECT id, email, role, full_name, subscription_type, created_at
FROM user_profiles 
WHERE role = 'admin';

-- Se non vedi nessun admin, hai dimenticato di sostituire l'email sopra!

-- Controlla totale utenti
SELECT COUNT(*) as total_users FROM user_profiles;

-- Controlla RLS policies applicate
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- ====================================================================
-- TROUBLESHOOTING
-- ====================================================================
-- Se dopo aver eseguito questo script l'admin NON vede ancora gli utenti:
-- 
-- 1. Verifica di essere loggato con l'account che hai impostato come admin
-- 2. Esegui questa query per confermare:
--    SELECT id, email, role FROM user_profiles WHERE email = 'tua@email.com';
-- 3. Ricarica la pagina admin con hard refresh: Ctrl + Shift + R
-- 4. Controlla console browser (F12) per errori JavaScript
-- 5. Verifica che RLS sia abilitato: SELECT * FROM pg_tables WHERE tablename = 'user_profiles';
-- ====================================================================

COMMIT;

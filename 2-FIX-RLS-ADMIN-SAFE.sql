-- ====================================================================
-- FIX RLS ADMIN - VERSIONE SAFE (funziona con qualsiasi struttura)
-- ====================================================================
-- Usa auth.users per trovare email, non assume che sia in user_profiles
-- ====================================================================

-- STEP 1: Aggiungi colonna 'role' (se non esiste)
-- ====================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
    ALTER TABLE user_profiles 
    ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));
  END IF;
END $$;

-- Crea indice
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- STEP 2: DROP policies esistenti
-- ====================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can insert during signup" ON user_profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON user_profiles;

-- STEP 3: Crea policies
-- ====================================================================

-- Policy per LETTURA (SELECT)
CREATE POLICY "Users can view profiles"
ON user_profiles
FOR SELECT
USING (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy per AGGIORNAMENTO (UPDATE)
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

-- Policy per INSERIMENTO (INSERT)
CREATE POLICY "Anyone can insert during signup"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy per ELIMINAZIONE (DELETE)
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
-- STEP 4: IMPOSTA ADMIN - 3 METODI (usa quello che funziona)
-- ====================================================================

-- METODO 1: Se user_profiles HA la colonna email
-- Decommenta e modifica questa se la colonna email esiste in user_profiles:
-- UPDATE user_profiles 
-- SET role = 'admin' 
-- WHERE email = 'METTI_TUA_EMAIL_QUI@example.com';

-- METODO 2: Usa auth.users per trovare l'email (RACCOMANDATO per Supabase)
-- Questo funziona SEMPRE perché Supabase tiene email in auth.users
UPDATE user_profiles 
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'METTI_TUA_EMAIL_QUI@example.com'
);

-- METODO 3: Se conosci il tuo UUID utente (lo trovi in alto a destra su Supabase)
-- Decommenta e sostituisci l'UUID:
-- UPDATE user_profiles 
-- SET role = 'admin' 
-- WHERE id = 'METTI_QUI_IL_TUO_UUID';

-- ====================================================================
-- VERIFICA SUCCESSO
-- ====================================================================

-- Mostra admin creati (con email da auth.users)
SELECT 
  up.id,
  au.email,
  up.role,
  up.full_name,
  up.created_at
FROM user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
WHERE up.role = 'admin';

-- Se non vedi admin, prova questa query per trovare il tuo UUID:
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10;
-- Poi usa METODO 3 sopra con il tuo UUID

-- Controlla totale utenti
SELECT COUNT(*) as total_users FROM user_profiles;

-- Verifica policies
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- ====================================================================
-- TROUBLESHOOTING
-- ====================================================================
-- Se non funziona ancora:
-- 
-- 1. Esegui: SELECT id, email FROM auth.users WHERE email LIKE '%tuapartemail%';
-- 2. Copia l'UUID risultante
-- 3. Esegui: UPDATE user_profiles SET role = 'admin' WHERE id = 'UUID_COPIATO';
-- 4. Verifica: SELECT * FROM user_profiles WHERE role = 'admin';
-- 
-- ====================================================================

COMMIT;

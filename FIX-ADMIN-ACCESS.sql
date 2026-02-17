-- ============================================
-- FIX ACCESSO ADMIN
-- Esegui questo nel SQL Editor di Supabase
-- ============================================

-- Permetti agli utenti di leggere il proprio profilo (incluso is_admin)
DROP POLICY IF EXISTS "Utenti possono leggere il proprio profilo" ON user_profiles;

CREATE POLICY "Utenti possono leggere il proprio profilo"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- Permetti agli utenti di aggiornare il proprio profilo (ma NON is_admin)
DROP POLICY IF EXISTS "Utenti possono aggiornare il proprio profilo" ON user_profiles;

CREATE POLICY "Utenti possono aggiornare il proprio profilo"
ON user_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verifica che RLS sia abilitato
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verifica policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Verifica il tuo status admin
SELECT id, is_admin, subscription_type
FROM user_profiles
WHERE id = auth.uid();

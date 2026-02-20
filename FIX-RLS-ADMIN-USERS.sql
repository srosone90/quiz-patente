-- ====================================================================
-- FIX: Admin non può vedere lista utenti
-- ====================================================================
-- PROBLEMA: RLS (Row Level Security) impedisce agli admin di vedere
--           altri profili utente
-- SOLUZIONE: Creare policy che permette ad admin di vedere tutti
-- ====================================================================

-- 1. Verifica policies esistenti
-- SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- 2. DROP policies restrittive (se esistono)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- 3. CREA policy per lettura profili
-- Admin possono vedere TUTTI i profili, utenti normali solo il proprio
CREATE POLICY "Users can view profiles"
ON user_profiles
FOR SELECT
USING (
  -- Vede il proprio profilo
  auth.uid() = id
  OR
  -- Oppure è admin (controlla nella tabella user_profiles)
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 4. CREA policy per aggiornamento profili
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

-- 5. CREA policy per inserimento (signup)
CREATE POLICY "Anyone can insert during signup"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 6. CREA policy per eliminazione (solo admin)
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
-- 7. ASSICURATI CHE ESISTA ALMENO UN ADMIN
-- ====================================================================
-- Sostituisci con la tua email effettiva
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'tuaemail@example.com';

-- Verifica
SELECT email, role FROM user_profiles WHERE role = 'admin';

-- ====================================================================
-- 8. VERIFICA FUNZIONAMENTO
-- ====================================================================
-- Accedi come admin su driverquizpa.com/admin
-- Vai nella tab "Utenti"
-- Dovresti vedere TUTTI gli utenti registrati
-- ====================================================================

COMMIT;

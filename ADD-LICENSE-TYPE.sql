-- ============================================================
-- ADD-LICENSE-TYPE.sql
-- Aggiunge supporto multi-patente alla tabella questions
-- Esegui questo script nel SQL Editor di Supabase
-- ============================================================

-- 1. Aggiungi colonna license_type
ALTER TABLE questions ADD COLUMN IF NOT EXISTS license_type TEXT;

-- 2. Le domande esistenti sono Taxi/NCC → assegna il tipo corretto
UPDATE questions SET license_type = 'taxi_ncc' WHERE license_type IS NULL;

-- 3. Indice per ricerche per tipo patente
CREATE INDEX IF NOT EXISTS idx_questions_license_type ON questions(license_type);

-- 4. Policy RLS: admin può inserire domande
DROP POLICY IF EXISTS "Admins can insert questions" ON questions;
CREATE POLICY "Admins can insert questions" ON questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Policy RLS: admin può modificare domande
DROP POLICY IF EXISTS "Admins can update questions" ON questions;
CREATE POLICY "Admins can update questions" ON questions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Policy RLS: admin può eliminare domande
DROP POLICY IF EXISTS "Admins can delete questions" ON questions;
CREATE POLICY "Admins can delete questions" ON questions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Verifica: controlla i tipi patente presenti
-- ============================================================
-- SELECT license_type, COUNT(*) FROM questions GROUP BY license_type ORDER BY license_type;

-- ============================================================
-- ADD-SCHOOL-PORTAL.sql
-- Portal autoscuole: tabella schools, FK, RLS, RPC aggiornata
-- Esegui nel SQL Editor di Supabase
-- ============================================================

-- ── 1. Tabella schools ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schools (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  city          TEXT,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  logo_url      TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 2. FK school_id su user_profiles (studenti e school_admin) ───────────────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL;

-- ── 3. FK school_id su access_codes (ogni codice appartiene a una scuola) ────
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL;

-- ── 4. Indici ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_profiles_school_id ON user_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_school_id  ON access_codes(school_id);

-- ── 5. RLS per la tabella schools ────────────────────────────────────────────
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Admin: tutto
CREATE POLICY "Admin full access on schools" ON schools
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- School admin: legge solo la propria scuola
CREATE POLICY "School admin reads own school" ON schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'school_admin'
        AND school_id = schools.id
    )
  );

-- School admin: aggiorna solo la propria scuola
CREATE POLICY "School admin updates own school" ON schools
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'school_admin'
        AND school_id = schools.id
    )
  );

-- ── 6. RLS: school_admin vede solo i propri studenti ─────────────────────────
-- (La policy SELECT su user_profiles per gli studenti va aggiunta
--  solo se non esiste già una policy più permissiva)

-- Permetti a school_admin di vedere i profili dei propri studenti
DROP POLICY IF EXISTS "School admin reads own students" ON user_profiles;
CREATE POLICY "School admin reads own students" ON user_profiles
  FOR SELECT USING (
    -- lo stesso utente può sempre vedere sé stesso
    id = auth.uid()
    OR
    -- admin vede tutti
    EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR
    -- school_admin vede solo i propri studenti (stesso school_id, ruolo non school_admin)
    (
      EXISTS (
        SELECT 1 FROM user_profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'school_admin'
          AND p.school_id = user_profiles.school_id
          AND user_profiles.role IS DISTINCT FROM 'school_admin'
          AND user_profiles.role IS DISTINCT FROM 'admin'
      )
    )
  );

-- ── 7. RLS: school_admin vede solo i quiz_results dei propri studenti ─────────
DROP POLICY IF EXISTS "School admin reads own students quiz results" ON quiz_results;
CREATE POLICY "School admin reads own students quiz results" ON quiz_results
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (
      SELECT 1
      FROM user_profiles admin_p
      JOIN user_profiles student_p ON student_p.id = quiz_results.user_id
      WHERE admin_p.id = auth.uid()
        AND admin_p.role = 'school_admin'
        AND admin_p.school_id = student_p.school_id
    )
  );

-- ── 8. RPC aggiornata: redeem_access_code ora lega lo studente alla scuola ────
CREATE OR REPLACE FUNCTION redeem_access_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_code_record RECORD;
  v_plan_type TEXT;
  v_duration_days INTEGER;
  v_new_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verifica se il codice esiste ed è valido
  SELECT * INTO v_code_record
  FROM access_codes
  WHERE code = p_code
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND used_count < max_uses;

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'message', 'Codice non valido o scaduto');
  END IF;

  -- Verifica se l'utente ha già usato questo codice
  IF EXISTS (
    SELECT 1 FROM code_redemptions
    WHERE code_id = v_code_record.id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object('success', FALSE, 'message', 'Hai già utilizzato questo codice');
  END IF;

  -- Calcola nuova data di scadenza
  v_plan_type     := v_code_record.plan_type;
  v_duration_days := v_code_record.duration_days;

  SELECT
    CASE
      WHEN subscription_expires_at IS NULL OR subscription_expires_at < NOW()
      THEN NOW() + (v_duration_days || ' days')::INTERVAL
      ELSE subscription_expires_at + (v_duration_days || ' days')::INTERVAL
    END
  INTO v_new_expiry
  FROM user_profiles
  WHERE id = p_user_id;

  -- Aggiorna profilo utente: subscription + school_id dal codice
  UPDATE user_profiles
  SET
    subscription_type       = v_plan_type,
    subscription_expires_at = v_new_expiry,
    school_id               = v_code_record.school_id,
    updated_at              = NOW()
  WHERE id = p_user_id;

  -- Registra riscatto
  INSERT INTO code_redemptions (code_id, user_id)
  VALUES (v_code_record.id, p_user_id);

  -- Incrementa contatore usi
  UPDATE access_codes
  SET used_count = used_count + 1
  WHERE id = v_code_record.id;

  RETURN json_build_object(
    'success',    TRUE,
    'message',    'Codice riscattato con successo',
    'plan_type',  v_plan_type,
    'expires_at', v_new_expiry
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 9. Funzione helper: crea account school_admin ─────────────────────────────
-- Uso: SELECT create_school_admin('nome@email.com', 'password', 'Nome Scuola', 1);
-- (school_id deve essere l'id della scuola già inserita in schools)
-- Nota: questa funzione è da usare dall'admin SQL, non esposta via API
--
-- Per creare una scuola + admin:
-- INSERT INTO schools (name, city, phone, email) VALUES ('Autoscuola Rossi', 'Palermo', '091...', 'info@autoscuolarossi.it');
-- Poi usa il pannello Admin → Utenti per impostare role='school_admin' e school_id=<id>

-- ── Verifica ─────────────────────────────────────────────────────────────────
-- SELECT id, name, is_active FROM schools;
-- SELECT id, email, role, school_id FROM user_profiles WHERE role IN ('school_admin');

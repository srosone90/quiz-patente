-- ============================================
-- UPGRADE DATABASE PER NUOVE FUNZIONALITÀ
-- Esegui questo nel SQL Editor di Supabase
-- ============================================

-- 1. TABELLA PER SALVARE LE RISPOSTE INDIVIDUALI (Ripassa Errori)
CREATE TABLE IF NOT EXISTS quiz_answers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_result_id BIGINT REFERENCES quiz_results(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  category TEXT,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS per quiz_answers
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utenti vedono solo le proprie risposte"
ON quiz_answers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Utenti inseriscono solo le proprie risposte"
ON quiz_answers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_quiz_answers_user_id ON quiz_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_quiz_result_id ON quiz_answers(quiz_result_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_is_correct ON quiz_answers(is_correct);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);

-- 2. AGGIUNGI CAMPO ADMIN AI PROFILI UTENTE
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Crea indice per admin
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin) WHERE is_admin = TRUE;

-- 3. TABELLA PER CODICI DI ACCESSO SCUOLE GUIDA
CREATE TABLE IF NOT EXISTS access_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  school_name TEXT NOT NULL,
  plan_type TEXT NOT NULL, -- 'last_minute' o 'senza_pensieri'
  duration_days INTEGER NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- RLS per access_codes (solo admin)
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admin vedono codici"
ON access_codes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

CREATE POLICY "Solo admin creano codici"
ON access_codes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

CREATE POLICY "Solo admin modificano codici"
ON access_codes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_is_active ON access_codes(is_active) WHERE is_active = TRUE;

-- 4. TABELLA PER LOG UTILIZZO CODICI
CREATE TABLE IF NOT EXISTS code_redemptions (
  id BIGSERIAL PRIMARY KEY,
  code_id BIGINT REFERENCES access_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utenti vedono solo i propri riscatti"
ON code_redemptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Utenti possono riscattare codici"
ON code_redemptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Indici
CREATE INDEX IF NOT EXISTS idx_code_redemptions_code_id ON code_redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_user_id ON code_redemptions(user_id);

-- 5. FUNZIONE PER RISCATTARE UN CODICE
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
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Codice non valido o scaduto'
    );
  END IF;
  
  -- Verifica se l'utente ha già usato questo codice
  IF EXISTS (
    SELECT 1 FROM code_redemptions 
    WHERE code_id = v_code_record.id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Hai già utilizzato questo codice'
    );
  END IF;
  
  -- Calcola nuova data di scadenza
  v_plan_type := v_code_record.plan_type;
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
  
  -- Aggiorna profilo utente
  UPDATE user_profiles
  SET 
    subscription_type = v_plan_type,
    subscription_expires_at = v_new_expiry,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Registra riscatto
  INSERT INTO code_redemptions (code_id, user_id)
  VALUES (v_code_record.id, p_user_id);
  
  -- Incrementa contatore usi
  UPDATE access_codes
  SET used_count = used_count + 1
  WHERE id = v_code_record.id;
  
  RETURN json_build_object(
    'success', TRUE,
    'message', 'Codice riscattato con successo!',
    'plan_type', v_plan_type,
    'expires_at', v_new_expiry
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. VISTA PER STATISTICHE GLOBALI (Admin)
CREATE OR REPLACE VIEW admin_global_stats AS
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM user_profiles WHERE subscription_type != 'free') as premium_users,
  (SELECT COUNT(*) FROM quiz_results) as total_quizzes,
  (SELECT COUNT(*) FROM quiz_results WHERE score_percentage >= 90) as passed_quizzes,
  (SELECT AVG(score_percentage) FROM quiz_results) as avg_score,
  (SELECT COUNT(*) FROM access_codes WHERE is_active = TRUE) as active_codes,
  (SELECT SUM(used_count) FROM access_codes) as total_redemptions;

-- 7. VISTA PER STATISTICHE DOMANDE (Admin)
CREATE OR REPLACE VIEW admin_question_stats AS
SELECT 
  question_id,
  question_text,
  category,
  COUNT(*) as times_asked,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
  ROUND(
    (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 
    2
  ) as success_rate
FROM quiz_answers
GROUP BY question_id, question_text, category
ORDER BY times_asked DESC;

-- ============================================
-- VERIFICA
-- ============================================
SELECT 'Database upgrade completato!' as status,
       'Nuove tabelle: quiz_answers, access_codes, code_redemptions' as info;

-- Verifica tabelle create
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('quiz_answers', 'access_codes', 'code_redemptions')
ORDER BY table_name;

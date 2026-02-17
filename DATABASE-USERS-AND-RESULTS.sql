-- ============================================
-- TABELLE PER UTENTI E RISULTATI
-- Da eseguire DOPO aver caricato le questions
-- ============================================

-- 1. Tabella per i risultati dei quiz
CREATE TABLE IF NOT EXISTS quiz_results (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score_percentage INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  quiz_type TEXT DEFAULT 'free', -- 'free' o 'premium'
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Abilita Row Level Security
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- 3. Policy: gli utenti possono vedere solo i propri risultati
CREATE POLICY "Utenti vedono solo i propri risultati"
ON quiz_results FOR SELECT
USING (auth.uid() = user_id);

-- 4. Policy: gli utenti possono inserire solo i propri risultati
CREATE POLICY "Utenti inseriscono solo i propri risultati"
ON quiz_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Indici per performance
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results(completed_at DESC);

-- 6. Tabella per profili utente (estende auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  subscription_type TEXT DEFAULT 'free', -- 'free', 'last_minute', 'senza_pensieri'
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RLS per user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utenti vedono solo il proprio profilo"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Utenti aggiornano solo il proprio profilo"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- 8. Funzione per creare automaticamente il profilo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, subscription_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger per creare profilo alla registrazione
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Vista per statistiche utente
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  user_id,
  COUNT(*) as total_quizzes,
  AVG(score_percentage) as avg_score,
  MAX(score_percentage) as best_score,
  COUNT(CASE WHEN score_percentage >= 60 THEN 1 END) as passed_count
FROM quiz_results
GROUP BY user_id;

-- ============================================
-- VERIFICA
-- ============================================
SELECT 'Tabelle create con successo!' as status;

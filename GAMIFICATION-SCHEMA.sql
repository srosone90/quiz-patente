-- ============================================
-- GAMIFICATION & SOCIAL FEATURES SCHEMA
-- ============================================

-- Sistema XP e Livelli
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  total_quizzes_completed INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievement/Trofei disponibili
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL, -- es. 'first_quiz', 'week_streak'
  name_it VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  description_it TEXT,
  description_en TEXT,
  icon VARCHAR(50), -- emoji o nome icona
  xp_reward INTEGER DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum
  requirement_type VARCHAR(50), -- 'quiz_count', 'streak', 'accuracy', 'category_master'
  requirement_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievement sbloccati dagli utenti
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Leaderboard (cache giornaliera)
CREATE TABLE IF NOT EXISTS leaderboard_weekly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  total_xp_week INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2),
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Gruppi studio
CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 50,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membri gruppi
CREATE TABLE IF NOT EXISTS study_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Commenti su domande
CREATE TABLE IF NOT EXISTS question_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id INTEGER NOT NULL, -- reference alla domanda
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes su commenti
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES question_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, rewarded
  reward_given BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Profili pubblici
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name VARCHAR(50),
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT false,
  show_stats BOOLEAN DEFAULT true,
  show_achievements BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggiungi colonne a user_profiles se non esistono (per DB esistenti)
DO $$ 
BEGIN
  -- Aggiungi user_id se non esiste
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='user_id') THEN
    ALTER TABLE user_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    -- Rendi unique se possibile (ignora errore se ci sono duplicati)
    BEGIN
      ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignora se constraint fallisce
    END;
  END IF;
  
  -- Aggiungi altre colonne
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='display_name') THEN
    ALTER TABLE user_profiles ADD COLUMN display_name VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='bio') THEN
    ALTER TABLE user_profiles ADD COLUMN bio TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='avatar_url') THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='is_public') THEN
    ALTER TABLE user_profiles ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='show_stats') THEN
    ALTER TABLE user_profiles ADD COLUMN show_stats BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='show_achievements') THEN
    ALTER TABLE user_profiles ADD COLUMN show_achievements BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Impostazioni esame (per countdown)
CREATE TABLE IF NOT EXISTS exam_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  exam_date DATE,
  exam_location VARCHAR(100),
  reminder_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log attività per analytics
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'quiz_completed', 'achievement_unlocked', 'streak_milestone'
  metadata JSONB,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS E TRIGGERS
-- ============================================

-- Function: Calcola livello da XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Livello = sqrt(XP / 100)
  -- 100 XP = livello 1, 400 XP = livello 2, 900 XP = livello 3, etc.
  RETURN GREATEST(1, FLOOR(SQRT(xp / 100.0))::INTEGER);
END;
$$ LANGUAGE plpgsql;

-- Function: Aggiorna progresso utente dopo quiz
CREATE OR REPLACE FUNCTION update_user_progress_after_quiz()
RETURNS TRIGGER AS $$
DECLARE
  xp_gained INTEGER;
  new_level INTEGER;
  streak_bonus INTEGER := 0;
BEGIN
  -- Calcola XP guadagnati (10 XP per risposta corretta, bonus per accuracy)
  xp_gained := (NEW.score / 10) * 10;
  
  -- Bonus streak (se esiste record)
  SELECT current_streak INTO streak_bonus FROM user_progress WHERE user_id = NEW.user_id;
  IF streak_bonus > 0 THEN
    xp_gained := xp_gained + (streak_bonus * 2); -- 2 XP per giorno di streak
  END IF;

  -- Upsert user_progress
  INSERT INTO user_progress (user_id, total_xp, total_quizzes_completed, total_questions_answered, correct_answers, last_activity_date)
  VALUES (
    NEW.user_id,
    xp_gained,
    1,
    NEW.total_questions,
    NEW.score,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_progress.total_xp + xp_gained,
    total_quizzes_completed = user_progress.total_quizzes_completed + 1,
    total_questions_answered = user_progress.total_questions_answered + NEW.total_questions,
    correct_answers = user_progress.correct_answers + NEW.score,
    level = calculate_level(user_progress.total_xp + xp_gained),
    updated_at = NOW();

  -- Aggiorna streak se necessario (se ultima attività era ieri, incrementa; altrimenti reset)
  UPDATE user_progress
  SET 
    current_streak = CASE
      WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
      WHEN last_activity_date = CURRENT_DATE THEN current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(longest_streak, CASE
      WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
      WHEN last_activity_date = CURRENT_DATE THEN current_streak
      ELSE 1
    END),
    last_activity_date = CURRENT_DATE
  WHERE user_id = NEW.user_id;

  -- Log attività
  INSERT INTO activity_log (user_id, activity_type, metadata, xp_earned)
  VALUES (NEW.user_id, 'quiz_completed', jsonb_build_object('score', NEW.score, 'category', NEW.category), xp_gained);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Dopo inserimento risultato quiz
DROP TRIGGER IF EXISTS after_quiz_result_insert ON quiz_results;
CREATE TRIGGER after_quiz_result_insert
AFTER INSERT ON quiz_results
FOR EACH ROW
EXECUTE FUNCTION update_user_progress_after_quiz();

-- ============================================
-- INDEXES per performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON user_progress(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_xp ON user_progress(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_week ON leaderboard_weekly(week_start, rank);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_comments_question ON question_comments(question_id, created_at DESC);

-- ============================================
-- SEED: Achievement predefiniti
-- ============================================

INSERT INTO achievements (code, name_it, name_en, description_it, description_en, icon, xp_reward, tier, requirement_type, requirement_value) VALUES
('first_quiz', 'Primo Quiz', 'First Quiz', 'Completa il tuo primo quiz', 'Complete your first quiz', '🎯', 50, 'bronze', 'quiz_count', 1),
('quiz_10', 'Studente Dedicato', 'Dedicated Student', 'Completa 10 quiz', 'Complete 10 quizzes', '📚', 100, 'bronze', 'quiz_count', 10),
('quiz_50', 'Esperto', 'Expert', 'Completa 50 quiz', 'Complete 50 quizzes', '🏆', 300, 'silver', 'quiz_count', 50),
('quiz_100', 'Maestro', 'Master', 'Completa 100 quiz', 'Complete 100 quizzes', '👑', 500, 'gold', 'quiz_count', 100),
('quiz_500', 'Leggenda', 'Legend', 'Completa 500 quiz', 'Complete 500 quizzes', '⭐', 1000, 'platinum', 'quiz_count', 500),

('streak_3', 'Costanza', 'Consistency', '3 giorni di studio consecutivi', '3 day study streak', '🔥', 50, 'bronze', 'streak', 3),
('streak_7', 'Settimana Perfetta', 'Perfect Week', '7 giorni di studio consecutivi', '7 day study streak', '🌟', 150, 'silver', 'streak', 7),
('streak_30', 'Disciplina di Ferro', 'Iron Discipline', '30 giorni di studio consecutivi', '30 day study streak', '💎', 500, 'gold', 'streak', 30),

('accuracy_80', 'Precisione', 'Accuracy', '80% risposte corrette (min 50 quiz)', '80% correct answers (min 50 quizzes)', '🎯', 200, 'silver', 'accuracy', 80),
('accuracy_90', 'Perfezionista', 'Perfectionist', '90% risposte corrette (min 100 quiz)', '90% correct answers (min 100 quizzes)', '✨', 400, 'gold', 'accuracy', 90),
('accuracy_95', 'Inarrestabile', 'Unstoppable', '95% risposte corrette (min 100 quiz)', '95% correct answers (min 100 quizzes)', '🚀', 800, 'platinum', 'accuracy', 95),

('level_5', 'Livello 5', 'Level 5', 'Raggiungi il livello 5', 'Reach level 5', '⬆️', 100, 'bronze', 'level', 5),
('level_10', 'Livello 10', 'Level 10', 'Raggiungi il livello 10', 'Reach level 10', '⬆️⬆️', 250, 'silver', 'level', 10),
('level_20', 'Livello 20', 'Level 20', 'Raggiungi il livello 20', 'Reach level 20', '💫', 500, 'gold', 'level', 20),

('category_master_segnali', 'Maestro Segnali', 'Signs Master', 'Completa 30 quiz categoria segnali con 90% accuracy', 'Complete 30 sign quizzes with 90% accuracy', '🚦', 300, 'gold', 'category_master', 1),
('category_master_precedenze', 'Maestro Precedenze', 'Priority Master', 'Completa 30 quiz categoria precedenze con 90% accuracy', 'Complete 30 priority quizzes with 90% accuracy', '🚸', 300, 'gold', 'category_master', 2)

ON CONFLICT (code) DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Public leaderboard readable" ON user_progress;
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Public profiles readable" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public groups readable" ON study_groups;
DROP POLICY IF EXISTS "Members can read groups" ON study_groups;
DROP POLICY IF EXISTS "Comments readable" ON question_comments;
DROP POLICY IF EXISTS "Authenticated can comment" ON question_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON question_comments;
DROP POLICY IF EXISTS "Users manage own exam settings" ON exam_settings;

-- User progress: users can read their own, public leaderboard can read top 100
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public leaderboard readable" ON user_progress FOR SELECT USING (true);

-- User achievements: users can read their own
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Profiles: public profiles readable by all, own profile editable
CREATE POLICY "Public profiles readable" ON user_profiles FOR SELECT USING (user_profiles.is_public = true OR auth.uid() = user_profiles.user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_profiles.user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_profiles.user_id);

-- Study groups: public groups readable, members can read private groups
CREATE POLICY "Public groups readable" ON study_groups FOR SELECT USING (study_groups.is_public = true);
CREATE POLICY "Members can read groups" ON study_groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_groups.id AND user_id = auth.uid())
);

-- Comments: all readable, authenticated can insert
CREATE POLICY "Comments readable" ON question_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can comment" ON question_comments FOR INSERT WITH CHECK (auth.uid() = question_comments.user_id);
CREATE POLICY "Users can update own comments" ON question_comments FOR UPDATE USING (auth.uid() = question_comments.user_id);

-- Exam settings: users manage their own
CREATE POLICY "Users manage own exam settings" ON exam_settings FOR ALL USING (auth.uid() = exam_settings.user_id);

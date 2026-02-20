-- ============================================
-- FIX ROW LEVEL SECURITY POLICIES
-- Abilita policies per permettere agli utenti di salvare i risultati quiz
-- ============================================

-- 🔴 PROBLEMA: Gli utenti non possono salvare i risultati quiz
-- 🔧 SOLUZIONE: Creare policies RLS che permettano insert/select dei propri dati

-- ============================================
-- TABELLA: quiz_results
-- ============================================

-- Abilita RLS se non già attivo
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Drop policies esistenti (se ce ne sono)
DROP POLICY IF EXISTS "Users can insert their own quiz results" ON quiz_results;
DROP POLICY IF EXISTS "Users can view their own quiz results" ON quiz_results;

-- Policy per permettere agli utenti di INSERIRE i propri risultati
CREATE POLICY "Users can insert their own quiz results"
ON quiz_results
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy per permettere agli utenti di LEGGERE i propri risultati
CREATE POLICY "Users can view their own quiz results"
ON quiz_results
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- TABELLA: quiz_answers
-- ============================================

-- Abilita RLS se non già attivo
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Drop policies esistenti (se ce ne sono)
DROP POLICY IF EXISTS "Users can insert their own quiz answers" ON quiz_answers;
DROP POLICY IF EXISTS "Users can view their own quiz answers" ON quiz_answers;

-- Policy per permettere agli utenti di INSERIRE le proprie risposte
CREATE POLICY "Users can insert their own quiz answers"
ON quiz_answers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy per permettere agli utenti di LEGGERE le proprie risposte
CREATE POLICY "Users can view their own quiz answers"
ON quiz_answers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- TABELLA: user_progress (gamification)
-- ============================================

-- Abilita RLS se non già attivo
ALTER TABLE IF EXISTS user_progress ENABLE ROW LEVEL SECURITY;

-- Drop policies esistenti (se ce ne sono)
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;

-- Policies per user_progress
CREATE POLICY "Users can view their own progress"
ON user_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON user_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON user_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VERIFICA POLICIES ATTIVE
-- ============================================

-- Mostra tutte le policies su quiz_results
SELECT 
    schemaname,
    tablename,
    policyname as "Nome Policy",
    cmd as "Comando",
    qual as "Using Expression",
    with_check as "With Check Expression"
FROM pg_policies
WHERE tablename IN ('quiz_results', 'quiz_answers', 'user_progress')
ORDER BY tablename, cmd, policyname;

-- Test rapido: verifica che RLS sia attivo
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Attivo"
FROM pg_tables
WHERE tablename IN ('quiz_results', 'quiz_answers', 'user_progress');

-- ============================================
-- ✅ DOPO AVER ESEGUITO QUESTO SCRIPT:
-- ============================================
-- 1. Gli utenti potranno salvare i risultati dei quiz
-- 2. Ogni utente vedrà solo i propri dati
-- 3. I progressi gamification saranno salvati correttamente
-- 4. La dashboard, statistiche e ripasso si aggiorneranno dopo ogni quiz

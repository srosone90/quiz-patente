-- ============================================
-- FIX ROW LEVEL SECURITY - USER ACHIEVEMENTS
-- Abilita policies per permettere agli utenti di sbloccare achievement
-- ============================================

-- 🔴 PROBLEMA: 403 Forbidden su user_achievements
-- 🔧 SOLUZIONE: Creare policies RLS per INSERT e SELECT

-- ============================================
-- TABELLA: user_achievements
-- ============================================

-- Abilita RLS se non già attivo
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Drop policies esistenti (se ce ne sono)
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;

-- Policy per permettere agli utenti di VEDERE i propri achievement
CREATE POLICY "Users can view their own achievements"
ON user_achievements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di SBLOCCARE achievement
CREATE POLICY "Users can insert their own achievements"
ON user_achievements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABELLA: achievements (definizioni)
-- ============================================

-- Abilita RLS se non già attivo
ALTER TABLE IF EXISTS achievements ENABLE ROW LEVEL SECURITY;

-- Drop policies esistenti (se ce ne sono)
DROP POLICY IF EXISTS "Everyone can view achievements" ON achievements;

-- Policy per permettere a TUTTI di vedere gli achievement disponibili
CREATE POLICY "Everyone can view achievements"
ON achievements
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- VERIFICA POLICIES ATTIVE
-- ============================================

-- Mostra tutte le policies su achievements
SELECT 
    schemaname,
    tablename,
    policyname as "Nome Policy",
    cmd as "Comando",
    qual as "Using Expression",
    with_check as "With Check Expression"
FROM pg_policies
WHERE tablename IN ('user_achievements', 'achievements')
ORDER BY tablename, cmd, policyname;

-- Test rapido: verifica che RLS sia attivo
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Attivo"
FROM pg_tables
WHERE tablename IN ('user_achievements', 'achievements');

-- ============================================
-- ✅ DOPO AVER ESEGUITO QUESTO SCRIPT:
-- ============================================
-- 1. Gli utenti potranno sbloccare achievement
-- 2. Gli utenti vedranno i loro achievement
-- 3. Errore 403 su user_achievements sparirà
-- 4. Sistema gamification completamente funzionante

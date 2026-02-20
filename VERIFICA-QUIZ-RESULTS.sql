-- ============================================
-- VERIFICA STRUTTURA TABELLA quiz_results
-- ============================================
-- Questo script mostra la struttura reale della tabella
-- per capire quali colonne esistono e come si chiamano
-- ============================================

-- STEP 1: Mostra tutte le colonne di quiz_results
SELECT 
    column_name as "Nome Colonna",
    data_type as "Tipo",
    is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_name = 'quiz_results'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2: Mostra un esempio di record (primi 3)
SELECT *
FROM quiz_results
ORDER BY created_at DESC
LIMIT 3;

-- STEP 3: Verifica RLS abilitato
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Abilitato"
FROM pg_tables
WHERE tablename = 'quiz_results';

-- STEP 4: Mostra tutte le policy su quiz_results
SELECT 
    policyname as "Nome Policy",
    cmd as "Comando",
    permissive as "Permissiva",
    roles as "Ruoli",
    qual as "Condizione USING"
FROM pg_policies
WHERE tablename = 'quiz_results'
ORDER BY cmd, policyname;

-- ============================================
-- COSA CERCARE:
-- ============================================
-- STEP 1: Nomi esatti delle colonne
--   - È "score" o "score_percentage"?
--   - È "passed" o qualcos'altro?
--   - C'è "created_at"?
--
-- STEP 2: Se ci sono record con dati validi
--
-- STEP 3: Se RLS è abilitato (t = true, f = false)
--
-- STEP 4: Se le policy esistono e sono corrette
-- ============================================

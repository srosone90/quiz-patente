-- ============================================
-- RLS POLICIES per ANALYTICS ADMIN
-- ============================================
-- Crea le policy necessarie per permettere all'admin di:
-- - Leggere quiz_results
-- - Leggere access_codes  
-- - Leggere code_redemptions
-- ============================================

-- STEP 1: Abilita RLS sulle tabelle (se non già abilitato)
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_redemptions ENABLE ROW LEVEL SECURITY;

-- STEP 2: Policy per quiz_results
-- Gli utenti vedono i propri risultati
CREATE POLICY "users_view_own_quiz_results"
ON quiz_results
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Gli admin vedono tutti i risultati
CREATE POLICY "admins_view_all_quiz_results"
ON quiz_results
FOR SELECT
TO authenticated
USING (is_current_user_admin());

-- STEP 3: Policy per access_codes
-- Gli admin vedono tutti i codici
CREATE POLICY "admins_view_all_access_codes"
ON access_codes
FOR SELECT
TO authenticated
USING (is_current_user_admin());

-- Gli admin possono creare codici
CREATE POLICY "admins_insert_access_codes"
ON access_codes
FOR INSERT
TO authenticated
WITH CHECK (is_current_user_admin());

-- Gli admin possono aggiornare codici
CREATE POLICY "admins_update_access_codes"
ON access_codes
FOR UPDATE
TO authenticated
USING (is_current_user_admin());

-- STEP 4: Policy per code_redemptions
-- Gli utenti vedono i propri riscatti
CREATE POLICY "users_view_own_redemptions"
ON code_redemptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Gli admin vedono tutti i riscatti
CREATE POLICY "admins_view_all_redemptions"
ON code_redemptions
FOR SELECT
TO authenticated
USING (is_current_user_admin());

-- Gli utenti possono riscattare codici
CREATE POLICY "users_redeem_codes"
ON code_redemptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- STEP 5: Verifica policies create
SELECT 
    tablename,
    policyname,
    cmd as "Operazione",
    CASE 
        WHEN cmd = 'SELECT' THEN '👀 Lettura'
        WHEN cmd = 'INSERT' THEN '➕ Inserimento'
        WHEN cmd = 'UPDATE' THEN '🔧 Aggiornamento'
    END as "Tipo"
FROM pg_policies
WHERE tablename IN ('quiz_results', 'access_codes', 'code_redemptions')
ORDER BY tablename, cmd, policyname;

-- ============================================
-- RISULTATO ATTESO:
-- ============================================
-- Policies create per:
-- - quiz_results: 2 policies SELECT (utenti + admin)
-- - access_codes: 3 policies (SELECT, INSERT, UPDATE per admin)
-- - code_redemptions: 3 policies (SELECT utenti, SELECT admin, INSERT utenti)
-- ============================================

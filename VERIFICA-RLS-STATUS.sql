-- ============================================
-- VERIFICA STATUS COMPLETO RLS
-- ============================================

-- STEP 1: Verifica policy attive su user_profiles
SELECT 
    policyname as "Nome Policy",
    cmd as "Comando",
    qual as "Condizione USING",
    with_check as "Condizione WITH CHECK"
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- STEP 2: Verifica se RLS è abilitato
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Abilitato"
FROM pg_tables
WHERE tablename = 'user_profiles';

-- STEP 3: Tenta di leggere il TUO profilo come faresti dall'app
-- Simula la lettura con il tuo UUID
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'a6627320-e650-46cd-a928-fc3824a8697b';

SELECT 
    id,
    full_name,
    subscription_type,
    role
FROM user_profiles
WHERE id = 'a6627320-e650-46cd-a928-fc3824a8697b';

RESET ROLE;

-- STEP 4: Mostra TUTTE le policy su user_profiles (anche quelle che bloccano)
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

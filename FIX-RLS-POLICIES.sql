-- Fix RLS Policies per user_profiles
-- Permette agli utenti di creare e aggiornare il proprio profilo

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles readable" ON user_profiles;

-- Crea policy per INSERT (necessaria per upsert)
CREATE POLICY "Users can insert own profile" 
ON user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Crea policy per UPDATE
CREATE POLICY "Users can update own profile" 
ON user_profiles 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Crea policy per SELECT (proprio profilo)
CREATE POLICY "Users can view own profile" 
ON user_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Crea policy per SELECT (profili pubblici)
CREATE POLICY "Public profiles readable" 
ON user_profiles 
FOR SELECT 
USING (is_public = true);

-- Aggiunge colonna image_url alla tabella questions
-- Esegui questo script su Supabase SQL Editor

ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT;

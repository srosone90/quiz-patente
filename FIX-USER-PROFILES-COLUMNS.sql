-- Aggiungi colonne mancanti alla tabella user_profiles esistente

-- Aggiungi display_name se non esiste
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN display_name VARCHAR(50);
  END IF;
END $$;

-- Aggiungi bio se non esiste
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN bio TEXT;
  END IF;
END $$;

-- Aggiungi avatar_url se non esiste
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Aggiungi is_public se non esiste
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Aggiungi show_stats se non esiste
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'show_stats'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN show_stats BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Aggiungi show_achievements se non esiste
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'show_achievements'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN show_achievements BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Aggiungi referral_code se non esiste
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN referral_code VARCHAR(20) UNIQUE;
  END IF;
END $$;

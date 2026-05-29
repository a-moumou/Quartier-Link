-- Aligner la table public.users sur src/Entity/User.php (colonnes firstname, lastname, password, etc.)
--
-- Usage :
--   psql -U <utilisateur> -d QuartierLink -f backend/migrations/sql/upgrade_users_table_postgresql.sql
--
-- Erreur typique sans ce script : column "firstname" does not exist

BEGIN;

-- 1) Colonnes manquantes (schéma Doctrine)
ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'USER';

-- status : VARCHAR suffit pour Doctrine (valeurs NON_VERIFIE / EN_ATTENTE / VERIFIE)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'NON_VERIFIE';

ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2) Copie depuis l’ancien schéma (si les colonnes existent encore)

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'nom'
    ) THEN
        EXECUTE $u$
            UPDATE users SET
                firstname = COALESCE(NULLIF(trim(split_part(trim(COALESCE(nom, '')), ' ', 1)), ''), ''),
                lastname = CASE
                    WHEN position(' ' in trim(COALESCE(nom, ''))) > 0
                    THEN trim(substring(trim(nom) from position(' ' in trim(nom)) + 1))
                    ELSE ''
                END
            WHERE firstname IS NULL OR firstname = '';
        $u$;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'mot_de_passe'
    ) THEN
        EXECUTE 'UPDATE users SET password = mot_de_passe WHERE password IS NULL AND mot_de_passe IS NOT NULL';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'adresse'
    ) THEN
        EXECUTE 'UPDATE users SET address = adresse WHERE address IS NULL AND adresse IS NOT NULL';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'statut_verification'
    ) THEN
        EXECUTE $q$
            UPDATE users
            SET status = trim(statut_verification::text)
            WHERE (status IS NULL OR trim(coalesce(status, '')) = '')
              AND statut_verification IS NOT NULL
        $q$;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'date_creation'
    ) THEN
        EXECUTE 'UPDATE users SET created_at = date_creation WHERE created_at IS NULL AND date_creation IS NOT NULL';
    END IF;
END $$;

-- Valeurs par défaut si toujours vides
UPDATE users SET firstname = '' WHERE firstname IS NULL;
UPDATE users SET lastname = '' WHERE lastname IS NULL;
UPDATE users SET status = 'NON_VERIFIE' WHERE status IS NULL OR trim(status) = '';
UPDATE users SET role = 'USER' WHERE role IS NULL OR trim(role) = '';

COMMIT;

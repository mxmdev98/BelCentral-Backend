-- =====================================================================
-- 001_init.sql — Bel Central LLG Record Book
-- Initial schema: villages, tribes, clans, residents, users
-- =====================================================================
-- Run order: psql -d record_book -f migrations/001_init.sql
-- Idempotent: uses IF NOT EXISTS / CREATE EXTENSION IF NOT EXISTS.
-- =====================================================================

-- UUID generation (Postgres 13+ has gen_random_uuid() in pgcrypto,
-- 14+ has it built-in; we keep pgcrypto for portability.)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('official', 'admin')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- villages
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS villages (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- tribes (each tribe belongs to exactly one village)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tribes (
    id         SERIAL PRIMARY KEY,
    village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT tribes_village_name_unique UNIQUE (village_id, name)
);

-- ---------------------------------------------------------------------
-- clans (each clan belongs to exactly one tribe)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clans (
    id         SERIAL PRIMARY KEY,
    tribe_id   INTEGER NOT NULL REFERENCES tribes(id) ON DELETE RESTRICT,
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT clans_tribe_name_unique UNIQUE (tribe_id, name)
);

-- ---------------------------------------------------------------------
-- residents
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS residents (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name        TEXT NOT NULL,
    father_name      TEXT NOT NULL,
    mother_name      TEXT NOT NULL,
    gender           TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
    date_of_birth    DATE NOT NULL,
    age              INTEGER NOT NULL CHECK (age BETWEEN 0 AND 130),
    village_id       INTEGER NOT NULL REFERENCES villages(id) ON DELETE RESTRICT,
    tribe_id         INTEGER NOT NULL REFERENCES tribes(id) ON DELETE RESTRICT,
    clan_id          INTEGER NOT NULL REFERENCES clans(id) ON DELETE RESTRICT,
    employment_status TEXT NOT NULL CHECK (employment_status IN
                        ('Employed','Unemployed','Student','Retired','Self-Employed')),
    marital_status   TEXT NOT NULL CHECK (marital_status IN
                        ('Single','Married','Widowed','Divorced','Separated')),
    education_level  TEXT NOT NULL CHECK (education_level IN
                        ('None','Primary','Secondary','Vocational','Tertiary')),
    profession       TEXT,
    created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ,                          -- soft delete
    -- Duplicate prevention: same name + DOB + clan => same person
    CONSTRAINT residents_name_dob_clan_unique
        UNIQUE (full_name, date_of_birth, clan_id)
);

-- Indexes that the search + reports pages will hit.
CREATE INDEX IF NOT EXISTS idx_residents_village   ON residents(village_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_residents_tribe     ON residents(tribe_id)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_residents_clan      ON residents(clan_id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_residents_gender    ON residents(gender)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_residents_dob       ON residents(date_of_birth) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_residents_full_name ON residents USING gin (to_tsvector('simple', full_name)) WHERE deleted_at IS NULL;

-- updated_at auto-touch trigger
CREATE OR REPLACE FUNCTION trg_residents_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS residents_set_updated_at ON residents;
CREATE TRIGGER residents_set_updated_at
    BEFORE UPDATE ON residents
    FOR EACH ROW
    EXECUTE FUNCTION trg_residents_set_updated_at();

-- =====================================================================
-- 002_seed.sql is separate. Run it after this file.
-- =====================================================================

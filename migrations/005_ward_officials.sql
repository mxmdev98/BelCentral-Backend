-- =====================================================================
-- 005_ward_officials.sql — Register of Ward Officials
-- Stores ward officials (Councilor, Recorder, Magistrate, etc.)
-- Idempotent: uses IF NOT EXISTS + ON CONFLICT.
-- =====================================================================

CREATE TABLE IF NOT EXISTS ward_officials (
    id              SERIAL PRIMARY KEY,
    surname         TEXT NOT NULL,
    given_name      TEXT NOT NULL,
    gender          TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
    date_of_birth   DATE,
    official_type   TEXT NOT NULL,   -- e.g. 'Ward Member', 'Ward Recorder', 'Village Court Official'
    position_status TEXT NOT NULL,   -- e.g. 'Councilor', 'Recorder', 'Magistrate'
    village_id      INTEGER REFERENCES villages(id) ON DELETE SET NULL,
    phone           TEXT,
    email           TEXT,
    appointed_date  DATE,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ward_officials_active ON ward_officials(is_active);

-- updated_at auto-touch trigger
CREATE OR REPLACE FUNCTION trg_ward_officials_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ward_officials_set_updated_at ON ward_officials;
CREATE TRIGGER ward_officials_set_updated_at
    BEFORE UPDATE ON ward_officials
    FOR EACH ROW
    EXECUTE FUNCTION trg_ward_officials_set_updated_at();

-- Seed from the Ward One Record Book.docx (Register of Ward Officials)
-- is_active defaults to true (column has DEFAULT true), so we omit it here.
INSERT INTO ward_officials (surname, given_name, gender, date_of_birth, official_type, position_status)
VALUES
    ('Fan',    'Trevor',  'Male',   '1991-02-23', 'Ward Member',              'Councilor'),
    ('Siming', 'Jass',    'Male',   NULL,         'Ward Recorder',            'Recorder'),
    ('Baran',  'Yaling',  'Male',   NULL,         'Village Court Official',   'Magistrate'),
    ('Oscar',  'Edwina',  'Female', NULL,         'Council of Women Ward 1 Ambenob', 'President'),
    ('Bosley', 'Wesley',  'Male',   NULL,         'Churches',                 'Ward 1 Church Rep')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 006_rbac.sql — Role-based access control
--   1. Add is_active to users (admin can disable an account without deleting)
--   2. Create user_permissions table (per-user, per-resource, per-action)
--   3. Seed default: admin gets no permission rows (admin role bypasses all checks)
-- =====================================================================

-- 1) Add is_active column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 2) user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource    TEXT NOT NULL,            -- 'residents', 'ward_officials', etc.
    can_read    BOOLEAN NOT NULL DEFAULT false,
    can_create  BOOLEAN NOT NULL DEFAULT false,
    can_update  BOOLEAN NOT NULL DEFAULT false,
    -- NOTE: can_delete is intentionally absent — only admin role can delete.
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, resource)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION trg_user_permissions_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_permissions_set_updated_at ON user_permissions;
CREATE TRIGGER user_permissions_set_updated_at
    BEFORE UPDATE ON user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION trg_user_permissions_set_updated_at();

-- 3) No seed rows needed — admin role bypasses permission checks entirely.
--    Officials start with no permissions; admin grants them via the UI.

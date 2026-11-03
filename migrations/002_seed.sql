-- =====================================================================
-- 002_seed.sql — Sample/placeholder data (DISABLED)
-- =====================================================================
-- The admin user is seeded by `npm run seed:admin` (src/db/seed-admin.ts)
-- so that the bcrypt hash is generated correctly at runtime.
--
-- Real Ward One data (Kranget Island, Panitibun Island, Bilia Island,
-- Bilia Mainland) is loaded by 003_import_ward_one.sql.
--
-- This file is intentionally left empty so the placeholder villages
-- ("Bel Central Village", "Apana Village", "Wanga Village") do NOT get
-- created. If you want the placeholder sample data back, restore the
-- previous version from git history.
-- =====================================================================

-- (no-op)
SELECT 1;

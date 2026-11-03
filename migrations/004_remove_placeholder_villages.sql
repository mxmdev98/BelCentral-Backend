-- =====================================================================
-- 004_remove_placeholder_villages.sql
-- Removes the sample villages that 002_seed.sql originally inserted.
-- Run once to clean up after upgrading to a real-data install.
-- Idempotent: safe to re-run.
-- =====================================================================

BEGIN;

-- 1) Delete any residents belonging to those villages (safety net).
DELETE FROM residents
WHERE village_id IN (
  SELECT id FROM villages
  WHERE name IN ('Bel Central Village', 'Apana Village', 'Wanga Village')
);

-- 2) Delete clans belonging to tribes in those villages.
DELETE FROM clans
WHERE tribe_id IN (
  SELECT t.id FROM tribes t
  JOIN villages v ON v.id = t.village_id
  WHERE v.name IN ('Bel Central Village', 'Apana Village', 'Wanga Village')
);

-- 3) Delete tribes in those villages.
DELETE FROM tribes
WHERE village_id IN (
  SELECT id FROM villages
  WHERE name IN ('Bel Central Village', 'Apana Village', 'Wanga Village')
);

-- 4) Finally, delete the placeholder villages themselves.
DELETE FROM villages
WHERE name IN ('Bel Central Village', 'Apana Village', 'Wanga Village');

COMMIT;

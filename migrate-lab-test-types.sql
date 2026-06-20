-- migrate-lab-test-types.sql
-- Migrates lab_test_types table data into the services table,
-- then drops the lab_test_types table.
--
-- Run this script ONCE against the database before deploying the updated code.
-- Example: psql -U <user> -d <database> -f migrate-lab-test-types.sql

BEGIN;

-- Step 1: Insert each existing lab test type into services as a 'lab' category
-- item with variable pricing. Skips duplicates (by name) silently.
INSERT INTO services (name, category, price, is_variable_price, is_system)
SELECT
  name,
  'lab'  AS category,
  0      AS price,
  TRUE   AS is_variable_price,
  FALSE  AS is_system
FROM lab_test_types
ON CONFLICT (name) DO NOTHING;

-- Step 2: Drop the now-redundant lab_test_types table
DROP TABLE IF EXISTS lab_test_types;

COMMIT;

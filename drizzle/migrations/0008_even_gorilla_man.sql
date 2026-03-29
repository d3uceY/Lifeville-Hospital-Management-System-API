-- Migration: Convert lab_tests.test_type from text to text[]
-- Existing single-value rows are wrapped in a singleton array

ALTER TABLE lab_tests
    ALTER COLUMN test_type TYPE text[]
    USING ARRAY[test_type];

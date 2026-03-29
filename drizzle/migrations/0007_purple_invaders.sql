-- Migration: Convert diagnoses.condition to jsonb, add visit_id, convert discharge_summary.final_diagnosis to jsonb

-- 1. Add visit_id column to diagnoses
ALTER TABLE diagnoses
    ADD COLUMN IF NOT EXISTS visit_id integer REFERENCES patient_visits(id) ON DELETE SET NULL;

-- 2. Change diagnoses.condition from text to jsonb
--    Existing text values (ICD codes) are migrated to { "code": "" } so data is not lost
ALTER TABLE diagnoses
    ALTER COLUMN condition TYPE jsonb
    USING CASE
        WHEN condition IS NOT NULL AND condition <> ''
            THEN jsonb_build_object(condition, '')
        ELSE NULL
    END;

-- 3. Change discharge_summary.final_diagnosis from text to jsonb
ALTER TABLE discharge_summary
    ALTER COLUMN final_diagnosis TYPE jsonb
    USING CASE
        WHEN final_diagnosis IS NOT NULL AND final_diagnosis <> ''
            THEN jsonb_build_object(final_diagnosis, '')
        ELSE NULL
    END;

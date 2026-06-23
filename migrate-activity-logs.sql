-- Activity Logs table
-- activity_type is a plain varchar — valid values are defined in
-- src/constants/activityTypes.js (no DB enum to keep schema flexible)

CREATE TABLE IF NOT EXISTS activity_logs (
    id          SERIAL PRIMARY KEY,
    activity_type VARCHAR(100) NOT NULL,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
    ON activity_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type
    ON activity_logs (activity_type);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
    ON activity_logs (created_at DESC);

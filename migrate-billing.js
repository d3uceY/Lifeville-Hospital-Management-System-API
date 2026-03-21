/**
 * migrate-billing.js
 * Event-driven billing system migration.
 * Run: node migrate-billing.js
 */

import pg from "pg";
import { SERVICE_CATEGORIES } from "./src/constants/domain.js";

const DB_URL = "postgres://postgres:1001@localhost:5432/LIFEVILLE_HMS_db";

const pool = new pg.Pool({ connectionString: DB_URL });

const migrations = [
  // 1. Add id PK to patient_visits (safely)
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'patient_visits' AND column_name = 'id'
     ) THEN
       ALTER TABLE patient_visits ADD COLUMN id SERIAL;
     END IF;
   END $$;`,

  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'patient_visits' AND constraint_type = 'PRIMARY KEY'
     ) THEN
       ALTER TABLE patient_visits ADD PRIMARY KEY (id);
     END IF;
   END $$;`,

  // 2. Create services table
  `CREATE TABLE IF NOT EXISTS services (
     id         SERIAL PRIMARY KEY,
     name       TEXT NOT NULL,
     category   TEXT NOT NULL DEFAULT 'service',
     price      NUMERIC(12,2) NOT NULL DEFAULT 0,
     is_variable_price BOOLEAN NOT NULL DEFAULT false,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );`,

  // 3. Create invoices table
  `CREATE TABLE IF NOT EXISTS invoices (
     id             SERIAL PRIMARY KEY,
     admission_id   INTEGER REFERENCES inpatient_admissions(id) ON DELETE SET NULL,
     visit_id       INTEGER REFERENCES patient_visits(id) ON DELETE SET NULL,
     invoice_number TEXT NOT NULL,
     status         TEXT NOT NULL DEFAULT 'open',
     created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number)
   );`,

  // 4. Extend bill_items table (all idempotent)
  `ALTER TABLE bill_items ALTER COLUMN bill_id DROP NOT NULL;`,

  `ALTER TABLE bill_items
     ADD COLUMN IF NOT EXISTS invoice_id       INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
     ADD COLUMN IF NOT EXISTS service_id       INTEGER REFERENCES services(id) ON DELETE SET NULL,
     ADD COLUMN IF NOT EXISTS category         TEXT NOT NULL DEFAULT 'service',
     ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
     ADD COLUMN IF NOT EXISTS billing_type     TEXT NOT NULL DEFAULT 'credit',
     ADD COLUMN IF NOT EXISTS created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
     ADD COLUMN IF NOT EXISTS created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,

  // 5. Create billing_payments table
  `CREATE TABLE IF NOT EXISTS billing_payments (
     id             SERIAL PRIMARY KEY,
     invoice_id     INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
     amount         NUMERIC(12,2) NOT NULL,
     payment_method TEXT NOT NULL DEFAULT 'cash',
     notes          TEXT,
     created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
     created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );`,

  // 6. Seed default services (skip if they already exist)
  `INSERT INTO services (name, category, price, is_variable_price) VALUES
     ('Consultation Fee',       '${SERVICE_CATEGORIES.CONSULTATION}', 5000.00, false),
     ('Lab Test',               '${SERVICE_CATEGORIES.LAB}',          3000.00, true),
     ('Drug / Prescription',    '${SERVICE_CATEGORIES.DRUG}',         1000.00, true),
     ('Bed Charge (per day)',   '${SERVICE_CATEGORIES.DAILY_CHARGE}', 5000.00, false),
     ('Nursing Fee (per day)',  '${SERVICE_CATEGORIES.DAILY_CHARGE}', 3000.00, false),
     ('Utility Charge (per day)','${SERVICE_CATEGORIES.DAILY_CHARGE}',1500.00, false),
     ('Procedure Fee',          '${SERVICE_CATEGORIES.SERVICE}',      10000.00,true),
     ('Admission Fee',          '${SERVICE_CATEGORIES.SERVICE}',      2000.00, false)
   ON CONFLICT DO NOTHING;`,
];

async function run() {
  const client = await pool.connect();
  try {
    console.log("  Starting billing migration...\n");
    for (let i = 0; i < migrations.length; i++) {
      console.log(`  [${i + 1}/${migrations.length}] Running step...`);
      await client.query(migrations[i]);
      console.log(`    Step ${i + 1} done`);
    }
    console.log("\n  Migration complete.");
  } catch (err) {
    console.error("\n  Migration failed:", err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

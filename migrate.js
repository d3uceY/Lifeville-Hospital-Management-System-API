/**
 * migrate-billing.js
 * Event-driven billing system migration.
 * Called automatically on app startup.
 */

import { query } from "./drizzle-db.js";
import { SERVICE_CATEGORIES, ROLE_LABELS } from "./src/constants/domain.js";
import { drugServices } from "./src/constants/drugs-constants.js";
import config from "./src/constants/config.js";

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
     is_system  BOOLEAN NOT NULL DEFAULT false,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT services_name_key UNIQUE (name)
   );`,

  // 2b. Add is_system column to existing services table
  `ALTER TABLE services ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;`,

  // 2a. Add unique constraint to existing tables that predate this migration
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'services' AND constraint_name = 'services_name_key'
     ) THEN
       ALTER TABLE services ADD CONSTRAINT services_name_key UNIQUE (name);
     END IF;
   END $$;`,

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
  `INSERT INTO services (name, category, price, is_variable_price, is_system) VALUES
     ('Consultation Fee',       '${SERVICE_CATEGORIES.CONSULTATION}', 5000.00, false, true),
     ('Lab Test',               '${SERVICE_CATEGORIES.LAB}',          3000.00, true,  true),
     ('Drug / Prescription',    '${SERVICE_CATEGORIES.DRUG}',         1000.00, true,  true),
     ('Bed Charge (per day)',   '${SERVICE_CATEGORIES.DAILY_CHARGE}', 5000.00, false, true),
     ('Nursing Fee (per day)',  '${SERVICE_CATEGORIES.DAILY_CHARGE}', 3000.00, false, true),
     ('Utility Charge (per day)','${SERVICE_CATEGORIES.DAILY_CHARGE}',1500.00, false, true),
     ('Procedure Fee',          '${SERVICE_CATEGORIES.SERVICE}',      10000.00,true,  true),
     ('Admission Fee',          '${SERVICE_CATEGORIES.SERVICE}',      2000.00, false, true)
   ON CONFLICT (name) DO UPDATE SET is_system = true;`,

  // 7. Create roles table
  `CREATE TABLE IF NOT EXISTS roles (
     id         SERIAL PRIMARY KEY,
     name       VARCHAR(50) NOT NULL,
     label      VARCHAR(100) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT roles_name_key UNIQUE (name)
   );`,

  // 8. Seed roles
  `INSERT INTO roles (name, label) VALUES
     ${Object.entries(ROLE_LABELS).map(([name, label]) => `('${name}', '${label}')`).join(",\n     ")}
   ON CONFLICT DO NOTHING;`,

  // 9. Add role_id to users (FK to roles)
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;`,

  // 10. Backfill role_id from existing role text column
  `UPDATE users u SET role_id = r.id FROM roles r WHERE u.role = r.name AND u.role_id IS NULL;`,

  // 11. Add recipient_roles TEXT[] to notifications (one row targets multiple roles)
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_roles TEXT[];`,

  // 12. GIN index for efficient array lookup
  `CREATE INDEX IF NOT EXISTS idx_notifications_recipient_roles ON notifications USING GIN(recipient_roles);`,

  // 13. Backfill: convert existing recipient_role string into the new array column
  `UPDATE notifications SET recipient_roles = ARRAY[recipient_role]
   WHERE recipient_role IS NOT NULL AND recipient_role <> '' AND recipient_roles IS NULL;`,
];

export async function runBillingMigration() {
  try {
    console.log("  Starting billing migration...\n");
    for (let i = 0; i < migrations.length; i++) {
      console.log(`  [${i + 1}/${migrations.length}] Running step...`);
      await query(migrations[i]);
      console.log(`    Step ${i + 1} done`);
    }
    console.log("\n  Billing migration complete.");
  } catch (err) {
    console.error("\n  Billing migration failed:", err.message);
    console.error(err);
  }
}

export async function seedDrugServices() {
  if (config.seed.seedDrugServices !== "true") {
    console.log("  SEED_DRUG_SERVICES is not enabled. Skipping drug seeding.");
    return;
  }

  try {
    console.log("  Seeding drug services...");

    const values = drugServices
      .map(
        (d) =>
          `(${[
            `'${d.name.replace(/'/g, "''")}'`,
            `'${d.category}'`,
            d.price,
            d.isVariablePrice,
            d.isSystem,
          ].join(", ")})`
      )
      .join(",\n     ");

    const sql = `INSERT INTO services (name, category, price, is_variable_price, is_system)
     VALUES
     ${values}
     ON CONFLICT (name) DO NOTHING;`;

    await query(sql);
    console.log(`  Drug services seeded (${drugServices.length} entries, conflicts skipped).`);
  } catch (err) {
    console.error("  Drug service seeding failed:", err.message);
    console.error(err);
  }
}

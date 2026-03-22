/**
 * migrate-patient-invoices.js
 * Adds patient_id to invoices table for standalone manual invoices.
 * Also adds service_id + unit_price to prescription_items and procedures.
 */
import pg from "pg";

const pool = new pg.Pool({ connectionString: "postgres://postgres:1001@localhost:5432/LIFEVILLE_HMS_db" });

const steps = [
  {
    label: "Add patient_id to invoices",
    sql: `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS patient_id INTEGER REFERENCES patients(patient_id) ON DELETE SET NULL`,
  },
  {
    label: "Add service_id to prescription_items",
    sql: `ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS service_id INTEGER REFERENCES services(id) ON DELETE SET NULL`,
  },
  {
    label: "Add unit_price to prescription_items",
    sql: `ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0`,
  },
  {
    label: "Add service_id to procedures",
    sql: `ALTER TABLE procedures ADD COLUMN IF NOT EXISTS service_id INTEGER REFERENCES services(id) ON DELETE SET NULL`,
  },
  {
    label: "Add unit_price to procedures",
    sql: `ALTER TABLE procedures ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0`,
  },
];

for (const step of steps) {
  try {
    await pool.query(step.sql);
    console.log(`✅ ${step.label}`);
  } catch (e) {
    console.error(`❌ ${step.label}: ${e.message}`);
  }
}

await pool.end();
console.log("Migration complete.");

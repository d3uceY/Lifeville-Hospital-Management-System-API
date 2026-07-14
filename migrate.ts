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
  // 1. Seed default services (skip if they already exist)
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

  // 2. Seed roles
  `INSERT INTO roles (name, label) VALUES
     ${Object.entries(ROLE_LABELS).map(([name, label]) => `('${name}', '${label}')`).join(",\n     ")}
   ON CONFLICT DO NOTHING;`,

  // 3. Backfill role_id from existing role text column
  `UPDATE users u SET role_id = r.id FROM roles r WHERE u.role = r.name AND u.role_id IS NULL;`,

  // 4. Backfill: convert existing recipient_role string into the new array column
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

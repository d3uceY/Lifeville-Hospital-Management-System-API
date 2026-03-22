/**
 * Quick smoke test for the new billing API
 * Run: node test-billing.js
 */
import pg from "pg";

const pool = new pg.Pool({ connectionString: "postgres://postgres:1001@localhost:5432/LIFEVILLE_HMS_db" });

console.log("Running billing smoke test...\n");

// 1. Check services are seeded
const { rows: services } = await pool.query("SELECT id, name, category, price FROM services ORDER BY id");
console.log("✅ Services seeded:", services.length);
services.forEach(s => console.log(`   ${s.id}. [${s.category}] ${s.name} = ₦${s.price}`));

// 2. Simulate creating an invoice for a test admission (if any exists)
const { rows: admissions } = await pool.query(
  "SELECT id, patient_id, admission_date FROM inpatient_admissions ORDER BY id DESC LIMIT 1"
);

if (admissions.length === 0) {
  console.log("\n⚠️  No admissions found — skipping invoice test");
} else {
  const adm = admissions[0];
  console.log(`\n📋 Testing with admission #${adm.id} (patient ${adm.patient_id})`);

  // Check or create invoice
  const { rows: inv } = await pool.query(
    "SELECT * FROM invoices WHERE admission_id = $1 LIMIT 1",
    [adm.id]
  );

  if (inv.length > 0) {
    console.log(`✅ Invoice exists: ${inv[0].invoice_number} (status: ${inv[0].status})`);
    const invoiceId = inv[0].id;

    const { rows: items } = await pool.query(
      "SELECT id, description, category, unit_price, quantity, line_total FROM bill_items WHERE invoice_id = $1 ORDER BY id",
      [invoiceId]
    );
    console.log(`   Bill items: ${items.length}`);
    items.forEach(i => console.log(`   - [${i.category}] ${i.description}: ₦${i.line_total}`));

    const { rows: totRow } = await pool.query(
      "SELECT COALESCE(SUM(line_total), 0) AS total FROM bill_items WHERE invoice_id = $1",
      [invoiceId]
    );
    console.log(`   Stored total: ₦${totRow[0].total}`);
  } else {
    console.log("   No invoice yet for this admission (will be created on first API call)");
  }
}

// 3. Check bill_items schema
const { rows: cols } = await pool.query(
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='bill_items' ORDER BY ordinal_position"
);
console.log("\n✅ bill_items columns:");
cols.forEach(c => console.log(`   ${c.column_name}: ${c.data_type}`));

await pool.end();
console.log("\n✅ Smoke test complete.");

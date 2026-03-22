import pg from "pg";
const pool = new pg.Pool({ connectionString: "postgres://postgres:1001@localhost:5432/LIFEVILLE_HMS_db" });

const checks = [
  "SELECT COUNT(*) AS cnt FROM services",
  "SELECT name, category, price FROM services ORDER BY category",
  "SELECT column_name FROM information_schema.columns WHERE table_name='bill_items' ORDER BY ordinal_position",
  "SELECT column_name FROM information_schema.columns WHERE table_name='patient_visits' ORDER BY ordinal_position",
  "SELECT column_name FROM information_schema.columns WHERE table_name='invoices' ORDER BY ordinal_position",
  "SELECT column_name FROM information_schema.columns WHERE table_name='billing_payments' ORDER BY ordinal_position",
];

for (const sql of checks) {
  const r = await pool.query(sql);
  console.log(`\n--- ${sql.slice(0,60)} ---`);
  r.rows.forEach(row => console.log(JSON.stringify(row)));
}
await pool.end();

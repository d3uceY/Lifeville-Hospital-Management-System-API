import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import config from "./src/constants/config.js";

const pool = new pg.Pool({
  connectionString: config.db.url,
  ssl: config.app.production,
  max: 5,              
  min: 1,
  idleTimeoutMillis: 10000, 
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected idle client error:", err);
});

export const db = drizzle(pool, { casing: "snake_case" });


export const query = (text, params) => pool.query(text, params);

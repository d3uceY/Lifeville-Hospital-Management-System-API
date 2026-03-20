# Database Migration Guide (Development)

Steps to set up and migrate the Lifeville HMS database on your local machine.

---

## Prerequisites

- [PostgreSQL](https://www.postgresql.org/download/) installed and running
- [Node.js](https://nodejs.org/) (v18+) installed
- Dependencies installed:
  ```bash
  npm install
  ```

---

## 1. Create the Database

Open a PostgreSQL shell (`psql`) and create the database:

```sql
CREATE DATABASE "LIFEVILLE_HMS_db";
```

---

## 2. Configure Environment Variables

Copy the example env file and fill in your local values:

```bash
cp .env.example .env
```

Edit `.env` and set your database credentials:

```env
PG_USER="postgres"
PG_HOST="localhost"
PG_DATABASE="LIFEVILLE_HMS_db"
PG_PASSWORD="your_password"
DATABASE_URL="postgres://postgres:your_password@localhost:5432/LIFEVILLE_HMS_db"
```

> The `DATABASE_URL` is what Drizzle uses to connect. Make sure it matches your local PostgreSQL setup.

---

## 3. Update drizzle.config.js (if needed)

`drizzle.config.js` currently has a hardcoded local URL. If your credentials differ, update it:

```js
dbCredentials: {
  url: 'postgres://YOUR_USER:YOUR_PASSWORD@localhost:5432/LIFEVILLE_HMS_db',
},
```

> **Note:** This file is used only by Drizzle Kit (migrations tooling), not by the app at runtime.

---

## 4. Run Migrations

Apply all pending migrations to the database:

```bash
npx drizzle-kit migrate
```

This runs the SQL files in `drizzle/migrations/` in order against your database.

---

## 5. Verify the Migration

Open `psql` and confirm the tables were created:

```bash
psql -U postgres -d LIFEVILLE_HMS_db
```

```sql
\dt
```

You should see all the application tables listed.

---

## 6. Seed the Super Admin

Start the server and hit the seed endpoint once to create the initial superadmin account (credentials are pulled from `.env`):

```bash
npm run dev
```

Then make a POST request to:

```
POST /api/users/seed-superadmin
```

---

## Generating New Migrations (after schema changes)

If you modify `drizzle/migrations/schema.js`, generate a new migration file with:

```bash
npx drizzle-kit generate
```

Then run step 4 again to apply it.

---

## Common Issues

| Problem | Fix |
|---|---|
| `ECONNREFUSED` on startup | PostgreSQL is not running — start the service |
| `database does not exist` | Run step 1 to create the database |
| `password authentication failed` | Check `DATABASE_URL` in `.env` matches your PostgreSQL user/password |
| `relation does not exist` | Migrations haven't been run — run step 4 |

# Veggie Ville

A community garden marketplace where local growers list surplus produce and buyers pick it up at scheduled slots.

Built with **Node.js + Express + MySQL2** (backend) and a **vanilla JS SPA** (frontend).

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 or later |
| npm | 9 or later |
| MySQL | 8.0 or later |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/tmno-O/Veggie_Ville.git
cd Veggie_Ville
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your MySQL credentials and a strong `JWT_SECRET`.
**Never commit `.env` to version control.**

### 3. Create the database and import the schema

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS community_garden;"
mysql -u root -p community_garden < schema.sql
```

### 4. Seed test accounts

```bash
node seed.js
```

This creates or resets the following test accounts:

| Role   | Email                      | Password     |
|--------|----------------------------|--------------|
| buyer  | test@test.com              | password123  |
| seller | seller@test.com            | password123  |
| admin  | audit-admin@example.com    | admin1234    |

---

## Running the app

```bash
# Production
npm start

# Development (auto-restarts on file change)
npm run dev
```

The app is available at `http://localhost:3000` (or the `PORT` set in `.env`).

---

## Running tests

```bash
npm test
```

All 23+ tests must pass before submitting a pull request.

---

## Project structure

```
├── app.js                  # Express app entry point
├── schema.sql              # MySQL schema
├── seed.js                 # Test account seeder
├── .env.example            # Environment variable template
├── config/
│   └── db.js               # MySQL connection pool
├── middlewares/
│   ├── auth.js             # JWT authentication
│   └── role.js             # Role-based access control
├── routes/                 # Express routers (paths + middleware only)
├── controllers/            # HTTP handlers (validation, status codes)
├── services/               # Business logic and DB queries
├── public/                 # Vanilla JS SPA
│   ├── router.js           # Client-side router and page binding
│   ├── components.js       # Page HTML templates
│   └── veggie-ui.js        # Auth helpers and cart state
└── __tests__/              # Jest test suites
```

---

## Security notes

- `.env` is gitignored — never commit it.
- Passwords are hashed with **bcrypt** (cost 12).
- Auth tokens are stored in **httpOnly** cookies only — not localStorage.
- All SQL values use parameterised queries (`?` placeholders).
- CORS is restricted to origins listed in `CORS_ORIGIN`.

---

## Database migration note

If you have an existing `community_garden` database from a previous version, the `schema.sql` now uses `ON DELETE RESTRICT` for the `orders.pickup_slot_id` foreign key (previously `CASCADE`). Re-running the schema on an existing database requires dropping and recreating the `orders` table, or running an `ALTER TABLE` migration:

```sql
ALTER TABLE orders
  DROP FOREIGN KEY <constraint_name>,
  ADD CONSTRAINT fk_orders_slot
    FOREIGN KEY (pickup_slot_id) REFERENCES pickup_slots(id) ON DELETE RESTRICT;
```

Replace `<constraint_name>` with the actual constraint name from `SHOW CREATE TABLE orders;`.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// ─── Test accounts ────────────────────────────────────────────────────────────
// All three accounts are seeded fresh every time this script runs.
// Use these credentials to test the app locally or share with teammates.
//
//  Role   | Email                    | Password
//  -------|--------------------------|----------------
//  buyer  | test@test.com            | password123
//  seller | seller@test.com          | password123
//  admin  | audit-admin@example.com  | admin1234
//
// Run with:  node seed.js
// ─────────────────────────────────────────────────────────────────────────────

const TEST_ACCOUNTS = [
  { name: 'Test Buyer',  email: 'test@test.com',           password: 'password123', role: 'buyer'  },
  { name: 'Test Seller', email: 'seller@test.com',         password: 'password123', role: 'seller' },
  { name: 'Audit Admin', email: 'audit-admin@example.com', password: 'admin1234',   role: 'admin'  },
];

async function seedUsers() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    });

    // 1. Initialize the database schema (safe — uses CREATE TABLE IF NOT EXISTS)
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await db.exec(schemaSql);

    console.log('\n🌱 Seeding test accounts...\n');

    for (const account of TEST_ACCOUNTS) {
      // Hash the password the same way the backend does (bcrypt, cost 10)
      const hashedPassword = await bcrypt.hash(account.password, 10);

      // Delete existing record first so the script is idempotent (safe to re-run)
      await db.run('DELETE FROM users WHERE email = ?', account.email);

      // Insert fresh record
      await db.run(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        account.name, account.email, hashedPassword, account.role
      );

      console.log(`✅  [${account.role.padEnd(6)}]  ${account.email.padEnd(30)}  password: ${account.password}`);
    }

    console.log('\n─────────────────────────────────────────────────────');
    console.log('All test accounts ready. Share this with your teammates:');
    console.log('─────────────────────────────────────────────────────');
    console.log(' Role   | Email                    | Password    ');
    console.log('--------|--------------------------|-------------');
    TEST_ACCOUNTS.forEach(a => {
      console.log(` ${a.role.padEnd(6)} | ${a.email.padEnd(24)} | ${a.password}`);
    });
    console.log('─────────────────────────────────────────────────────\n');

    await db.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed users:', err);
    process.exit(1);
  }
}

seedUsers();
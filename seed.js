require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function seedUser() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    });

    // 1. Initialize the database schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await db.exec(schemaSql);

    const email = 'test@test.com';
    const rawPassword = 'password123';
    
    // Mathematically hash the password exactly how your backend expects it
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 2. Forcefully delete the old broken record first
    await db.run('DELETE FROM users WHERE email = ?', email);

    // 3. Insert the fresh, correctly hashed user
    await db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      'Test Buyer', email, hashedPassword, 'buyer'
    );
    console.log(`\n✅ Success! You can now log in with:`);
    console.log(`Email:    ${email}`);
    console.log(`Password: ${rawPassword}\n`);
    
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed user:', err);
    process.exit(1);
  }
}

seedUser();
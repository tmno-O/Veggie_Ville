require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// ─── Test accounts ────────────────────────────────────────────────────────────
const TEST_ACCOUNTS = [
  { name: 'Test Buyer',  email: 'test@test.com',           password: 'password123', role: 'buyer'  },
  { name: 'Test Seller', email: 'seller@test.com',         password: 'password123', role: 'seller' },
  { name: 'Audit Admin', email: 'audit-admin@example.com', password: 'admin1234',   role: 'admin'  },
];

async function seedUsers() {
  let connection;
  try {
    // Create a dedicated connection for seeding to handle multiple statements if needed
    connection = await mysql.createConnection({
      host:               process.env.DB_HOST,
      port:               Number(process.env.DB_PORT) || 3306,
      user:               process.env.DB_USER,
      password:           process.env.DB_PASS,
      database:           process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('Connected to MySQL database.');

    // 1. Initialize the database schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolons and filter out empty strings to execute one by one
    // as some MySQL configs/drivers are picky even with multipleStatements:true
    console.log('Initializing schema...');
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const sql of statements) {
      await connection.query(sql);
    }

    console.log('\n🌱 Seeding test accounts...\n');

    for (const account of TEST_ACCOUNTS) {
      const hashedPassword = await bcrypt.hash(account.password, 12);

      // Delete existing record
      await connection.query('DELETE FROM users WHERE email = ?', [account.email]);

      // Insert fresh record
      await connection.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [account.name, account.email, hashedPassword, account.role]
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

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed users:', err);
    if (connection) await connection.end();
    process.exit(1);
  }
}

seedUsers();

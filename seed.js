require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedUser() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'community_garden'
    });

    const email = 'test@test.com';
    const rawPassword = 'password123';
    
    // Mathematically hash the password exactly how your backend expects it
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

// 1. Forcefully delete the old broken record first
    await db.execute('DELETE FROM users WHERE email = ?', [email]);

    // 2. Insert the fresh, correctly hashed user
    await db.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Test Buyer', email, hashedPassword, 'buyer']
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
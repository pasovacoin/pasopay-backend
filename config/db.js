const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Drop and recreate tables
(async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS wallets;');
    console.log('✅ Old wallets table dropped.');
    await pool.query('DROP TABLE IF EXISTS users;');
    console.log('✅ Old users table dropped.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ New users table created!');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        balance DECIMAL(20,6) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ New wallets table created!');

  } catch (err) {
    console.error('❌ Error setting up tables:', err);
  }
})();

module.exports = pool;

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Drop old users table + Create new one
pool.query('DROP TABLE IF EXISTS users;')
  .then(() => {
    console.log('✅ Old users table dropped.');
    return pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  })
  .then(() => {
    console.log('✅ New users table created!');
  })
  .catch((err) => {
    console.error('❌ Error creating users table:', err);
  });

module.exports = pool;

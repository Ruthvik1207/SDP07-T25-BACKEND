require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'Kl-2401971',
    database: process.env.DB_NAME || 'voting_system'
  });

  try {
    console.log('Connected to MySQL for migration.');

    // Add voted_for column to users table
    await connection.execute('ALTER TABLE users ADD COLUMN voted_for INT DEFAULT NULL');
    console.log('Added voted_for column to users table.');

    console.log('Migration completed successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Column voted_for already exists.');
    } else {
      console.error('Migration failed:', err.message);
    }
  } finally {
    await connection.end();
  }
}

migrate();

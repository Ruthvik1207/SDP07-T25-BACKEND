require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'Kl-2401971',
    database: process.env.DB_NAME || 'voting_system'
  });

  try {
    console.log('Connected to MySQL for seeding.');

    // Remove existing candidates
    await connection.execute('DELETE FROM candidates');
    console.log('Cleared existing candidates.');

    // Insert new parties
    const parties = [
      { name: 'TDP Party', party: 'Telugu Desam Party' },
      { name: 'JSP Party', party: 'Jana Sena Party' },
      { name: 'YSRCP Party', party: 'Yuvajana Sramika Rythu Congress Party' }
    ];

    for (const p of parties) {
      await connection.execute(
        'INSERT INTO candidates (name, party, votes) VALUES (?, ?, 0)',
        [p.name, p.party]
      );
      console.log(`Added: ${p.name}`);
    }

    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await connection.end();
  }
}

seed();

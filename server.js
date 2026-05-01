require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const authRoutes = require('./routes/auth');
const votingRoutes = require('./routes/voting');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Database Connection
let db;
async function getDB() {
  if (db) return db;
  try {
    db = await mysql.createPool({
      host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
      port: process.env.DB_PORT || 4000,
      user: process.env.DB_USER || 'CjxsbC6z9Pt16yE.root',
      password: process.env.DB_PASS || 'fihsz0A7yzEJw0qk',
      database: process.env.DB_NAME || 'test',
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('Connected to MySQL Database');

    // Create Tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        aadhaar VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        voter_id VARCHAR(50) UNIQUE NOT NULL,
        role ENUM('USER', 'ADMIN') DEFAULT 'USER',
        has_voted BOOLEAN DEFAULT FALSE,
        voted_for INT DEFAULT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS candidates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        party VARCHAR(255) NOT NULL,
        votes INT DEFAULT 0
      )
    `);
    
    return db;
  } catch (err) {
    console.error('Database connection failed:', err.message);
    throw err;
  }
}

// DB Proxy for lazy initialization
const dbProxy = {
  execute: async (...args) => {
    const database = await getDB();
    return database.execute(...args);
  },
  query: async (...args) => {
    const database = await getDB();
    return database.query(...args);
  },
  getConnection: async () => {
    const database = await getDB();
    return database.getConnection();
  }
};

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'UP' }));
app.get('/', (req, res) => res.json({ message: 'Voting System API is running' }));

// Route Registration
app.use('/api/auth', authRoutes(dbProxy));
app.use('/api', votingRoutes(dbProxy));
app.use('/api/admin', adminRoutes(dbProxy));

module.exports = app;

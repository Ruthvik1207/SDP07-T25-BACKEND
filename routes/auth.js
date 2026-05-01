const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');

const authRoutes = (db) => {
  router.post('/register', async (req, res) => {
    try {
      const { name, aadhaar, password, role } = req.body;
      if (!name || !aadhaar || !password) return res.status(400).json({ message: 'Missing fields' });

      const [existing] = await db.execute('SELECT * FROM users WHERE aadhaar = ?', [aadhaar]);
      if (existing.length > 0) return res.status(400).json({ message: 'Aadhaar already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const voterId = 'V' + Math.random().toString(36).substr(2, 7).toUpperCase();

      await db.execute(
        'INSERT INTO users (name, aadhaar, password, voter_id, role, has_voted) VALUES (?, ?, ?, ?, ?, ?)',
        [name, aadhaar, hashedPassword, voterId, role || 'USER', false]
      );

      res.status(201).json({ voterId, message: 'Registration successful' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { aadhaarOrVoterId, password } = req.body;
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE aadhaar = ? OR voter_id = ?',
        [aadhaarOrVoterId, aadhaarOrVoterId]
      );

      if (rows.length === 0) return res.status(400).json({ message: 'User not found' });
      const user = rows[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        { id: user.id, voterId: user.voter_id, role: user.role },
        process.env.JWT_SECRET || 'secret_key'
      );

      res.json({ token, voterId: user.voter_id, role: user.role });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get user profile
  router.get('/profile', auth, async (req, res) => {
    try {
      const [rows] = await db.execute(
        'SELECT id, name, aadhaar, voter_id, role, has_voted, voted_for FROM users WHERE id = ?',
        [req.user.id]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};

module.exports = authRoutes;

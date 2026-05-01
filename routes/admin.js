const router = require('express').Router();
const { adminAuth } = require('../middleware/auth');

const adminRoutes = (db) => {
  // Add candidate
  router.post('/add-candidate', adminAuth, async (req, res) => {
    try {
      const { name, party } = req.body;
      await db.execute('INSERT INTO candidates (name, party, votes) VALUES (?, ?, 0)', [name, party]);
      res.status(201).json({ message: 'Candidate added' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete candidate
  router.delete('/delete-candidate/:id', adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.execute('DELETE FROM candidates WHERE id = ?', [id]);
      res.status(200).json({ message: 'Candidate deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fetch results
  router.get('/results', adminAuth, async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM candidates ORDER BY votes DESC');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};

module.exports = adminRoutes;

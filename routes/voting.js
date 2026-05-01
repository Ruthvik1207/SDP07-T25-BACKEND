const router = require('express').Router();
const { auth } = require('../middleware/auth');

const votingRoutes = (db) => {
  // Fetch all candidates
  router.get('/candidates', auth, async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM candidates');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Cast vote
  router.post('/vote', auth, async (req, res) => {
    const conn = await db.getConnection();
    try {
      const { candidateId } = req.body;
      const voterId = req.user.voterId;

      await conn.beginTransaction();

      // 1. Check if user already voted (inside transaction for safety)
      const [userRows] = await conn.execute('SELECT has_voted FROM users WHERE voter_id = ? FOR UPDATE', [voterId]);
      if (userRows[0].has_voted == 1 || userRows[0].has_voted === true) {
        await conn.rollback();
        return res.status(400).json({ message: 'You have already voted' });
      }

      // 2. Mark user as voted and save their choice
      console.log(`Attempting to update user status. VoterID: "${voterId}", CandidateID: ${candidateId}`);
      const [userUpdate] = await conn.execute('UPDATE users SET has_voted = 1, voted_for = ? WHERE voter_id = ?', [candidateId, voterId]);
      
      if (userUpdate.affectedRows === 0) {
        console.error(`ERROR: No user found with VoterID: "${voterId}"`);
        await conn.rollback();
        return res.status(404).json({ message: 'User record not found. Voting failed.' });
      }
      
      console.log(`DB Update Success: User updated. Affected rows: ${userUpdate.affectedRows}`);

      // 3. Increment candidate vote count
      const [candUpdate] = await conn.execute('UPDATE candidates SET votes = votes + 1 WHERE id = ?', [candidateId]);
      console.log(`DB Update: Candidate ${candidateId} votes incremented. Affected rows: ${candUpdate.affectedRows}`);

      await conn.commit();
      res.status(200).json({ message: 'Vote cast successfully' });
    } catch (err) {
      await conn.rollback();
      console.error('Voting Transaction Error:', err.message);
      res.status(500).json({ error: 'Database error during voting.' });
    } finally {
      conn.release();
    }
  });

  return router;
};

module.exports = votingRoutes;

const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', (req, res) => {
  const userId = req.user?.id;
  res.json(db.prepare('SELECT * FROM watchlist WHERE (user_id = ? OR user_id IS NULL) ORDER BY added_at DESC').all(userId));
});

router.post('/', (req, res) => {
  const { pair } = req.body;
  if (!pair) return res.status(400).json({ error: 'pair required' });
  try {
    const userId = req.user?.id || null;
    const r = db.prepare('INSERT OR IGNORE INTO watchlist (pair, user_id) VALUES (?, ?)').run(pair, userId);
    res.json({ id: r.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  const userId = req.user?.id;
  db.prepare('DELETE FROM watchlist WHERE id = ? AND (user_id = ? OR user_id IS NULL)').run(req.params.id, userId);
  res.json({ ok: true });
});

module.exports = router;

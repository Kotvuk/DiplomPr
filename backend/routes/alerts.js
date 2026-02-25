const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', (req, res) => {
  const userId = req.user?.id;
  const { status } = req.query;
  if (status) {
    res.json(db.prepare('SELECT * FROM alerts WHERE status = ? AND (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC').all(status, userId));
  } else {
    res.json(db.prepare('SELECT * FROM alerts WHERE (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC').all(userId));
  }
});

router.post('/', (req, res) => {
  const { pair, condition, value, message } = req.body;
  if (!pair || !condition || !value) return res.status(400).json({ error: 'Missing fields' });
  const userId = req.user?.id || null;
  const r = db.prepare('INSERT INTO alerts (pair, condition, value, message, user_id) VALUES (?,?,?,?,?)').run(pair, condition, +value, message || '', userId);
  res.json({ id: r.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  const userId = req.user?.id;
  db.prepare('DELETE FROM alerts WHERE id = ? AND (user_id = ? OR user_id IS NULL)').run(req.params.id, userId);
  res.json({ ok: true });
});

router.get('/triggered', (req, res) => {
  const userId = req.user?.id;
  const { since } = req.query;
  let results;
  if (since) {
    results = db.prepare('SELECT * FROM alerts WHERE status = ? AND triggered_at > ? AND (user_id = ? OR user_id IS NULL) ORDER BY triggered_at DESC').all('triggered', since, userId);
  } else {
    results = db.prepare('SELECT * FROM alerts WHERE status = ? AND (user_id = ? OR user_id IS NULL) ORDER BY triggered_at DESC LIMIT 10').all('triggered', userId);
  }
  res.json(results);
});

module.exports = router;

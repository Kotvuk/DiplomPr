const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { hashPassword, comparePassword, needsRehash, generateTokens, verifyRefreshToken } = require('../utils/crypto');

// Rate limiting for login
const loginAttempts = new Map();
function checkLoginRateLimit(ip) {
  const now = Date.now();
  const key = ip;
  const attempts = loginAttempts.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (now > attempts.resetAt) {
    attempts.count = 0;
    attempts.resetAt = now + 15 * 60 * 1000;
  }
  attempts.count++;
  loginAttempts.set(key, attempts);
  return attempts.count > 5;
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });
    if (password.length < 6) return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
    const normalizedEmail = email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    const hash = await hashPassword(password);
    const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name || '', normalizedEmail, hash);
    const { accessToken, refreshToken } = generateTokens({ id: result.lastInsertRowid });
    res.json({ accessToken, refreshToken, user: { id: result.lastInsertRowid, name, email: normalizedEmail, plan: 'Free', is_admin: 0 } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });

    // Rate limiting
    const ip = req.ip || req.connection.remoteAddress;
    if (checkLoginRateLimit(ip)) {
      return res.status(429).json({ error: 'Слишком много попыток входа. Попробуйте через 15 минут.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
    if (!user || !await comparePassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Auto-migrate SHA-256 hash to bcrypt
    if (needsRehash(user.password_hash)) {
      const newHash = await hashPassword(password);
      db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(newHash, user.id);
    }

    const { accessToken, refreshToken } = generateTokens({ id: user.id });
    res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, is_admin: user.is_admin } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    const user = db.prepare('SELECT id, name, email, plan, is_admin FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const tokens = generateTokens({ id: user.id });
    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Не авторизован' });
  res.json(req.user);
});

// Require auth middleware for PATCH /me
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.patch('/me', requireAuth, (req, res) => {
  const { name, email } = req.body;
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    if (email) {
      const existing = db.prepare('SELECT id FROM users WHERE email=? AND id!=?').get(email.toLowerCase().trim(), req.user.id);
      if (existing) return res.status(409).json({ error: 'Email already taken' });
    }
    db.prepare('UPDATE users SET name=COALESCE(?,name), email=COALESCE(?,email) WHERE id=?')
      .run(name || null, email ? email.toLowerCase().trim() : null, req.user.id);
    const updated = db.prepare('SELECT id, email, name, plan, is_admin FROM users WHERE id=?').get(req.user.id);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;

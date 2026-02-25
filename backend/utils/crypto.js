const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kotvukai-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'kotvukai-refresh-secret-change-in-production';
const BCRYPT_ROUNDS = 12;

// Хеширование нового пароля через bcrypt
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Проверка пароля с поддержкой legacy SHA-256 хешей (migration path)
async function comparePassword(password, hash) {
  // Если хеш начинается с $2b$ или $2a$ — это bcrypt
  if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
    return bcrypt.compare(password, hash);
  }
  // Иначе — legacy SHA-256 (для старых аккаунтов)
  const sha256 = crypto.createHash('sha256').update(password).digest('hex');
  return hash === sha256;
}

// Проверяет, нужна ли миграция хеша (SHA-256 → bcrypt)
function needsRehash(hash) {
  return !hash.startsWith('$2b$') && !hash.startsWith('$2a$');
}

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token) {
  const payload = jwt.verify(token, JWT_REFRESH_SECRET);
  if (payload.type !== 'refresh') throw new Error('Invalid token type');
  return payload;
}

module.exports = { hashPassword, comparePassword, needsRehash, generateTokens, verifyAccessToken, verifyRefreshToken };

const db = require('../config/database');
const { verifyAccessToken } = require('../utils/crypto');

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(auth.slice(7));
      if (payload) {
        req.userId = payload.id;
        req.user = db.prepare('SELECT id, name, email, plan, is_admin FROM users WHERE id = ?').get(payload.id);
      }
    } catch (e) {
      // Token invalid or expired — continue without auth
    }
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

module.exports = { authMiddleware, requireAdmin, requireAuth };

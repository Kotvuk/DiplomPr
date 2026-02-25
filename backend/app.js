require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database (runs table creation, migrations, seed data)
require('./config/database');

const { authMiddleware, requireAdmin } = require('./middleware/auth');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);
app.use(authMiddleware);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Prometheus metrics (admin only)
app.get('/metrics', requireAdmin, metricsEndpoint);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/market'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/whale', require('./routes/whale'));
app.use('/api/news', require('./routes/news'));
app.use('/api/signals', require('./routes/signals'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/download-project', require('./routes/download'));
app.use('/api/onchain', require('./routes/onchain'));
app.use('/api/export', require('./routes/export'));

// Serve static (production)
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built. Run: cd frontend && npx vite build');
  }
});

module.exports = app;

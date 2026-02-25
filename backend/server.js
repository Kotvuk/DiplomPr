const http = require('http');
const app = require('./app');
const { setupWebSocket } = require('./services/websocket');
const { checkAlerts } = require('./services/alertChecker');
const { checkTradeTPSL } = require('./services/tradeChecker');
const { checkPendingSignals } = require('./services/signalChecker');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Setup WebSocket server
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`KotvukAI backend running on port ${PORT}`);
  console.log(`WebSocket server ready on ws://localhost:${PORT}`);
  // Start periodic checks after server is ready
  setInterval(() => { checkAlerts().catch(e => console.error('Alert check error:', e.message)); }, 30000);
  setInterval(() => { checkTradeTPSL().catch(e => console.error('Trade check error:', e.message)); }, 30000);
  setInterval(() => { checkPendingSignals().catch(e => console.error('Signal check error:', e.message)); }, 60000);
});

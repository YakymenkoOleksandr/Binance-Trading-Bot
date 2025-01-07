const { connectWebSocket } = require('./services/websocket');
const { executeStrategy } = require('./strategies/arbitrage');

const start = async () => {
  console.log('Bot is starting...');
  connectWebSocket();
};

module.exports = { start };
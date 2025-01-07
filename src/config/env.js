require('dotenv').config();

module.exports = {
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
  symbols: process.env.BINANCE_SYMBOLS.split(','),
};
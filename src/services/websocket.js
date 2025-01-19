// src/services/websocket.js
import { WebSocket } from 'ws';
import { calculateArbitrageProfit } from '../strategies/arbitrage.js';

let prices = {};

// Торгові пари
const symbols = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "ETHBTC",
  "BNBETH",
  "BNBBTC",
  "XRPUSDT",
  "XRPBNB",
  "XRPETH",
  "XRPBTC",
  "DOTUSDT",
  "DOTBTC",
  "DOTETH",
  "DOTBNB",
  "SOLUSDT",
  "SOLBTC",
  "SOLETH",
  "SOLBNB",
  "ADAUSDT",
  "ADABTC",
  "ADAETH",
  "ADABNB",
  "TRXUSDT",
  "TRXBTC",
  "TRXETH",
  "TRXBNB",
  "AVAXUSDT",
  "AVAXBTC",
  "AVAXETH",
  "AVAXBNB",
  "SUIUSDT",
  "SUIBTC",
  "SUIBNB",
  "LINKUSDT",
  "LINKBTC",
  "LINKETH",
  "LINKBNB",
  "TONUSDT",
  "TONBTC",
  "SHIBUSDT",
  "DOGEUSDT",
  "SHIBDOGE",
  "DOGEBTC",
  "XLMUSDT",
  "XLMBTC",
  "XLMETH",
  "WBTCUSDT",
  "WBTCBTC",
  "WBTCETH",
  "HBARUSDT",
  "HBARBTC",
  "HBARBNB",
  "BCHUSDT",
  "BCHBTC",
  "BCHBNB",
  "UNIUSDT",
  "UNIBTC",
  "UNIETH",
  "LTCUSDT",
  "LTCBTC",
  "LTCETH",
  "LTCBNB",
  "NEARUSDT",
  "NEARBTC",
  "NEARETH",
  "ICPUSDT",
  "ICPBTC",
  "ICPETH",
  "APTUSDT",
  "APTBTC",
  "APTETH",
  "USDTDAI",
  "BTCDAI",
  "ETHDAI",
  "AAVEUSDT",
  "AAVEBTC",
  "AAVEETH",
  "POLUSDT",
  "POLBTC",
  "POLETH",
  "POLBNB",
  "ETCUSDT",
  "ETCBTC",
  "ETCETH",
  "ETCBNB",
  "RENDERUSDT",
  "RENDERBTC",
  "VETUSDT",
  "VETBTC",
  "VETETH",
  "VETBNB",
  "ENAUSDT",
  "ENABTC",
  "ENAETH",
  "ENABNB",
  "OMUSDT",
  "OMBTC",
  "FILUSDT",
  "FILBTC",
  "FILETH",
  "ALGOUSDT",
  "ALGOBTC",
  "ATOMUSDT",
  "ATOMBTC",
  "OPUSDT",
  "OPBTC",
  "OPETH",
  "PENGUUSDT",
  "PENGUBNB",
  "STXUSDT",
  "STXBTC",
  "STXBNB",
  "TIABTC",
  "TIAUSDT",
  "INJUSDT",
  "INJBTC",
  "INJETH",
  "INJBNB",
  "THETAUSDT",
  "THETABTC",
  "IMXUSDT",
  "IMXBTC",
  "MOVEUSDT",
  "MOVEBTC",
  "MOVEBNB",
  "GRTUSDT",
  "GRTBTC",
  "GRTETH",
  "WLDUSDT",
  "WLDBTC",
  "FTMUSDT",
  "FTMBTC",
  "FTMETH",
  "FTMBNB",
  "WIFUSDT",
  "WIFBTC",
  "SEIUSDT",
  "SEIBTC",
  "SEIBNB",
  "LDOUSDT",
  "LDOBTC",
  "SANDUSDT",
  "SANDBTC",
];


// Функція для підключення до Binance WebSocket
export const connectWebSocket = (onMessage) => {
  const streams = symbols
    .map((symbol) => `${symbol.toLowerCase()}@bookTicker`)
    .join('/');

  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`); // wss://testnet.binance.vision/ws wss://stream.binance.com:9443/ws

  ws.on('open', () => {
    console.log('WebSocket підключено');
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.s && data.b && data.a) {
      prices[data.s] = {
          bid: parseFloat(data.b), // Bid ціна
          ask: parseFloat(data.a)  // Ask ціна
        };
        onMessage(prices); // Передаємо оновлені ціни в обробник
      } else {
        console.error('Невірні дані від WebSocket:', data);
      }
    } catch (error) {
      console.error('Помилка обробки отриманих даних WebSocket:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket помилка:', error);
  });

  ws.on('close', () => {
    console.log('WebSocket закрито');
  });

  return ws;
};

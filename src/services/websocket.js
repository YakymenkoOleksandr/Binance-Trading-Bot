const WebSocket = require('ws'); // Бібліотека WebSocket (вбудована для Node.js)

let prices = {}; // Об'єкт для збереження цін
console.log(prices);

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

/**
 * Функція для підключення до Binance WebSocket
 * @returns {WebSocket} - Підключення WebSocket
 */

const connectWebSocket = (onMessage) => {
  const streams = symbols
    .map((symbol) => `${symbol.toLowerCase()}@ticker`)
    .join('/');

  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

  ws.on('open', () => {
    console.log('WebSocket підключено');
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Перевіряємо, чи дані коректні
      if (data.s && data.c) {
        // Оновлюємо локальний об'єкт з цінами
          prices[data.s] = parseFloat(data.c);
        //  console.log("Оновлені ціни:", prices); // Показує, що об"єкт тимчасового зберігання цін оновлюється
        onMessage(prices);
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

module.exports = { connectWebSocket };
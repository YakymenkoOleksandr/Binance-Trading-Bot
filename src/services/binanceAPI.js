import axios from 'axios';
import crypto from 'crypto';
import { env } from '../utils/env.js'
import { log, logError } from './logger.js'
import { getStepSize, roundToStepSize } from '../utils/quantity.js'


const apiKey = env('BINANCE_API_KEY');
const apiSecret = env('BINANCE_API_SECRET');
const baseUrl = 'https://testnet.binance.vision'; // 'https://testnet.binance.vision' https://api.binance.com // Також потрібно змінити отримання ціни та /test

let timeOffset = 0; // Глобальна змінна для збереження різниці часу

const sign = (params, secret) => {
  const queryString = new URLSearchParams(params).toString();
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
};

export const getBalances = async () => {
  const endpoint = '/api/v3/account';
  const params = { timestamp: Date.now() + timeOffset};
  const signature = sign(params, apiSecret);

  const response = await axios.get(`${baseUrl}${endpoint}`, {
    headers: { 'X-MBX-APIKEY': apiKey },
    params: { ...params, signature },
  });

  return response.data.balances;
};

export const createOrder = async (symbol, side, quantity) => {
  if (!symbol || !side || !quantity) {
    throw new Error(
      `Необхідні параметри для createOrder відсутні: symbol=${symbol}, side=${side}, quantity=${quantity}`
    );
  }

  try {
    const params = {
      symbol,
      side,
      type: 'MARKET',
      quantity,
      timestamp: Date.now() + timeOffset,
    };

    const signature = sign(params, apiSecret);
    
    const response = await axios.post(`${baseUrl}/api/v3/order/test`, null, { // /test
      headers: { 'X-MBX-APIKEY': apiKey },
      params: { ...params, signature },
    });

    log(`Створення ордеру: ${JSON.stringify(params)}`); // В тестовому режимі отрдер умовно створюється і данні виводяться в консоль
    log(`Отримана відповідь: ${JSON.stringify(response.data)}`); // В тестовому режимі відповідь не надється бо реально ордер не виконується
    return response.data;
  } catch (error) {
      // Перевіряємо, чи є відповідь з детальною інформацією
    if (error.response) {
      logError(`Помилка API: ${JSON.stringify(error.response.data)}`); // Виводимо деталі помилки з відповіді API
    } else if (error.request) {
      logError(`Запит не отримав відповіді: ${JSON.stringify(error.request)}`);
    } else {
      logError(`Помилка налаштування запиту: ${error.message}`);
    }
    throw error; // Пробрасываем ошибку дальше
  }
};

export const syncServerTime = async () => {
  try {
    const response = await axios.get(`${baseUrl}/api/v3/time`);
    const serverTime = response.data.serverTime; // Час сервера Binance
    const localTime = Date.now(); // Локальний час
    timeOffset = serverTime - localTime; // Обчислюємо різницю
    log(`Синхронізація часу завершена. Різниця: ${timeOffset} мс`);
  } catch (error) {
    logError(`Помилка синхронізації часу: ${error.message}`);
    throw error; // Якщо синхронізація не вдалася, пробрасываем ошибку
  }
};

export const getPrice = async (symbol) => {
  try {
    const response = await axios.get(`${baseUrl}/api/v3/ticker/price`, {
      params: { symbol }, // Торгова пара, наприклад "BTCUSDT"
    });
    console.log(`Ціна ${symbol}:`, response.data.price);
    return response.data.price;
  } catch (error) {
    console.error('Помилка отримання ціни:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export async function getBidAskPrices(pair) {
  const url = `${baseUrl}/api/v3/ticker/bookTicker`;

  try {
    // Відправляємо запит до API Binance
    const response = await axios.get(url, {
      params: {
        symbol: pair,
      },
    });

    // Парсимо результат
    const { bidPrice, askPrice } = response.data;

    // Повертаємо об'єкт із bid і ask цінами
    return {
      bid: parseFloat(bidPrice),
      ask: parseFloat(askPrice),
    };
  } catch (error) {
    console.error(`Помилка отримання даних для пари ${pair}:`, error.message);
    throw error; // Пробросимо помилку для обробки вище
  }
}

export async function getBidAskVolumes(pair) {
  const url = `${baseUrl}/api/v3/depth`;

  try {
    const response = await axios.get(url, {
      params: { symbol: pair, limit: 5 }, // Ліміт 5 для отримання топових заявок
    });

    const { bids, asks } = response.data;

    // Об'єм на найкращій ціні bid (перший елемент масиву bids)
    const bidVolume = parseFloat(bids[0][1]); // [0] - ціна, [1] - об'єм

    // Об'єм на найкращій ціні ask (перший елемент масиву asks)
    const askVolume = parseFloat(asks[0][1]); // [0] - ціна, [1] - об'єм

    return { bidVolume, askVolume };
  } catch (error) {
    console.error(`Помилка отримання об'ємів по bid/ask для пари ${pair}:`, error.message);
    throw error; // Прокидаємо помилку для обробки вище
  }
}

// Отримання відкритих ордерів
export const getOpenOrders = async (symbol) => {
  try {
    const params = {
      symbol,
      timestamp: Date.now() + timeOffset, // Додаємо timeOffset
    };

    const queryString = new URLSearchParams(params).toString();
    const signature = sign(params, apiSecret);
    const signedQuery = `${queryString}&signature=${signature}`;

    const response = await axios.get(`${baseUrl}/api/v3/openOrders?${signedQuery}`, {
      headers: { 'X-MBX-APIKEY': apiKey },
    });

    return response.data;
  } catch (error) {
    console.error('Помилка при отриманні відкритих ордерів:', error.response?.data || error.message);
    throw error;
  }
};

// Отримання всіх ордерів (виконаних, скасованих, відкритих)
export const getAllOrders = async (symbol) => {
  try {
    const params = {
      symbol,
      timestamp: Date.now() + timeOffset, // Додаємо timeOffset
    };

    const queryString = new URLSearchParams(params).toString();
    const signature = sign(params, apiSecret);
    const signedQuery = `${queryString}&signature=${signature}`;

    const response = await axios.get(`${baseUrl}/api/v3/allOrders?${signedQuery}`, {
      headers: { 'X-MBX-APIKEY': apiKey },
    });

    return response.data;
  } catch (error) {
    console.error('Помилка при отриманні всіх ордерів:', error.response?.data || error.message);
    throw error;
  }
};


export const createDOTUSDTLimitOrder = async (symbol, side, price, quantity) => {
  if (!symbol || !side || !price || !quantity) {
    throw new Error(
      `Необхідні параметри для createLimitOrder відсутні: symbol=${symbol}, side=${side}, price=${price}, quantity=${quantity}`
    );
  }

  try {
    const params = {
      symbol,
      side,
      type: 'LIMIT', // Тип ордера - лімітний
      price: price.toFixed(3), // Ціна (точність до 8 знаків після коми)
      quantity: quantity.toFixed(2), // Кількість (точність до 8 знаків після коми)
      timeInForce: 'GTC', // Ордер діє до виконання або скасування
      timestamp: Date.now() + timeOffset,
    };

    const signature = sign(params, apiSecret);

    const response = await axios.post(`${baseUrl}/api/v3/order`, null, {
      headers: { 'X-MBX-APIKEY': apiKey },
      params: { ...params, signature },
    });

    log(`Лімітний ордер створено: ${JSON.stringify(params)}`);
    log(`Отримана відповідь: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      logError(`Помилка API: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      logError(`Запит не отримав відповіді: ${JSON.stringify(error.request)}`);
    } else {
      logError(`Помилка налаштування запиту: ${error.message}`);
    }
    throw error;
  }
};
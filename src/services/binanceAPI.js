import axios from 'axios';
import crypto from 'crypto';
import { env } from '../utils/env.js'
import { log, logError } from './logger.js'
import { getStepSize, roundToStepSize } from '../utils/quantity.js'


const apiKey = env('BINANCE_API_KEY');
const apiSecret = env('BINANCE_API_SECRET');

const baseUrl = 'https://testnet.binance.vision';

const sign = (params, secret) => {
  const queryString = new URLSearchParams(params).toString();
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
};

export const getBalances = async () => {
  const endpoint = '/api/v3/account';
  const params = { timestamp: Date.now() };
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
    // Отримуємо stepSize
    const stepSize = await getStepSize(symbol);

    // Округлюємо кількість
    const roundedQuantity = roundToStepSize(quantity, stepSize);

    const params = {
      symbol,
      side,
      type: 'MARKET',
      quantity: roundedQuantity,
      timestamp: Date.now(),
    };

    const signature = sign(params, apiSecret);

    const response = await axios.post(`${baseUrl}/api/v3/order/test`, null, {
      headers: { 'X-MBX-APIKEY': apiKey },
      params: { ...params, signature },
    });

    log(`Створення ордеру: ${JSON.stringify(params)}`); // В тестовому режимі отрдер умовно створюється і данні виводяться в консоль
    log(`Отримана відповідь: ${JSON.stringify(response.data)}`); // В тестовому режимі відповідь не надється бо реально ордер не виконується
    return response.data;
  } catch (error) {
    logError(`Помилка під час створення ордеру: ${error.message}`);
    throw error;
  }
};
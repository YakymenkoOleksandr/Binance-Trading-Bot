import axios from 'axios';
import { log, logError } from '../services/logger.js';
import { env } from './env.js';

const baseUrl = 'https://testnet.binance.vision';
const apiKey = env('BINANCE_API_KEY');


export const getStepSize = async (symbol) => {
  try {
    const response = await axios.get(`${baseUrl}/api/v3/exchangeInfo`, {
      headers: { 'X-MBX-APIKEY': apiKey },
    });

    const symbolInfo = response.data.symbols.find((s) => s.symbol === symbol);

    if (!symbolInfo) {
      throw new Error(`Символ ${symbol} не знайдено у відповіді Binance.`);
    }

    const lotSizeFilter = symbolInfo.filters.find(
      (f) => f.filterType === 'LOT_SIZE'
    );

    if (!lotSizeFilter) {
      throw new Error(
        `Фільтр LOT_SIZE не знайдено для символу ${symbol}.`
      );
    }

    return parseFloat(lotSizeFilter.stepSize);
  } catch (error) {
    logError(`Помилка під час отримання stepSize: ${error.message}`);
    throw error;
  }
};

export const roundToStepSize = (quantity, stepSize) => {
  const precision = Math.log10(1 / stepSize); // Кількість знаків після коми
  return parseFloat(quantity.toFixed(precision));
};
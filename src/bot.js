import { connectWebSocket } from './services/websocket.js';
import { calculateArbitrageProfit } from './strategies/arbitrage.js';
import { createOrder } from './services/binanceAPI.js';
import { log, logError } from './services/logger.js';

const prices = {}; // Кеш для цін
let isExecutingArbitrage = false; // Прапорець виконання

const calculateAmount = (capital, price) => {
  if (!capital || !price || price <= 0) {
    throw new Error(`Неможливо обчислити кількість монет: capital=${capital}, price=${price}`);
  }
  return capital / price;
};

// Виконання трикутного арбітражу
const executeArbitrage = async (pair, prices, workingСapital) => {
  if (isExecutingArbitrage) {
    log('Арбітраж вже виконується, очікування завершення...');
    return; // Чекаємо, поки поточний цикл завершиться
  }

  isExecutingArbitrage = true; // Встановлюємо прапорець
  try {
    log(`Старт арбітражу для пари ${pair.pairName}`);

    // Обчислення кількості монет для першої валюти
    const firstAmount = calculateAmount(workingСapital, prices[pair.first.symbol]);
    log(`Обчислено firstAmount: ${firstAmount}`);

    // Купівля першої валюти
    log(`Створюється ордер для ${pair.first.symbol} з кількістю ${firstAmount}`);
    const firstOrder = await createOrder(pair.first.symbol, 'BUY', firstAmount);
    log(`Куплено ${firstOrder.amount || firstAmount} ${pair.first.symbol}`);

    // Обчислення кількості монет для другої валюти
    const secondAmount = calculateAmount(firstAmount, 1 / prices[pair.second.symbol]);
    log(`Обчислено secondAmount: ${secondAmount}`);

    // Купівля другої валюти
    log(`Створюється ордер для ${pair.second.symbol} з кількістю ${secondAmount}`);
    const secondOrder = await createOrder(pair.second.symbol, 'BUY', secondAmount);
    log(`Куплено ${secondOrder.amount || secondAmount} ${pair.second.symbol}`);

    // Продаж другої валюти за базову
    log(`Створюється ордер для ${pair.base.symbol}`);
    const finalOrder = await createOrder(pair.base.symbol, 'SELL', secondAmount);
    log(`Продано ${finalOrder.amount || secondAmount} ${pair.base.symbol}`);

    // Розрахунок прибутку
    const totalProfit = finalOrder.amount - workingСapital;
    log(`Прибуток: ${totalProfit.toFixed(2)} USDT`);

    if (totalProfit < 0) {
      logError('Операція завершена зі збитком!');
    }
  } catch (error) {
    logError(`Помилка під час арбітражу: ${error.message}`);
  } finally {
    isExecutingArbitrage = false; // Знімаємо прапорець після завершення
  }
};

// Обробник оновлених цін
const handlePricesUpdate = (updatedPrices) => {
  Object.assign(prices, updatedPrices); // Оновлюємо кеш цін

  // Знаходимо вигідні пари
  const profitablePairs = calculateArbitrageProfit(prices);

  if (profitablePairs.length > 0) {
    const mostProfitablePair = profitablePairs[0]; // Беремо найвигіднішу пару
    const workingСapital = 15; // Початковий капітал для арбітражу
    executeArbitrage(mostProfitablePair, prices, workingСapital);
  } else {
    log('Немає вигідних пар для арбітражу.');
  }
};

// Запуск WebSocket
const ws = connectWebSocket(handlePricesUpdate);

export const bot = {
  start: () => {
    console.log('Запуск бота...');
    log('Бот запущено.');
  },
};
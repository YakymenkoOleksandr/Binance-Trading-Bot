import { connectWebSocket } from './services/websocket.js';
import { calculateArbitrageProfit } from './strategies/arbitrage.js';
import { createOrder } from './services/binanceAPI.js';
import { log, logError } from './services/logger.js';

const prices = {}; // Кеш для цін

// Виконання трикутного арбітражу
const executeArbitrage = async (pair) => {

  try {
    log(`Старт арбітражу для пари ${pair.pairName}`);

    // Купівля першої валюти
    const firstOrder = await createOrder(pair.first.symbol, 'BUY', pair.first.amount);
    log(`Виконання ордера: ${JSON.stringify(firstOrder)}`);

    log(`Куплено ${firstOrder.amount} ${pair.first.symbol}`);

    // Купівля другої валюти
    log(`Створюється ордер для ${pair.second.symbol} з кількістю ${pair.second.amount}`);
    const secondOrder = await createOrder(pair.second.symbol, 'BUY', pair.second.amount);
    log(`Куплено ${secondOrder.amount} ${pair.second.symbol}`);

    // Продаж другої валюти за базову
    const finalOrder = await createOrder(pair.base.symbol, 'SELL', pair.second.amount);
    log(`Продано ${finalOrder.amount} ${pair.base.symbol}`);

    // Обрахунок прибутку
    const totalProfit = finalOrder.amount - workingСapital;
    log(`Прибуток: ${totalProfit.toFixed(2)} USDT`);

    // Якщо цикл завершено із збитком
    if (totalProfit < 0) {
      logError('Операція завершена зі збитком!');
    }
  } catch (error) {
    logError(`Помилка під час арбітражу: ${error.message}`);
  }
};

// Обробник оновлених цін
const handlePricesUpdate = (updatedPrices) => {
  Object.assign(prices, updatedPrices); // Оновлюємо кеш цін

  // Знаходимо вигідні пари
  const profitablePairs = calculateArbitrageProfit(prices);

  if (profitablePairs.length > 0) {
    const mostProfitablePair = profitablePairs[0]; // Беремо найвигіднішу пару
    
    executeArbitrage(mostProfitablePair);
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
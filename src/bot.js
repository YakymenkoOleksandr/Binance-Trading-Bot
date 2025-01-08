import { connectWebSocket } from './services/websocket.js';
import { calculateArbitrageProfit } from './strategies/arbitrage.js';
import { createOrder } from './services/binanceAPI.js';
import { log, logError } from './services/logger.js';

const prices = {}; // Кеш для цін

// Виконання трикутного арбітражу
const executeArbitrage = async (pair) => {

  log("Кількість першої та другої пари: ", pair)
  
  if (!pair || !pair.first || !pair.second || !pair.base) {
    throw new Error('Невірна структура пари для арбітражу');
  }

  if (!pair.first.symbol || !pair.second.symbol || !pair.base.symbol) {
    throw new Error('Відсутні символи валют у парі');
  }

  if (!pair.first.amount || !pair.second.amount) {
    throw new Error('Відсутні суми валют у парі');
  }

  if (!pair.first.amount || !pair.second.amount || isNaN(pair.first.amount) || isNaN(pair.second.amount)) {
  throw new Error('Некоректні суми валют у парі');
  }
  
  if (!pair.first.amount || !pair.second.amount) {
  logError('Відсутні значення amount у парі. Операція зупинена.');
  return;
}


  
  try {
    log(`Старт арбітражу для пари ${pair.pairName}`);

    // Купівля першої валюти
    const firstOrder = await createOrder(pair.first.symbol, 'BUY', pair.first.amount);
    console.log("pair.first.symbol", pair.first.symbol, "pair.first.amount ",  pair.first.amount);
    
    log(`Куплено ${firstOrder.amount} ${pair.first.symbol}`);

    // Купівля другої валюти
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
    console.log(mostProfitablePair);
    
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
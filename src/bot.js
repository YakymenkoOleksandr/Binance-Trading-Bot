import { connectWebSocket } from "./services/websocket.js";
import { calculateArbitrageProfit } from "./strategies/arbitrage.js";
import { createOrder, getBalances } from "./services/binanceAPI.js";
import { log, logError } from "./services/logger.js";
import { checkBalance, checkUSDTBalance, waitForBalanceUpdate } from "./utils/showBalances.js";

let lastLogTime = 0; // Час останнього логування про очікування
const LOG_INTERVAL = 5000; // Інтервал в мілісекундах (наприклад, 5 секунд)

const prices = {}; // Кеш для цін
let isExecutingArbitrage = false; // Прапорець виконання

const calculateAmount = (capital, price) => {
  if (!capital || !price || price <= 0) {
    throw new Error(
      `Неможливо обчислити кількість монет: capital=${capital}, price=${price}`
    );
  }
  return capital / price;
};


const executeArbitrage = async (pair, prices, workingСapital) => {
   if (isExecutingArbitrage) {
    const currentTime = Date.now();
    if (currentTime - lastLogTime > LOG_INTERVAL) {
      log("Арбітраж вже виконується, очікування завершення...");
      lastLogTime = currentTime;
    }
    return; // Чекаємо, поки поточний цикл завершиться
  }

  isExecutingArbitrage = true; // Встановлюємо прапорець
  try {
    log(`Старт арбітражу для пари ${pair.pairName}`);

    // Перевіряємо баланс на USDT
    log("Перевірка балансу USDT...");
    const isUSDTBalanceEnough = await checkUSDTBalance(workingСapital);
    if (!isUSDTBalanceEnough) return; // Перериваємо арбітраж, якщо коштів USDT недостатньо

    // Перевірка балансу першої валюти
    const firstAmount = calculateAmount(
      workingСapital,
      prices[pair.first.symbol]
    );
    log(
      `Перевірка балансу для ${pair.first.symbol}, кількість: ${firstAmount}`
    );
    const isFirstBalanceEnough = await checkBalance(pair.first.symbol.split("USDT")[0], firstAmount);
    if (!isFirstBalanceEnough) return; // Перериваємо арбітраж, якщо коштів недостатньо

    // Купівля першої валюти за USDT
    log(
      `Створення ордеру для купівлі ${pair.first.symbol} з кількістю ${firstAmount}`
    );
    const firstOrder = await createOrder(pair.first.symbol, "BUY", firstAmount);
    log(`Куплено ${firstOrder.amount || firstAmount} ${pair.first.symbol}`);

    // Очікуємо оновлення балансу першої валюти
    const isFirstBalanceUpdated = await waitForBalanceUpdate(
      pair.first.symbol,
      firstAmount
    );
    if (!isFirstBalanceUpdated) return; // Перериваємо арбітраж, якщо баланс не оновився

    // Обчислення кількості монет для другої валюти
    const secondAmount = calculateAmount(
      firstAmount,
      1 / prices[pair.second.symbol]
    );
    log(`Обчислено secondAmount: ${secondAmount}`);

    // Купівля другої валюти за першу валюту
    log(
      `Створення ордеру для купівлі ${pair.second.symbol} з кількістю ${secondAmount}`
    );
    const secondOrder = await createOrder(
      pair.second.symbol,
      "BUY",
      secondAmount
    );
    log(`Куплено ${secondOrder.amount || secondAmount} ${pair.second.symbol}`);

    // Очікуємо оновлення балансу другої валюти
    const isSecondBalanceUpdated = await waitForBalanceUpdate(
      pair.second.symbol,
      secondAmount
    );
    if (!isSecondBalanceUpdated) return; // Перериваємо арбітраж, якщо баланс не оновився

    // Продаж другої валюти за USDT
    log(
      `Створення ордеру для продажу ${pair.second.symbol} на суму ${secondAmount}`
    );
    const finalOrder = await createOrder("USDT", "SELL", secondAmount);
    log(`Продано ${finalOrder.amount || secondAmount} USDT`);

    // Розрахунок прибутку
    const totalProfit = finalOrder.amount - workingСapital;
    log(`Прибуток: ${totalProfit.toFixed(2)} USDT`);

    if (totalProfit < 0) {
      logError("Операція завершена зі збитком!");
    }
  } catch (error) {
    logError(`Помилка під час арбітражу на операції: ${error.message}`);
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
    log("Немає вигідних пар для арбітражу.");
  }
};

// Запуск WebSocket
const ws = connectWebSocket(handlePricesUpdate);

export const bot = {
  start: () => {
    console.log("Запуск бота...");
    log("Бот запущено.");
  },
};

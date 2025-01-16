import { connectWebSocket } from "./services/websocket.js";
import { calculateArbitrageProfit } from "./strategies/arbitrage.js";
import { createOrder, getBalances } from "./services/binanceAPI.js";
import { log, logError } from "./services/logger.js";
import {
  checkBalance,
  checkUSDTBalance,
  waitForBalanceUpdate,
} from "./utils/showBalances.js";
import { getBNBBalance } from "./utils/getBNBBalance.js";
import {calculateAmountFirst, calculateAmountSecond} from "./utils/calculateAmount.js"

const LOG_INTERVAL = 5000; // Інтервал в мілісекундах (наприклад, 5 секунд)
const prices = {}; // Кеш для цін
let lastLogTime = 0; // Час останнього логування про очікування
let isExecutingArbitrage = false; // Прапорець виконання

const executeArbitrage = async (pair, prices, workingСapital) => {
  if (isExecutingArbitrage) {
    const currentTime = Date.now();
    if (currentTime - lastLogTime > LOG_INTERVAL) {
      //  log("Арбітраж вже виконується, очікування завершення...");
      lastLogTime = currentTime;
    }
    return; // Чекаємо, поки поточний цикл завершиться
  }

  isExecutingArbitrage = true; // Встановлюємо прапорець
  try {
    log(`Старт арбітражу для пари ${pair.pairName}`);

    // Отримуємо значення балансу BNB
    getBNBBalance();

    // Перевіряємо баланс на USDT
    // log("Перевірка балансу USDT...");
    const isUSDTBalanceEnough = await checkUSDTBalance(workingСapital);
    if (!isUSDTBalanceEnough) return; // Перериваємо арбітраж, якщо коштів USDT недостатньо

    // Перевірка балансу першої валюти
    const firstAmount = calculateAmountFirst(workingСapital, prices[pair.first.symbol], pair.first.symbol, pair.second.symbol);

    //  `Перевірка балансу для ${pair.first.symbol}, кількість: ${firstAmount}`
    const isFirstBalanceEnough = await checkBalance(
      pair.first.symbol.split("USDT")[0],
      firstAmount
    );
    if (!isFirstBalanceEnough) return; // Перериваємо арбітраж, якщо коштів недостатньо

    // Купівля першої валюти за USDT
    const firstOrder = await createOrder(pair.first.symbol, "BUY", firstAmount);

    // Очікуємо оновлення балансу першої валюти
    /*const isFirstBalanceUpdated = await waitForBalanceUpdate(
      pair.first.symbol,
      firstAmount
    );
    if (!isFirstBalanceUpdated) return; // Перериваємо арбітраж, якщо баланс не оновився*/

    // Обчислення кількості монет для другої валюти
    const secondAmount = calculateAmountSecond(firstAmount, prices[pair.second.symbol], pair.first.symbol, pair.second.symbol );

    // Продаж першої валюти для купівлі другої
    // Для прямої пари
    if (pair.first.symbol !== "BTCUSDT" && pair.first.symbol !== "ETHUSDT" && pair.first.symbol !== "BNBUSDT") {
      // Для перевернутої пари
      const secondOrderSell = await createOrder(pair.second.symbol, "SELL", firstAmount);
    }
    else if (pair.first.symbol === "DAIUSDT" && pair.second.symbol === "BTCDAI") {
    const secondOrderBuy = await createOrder(pair.second.symbol, "BUY", secondAmount); // Виключення пряма пара
    }
    else if (pair.first.symbol === "DAIUSDT" && pair.second.symbol === "ETHDAI") {
      const secondOrderBuy = await createOrder(pair.second.symbol, "BUY", secondAmount); // Виключення пряма пара   
    } else if (pair.first.symbol === "ETHUSDT" && pair.second.symbol === "ETHBTC") {
      const secondOrderSell = await createOrder(pair.second.symbol, "SELL", firstAmount); // Виключення перевернута пара
    }
    else if (pair.first.symbol === "ETHUSDT" && pair.second.symbol === "ETHDAI") {
    const secondOrderSell = await createOrder(pair.second.symbol, "SELL", firstAmount); // Виключення перевернута пара
    }
    else if (pair.first.symbol === "BNBUSDT" && pair.second.symbol === "BNBETH") {
    const secondOrderSell = await createOrder(pair.second.symbol, "SELL", firstAmount); // Виключення перевернута пара
    }
    else if (pair.first.symbol === "BNBUSDT" && pair.second.symbol === "BNBBTC") {
    const secondOrderSell = await createOrder(pair.second.symbol, "SELL", firstAmount); // Виключення перевернута пара
    }
    else if (pair.first.symbol === "SHIB" && pair.second.symbol === "DOGE") {
    const secondOrderSell = await createOrder(pair.second.symbol, "SELL", firstAmount); // Виключення перевернута пара
    }
    else {
      // Для прямої пари
      const secondOrderBuy = await createOrder(pair.second.symbol, "BUY", secondAmount);
    }

    // Очікуємо оновлення балансу другої валюти
    /*const isSecondBalanceUpdated = await waitForBalanceUpdate(
      pair.second.symbol,
      secondAmount
    );
    if (!isSecondBalanceUpdated) return; // Перериваємо арбітраж, якщо баланс не оновився*/

    // Продаж другої валюти за USDT
    const sellPair = `${pair.second.symbol.replace(
      pair.first.symbol.split("USDT")[0],
      ""
    )}USDT`;

    // Вирахування комісії з після виконання другого ордеру
    let thirdAmount = secondAmount;

    // Третій ордер обміну другої валюти на USDT
    const finalOrder = await createOrder(sellPair, "SELL", thirdAmount);

    // Розрахунок прибутку
    const totalProfit =
      finalOrder.amount -
      firstAmount * prices[pair.first.symbol];
    // log(`Прибуток після комісії: ${totalProfit.toFixed(2)} USDT`);

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
    const workingСapital = 100; // Початковий капітал для арбітражу
    executeArbitrage(mostProfitablePair, prices, workingСapital);
  } else {
    // log("Немає вигідних пар для арбітражу.");
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

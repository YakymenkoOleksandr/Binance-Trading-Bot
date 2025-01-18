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
import { calculateAmountFirst, calculateAmountSecond } from "./utils/calculateAmount.js"
import { syncServerTime, getPrice } from "./services/binanceAPI.js";
import { getStepSize, roundToStepSize } from "./utils/quantity.js";


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
    console.log("Profit ", pair.profitInPercentage, " %");
    const sellPair = `${pair.second.symbol.replace(
      pair.first.symbol.split("USDT")[0],
      ""
    )}USDT`;
    const firstCoin = pair.first.symbol.replace('USDT', '')
    const secondCoin = `${pair.second.symbol.replace(pair.first.symbol.split("USDT")[0], "")}`
    
     const [firstPairQuantity, secondPairQuantity, thirdPairQuantity] = await Promise.all([
    getStepSize(pair.first.symbol),
    getStepSize(pair.second.symbol),
    getStepSize(sellPair)
     ]);
    
    const [firstPairPriсe, secondPairPriсe, thirdPairPriсe] = await Promise.all([
      getPrice(pair.first.symbol),
      getPrice(pair.second.symbol),
      getPrice(sellPair)
    ]);
    
    

   // console.log(firstPairQuantity, secondPairQuantity, thirdPairQuantity);

    // Отримуємо значення балансу BNB
     getBNBBalance();
    
    // Перевіряємо баланс на USDT
    const isUSDTBalanceEnough = await checkUSDTBalance(workingСapital);
    
    // Підрахунок кількості валюти, яку можна купить за workcapital
    const firstAmountSum = calculateAmountFirst(workingСapital, prices[pair.first.symbol], pair.first.symbol, pair.second.symbol)
    const firstAmount = roundToStepSize(firstAmountSum, firstPairQuantity);

    console.log("Sum 1", firstAmountSum, "Округлення", firstAmount);

    console.log("Скільки монет можна купить за наявну суму ", roundToStepSize(firstAmount / secondPairPriсe, secondPairQuantity));
    


    if (isUSDTBalanceEnough) {
      // Купівля першої валюти за USDT
    const firstOrder = await createOrder(pair.first.symbol, "BUY", firstAmount);
    }
    
    // Обчислення кількості монет для другої валюти
    const secondAmountSum = calculateAmountSecond(firstAmount, prices[pair.second.symbol], pair.first.symbol, pair.second.symbol );
    const secondAmount = roundToStepSize(secondAmountSum, secondPairQuantity);
    console.log("Sum 2 до перетворення", firstAmount, "Округлення після перетворення", secondAmount);

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
      const isFirstBalanceEnough = await waitForBalanceUpdate(
      firstCoin,
      firstAmount
      );
      // Для прямої пари, якщо баланс ще не оновлено, то операція буде очікувати оновлення
      if (isFirstBalanceEnough) {
        const secondOrderBuy = await createOrder(pair.second.symbol, "BUY", secondAmount);
      }
    }

    // Третій ордер продаж другої валюти за USDT
    
    let thirdAmount = roundToStepSize(secondAmount, thirdPairQuantity);
    console.log("Sum 3 до перетворення", secondAmount, "Округлення після перетворення", thirdAmount);
    // Очікуємо оновлення балансу другої валюти

    const isSecondBalanceEnough = await waitForBalanceUpdate(
      secondCoin,
      secondAmount
      );
      // Для прямої пари, якщо баланс ще не оновлено, то операція буде очікувати оновлення
      if (isSecondBalanceEnough) {
         await createOrder(sellPair, "SELL", thirdAmount);
      }
  } catch (error) {
    logError(`Помилка під час арбітражу на операції: ${error.message}`);
  } finally {
   const finalOrder = isExecutingArbitrage = false; // Знімаємо прапорець після завершення
  }
};

// Обробник оновлених цін
const handlePricesUpdate = (updatedPrices) => {
  Object.assign(prices, updatedPrices); // Оновлюємо кеш цін

  // Знаходимо вигідні пари
  const profitablePairs = calculateArbitrageProfit(prices);

  if (profitablePairs.length > 0) {
    const mostProfitablePair = profitablePairs[0]; // Беремо найвигіднішу пару  
    
    const workingСapital = 50; // Початковий капітал для арбітражу
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
     // Негайна синхронізація часу при запуску
    syncServerTime();
    // Регулярна синхронізація часу кожні 5 хвилин
    setInterval(syncServerTime, 5 * 60 * 1000);
  },
};

import { connectWebSocket } from "./services/websocket.js";
import { calculateArbitrageProfit } from "./strategies/arbitrage.js";
import { createOrder, getBidAskPrices, getBidAskVolumes } from "./services/binanceAPI.js";
import { log, logError } from "./services/logger.js";
import {
  checkUSDTBalance,
  waitForBalanceUpdate,
} from "./utils/showBalances.js";
import { getBNBBalance } from "./utils/getBNBBalance.js";
import {  calculateAmountSecond } from "./utils/calculateAmount.js"
import { syncServerTime, getPrice,  } from "./services/binanceAPI.js";
import { getStepSize, roundToStepSize } from "./utils/quantity.js";


const LOG_INTERVAL = 5000; // Інтервал в мілісекундах (наприклад, 5 секунд)
const prices = {}; // Кеш для цін
let lastLogTime = 0; // Час останнього логування про очікування
let isExecutingArbitrage = false; // Прапорець виконання

const executeArbitrage = async (pair) => {  
  // Прапорець виконання арбітражу
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
    console.log("Profit ", pair.profitInPercentage, " %"); // Профіт для пари, який надійшов з обчислень з webSocet данних

    // Найвигідніша пара, яку ми отримуємо
    //  console.log(pair);
    // Капітал для арбітражу
    let workingСapital = 100;
    // Назви пар які беруть учать в обміні
    let firstSeilPair = pair.first.symbol;
    let secondSeilPair = pair.second.symbol;
    let thirdSeilPair = pair.third.symbol;
    
    // Монети, які обмінюються
    let firstCoin = firstSeilPair.replace('USDT', '')
    let secondCoin = secondSeilPair.replace(firstCoin, '')
    // console.log("Перша монета", firstCoin, "Друга монета", secondCoin);
    
    // До якого значення округляється торгова пара
    const [firstPairQuantity, secondPairQuantity, thirdPairQuantity, firstPairBidAskPriсe] = await Promise.all([ 
      getStepSize(firstSeilPair),
      getStepSize(secondSeilPair),
      getStepSize(thirdSeilPair),
      getBidAskPrices(firstSeilPair),
     ]);

    // Значення округлення певної валюти
    console.log(firstSeilPair, firstPairQuantity, secondSeilPair, secondPairQuantity, thirdSeilPair, thirdPairQuantity);
    
    // Отримуємо значення балансу BNB
     getBNBBalance();
    
    // Перевіряємо баланс на достатність USDT
    const isUSDTBalanceEnough = await checkUSDTBalance(workingСapital);
    // Підрахунок кількості валюти, яку можна купить за workcapital
    let preFirstAmountBeforeRaunded = workingСapital / firstPairBidAskPriсe.ask;

    // Округлена кількість першої валюти до дозволеної Binance
    const firstAmount = roundToStepSize(preFirstAmountBeforeRaunded, firstPairQuantity);
    // Скільки монети можна купити за робочий капітал
    console.log("Кількість першої монети, яку можна купити за workingCapital", preFirstAmountBeforeRaunded, "Після округлення", firstAmount);
    
    if (isUSDTBalanceEnough) {
      // Купівля першої валюти за USDT
    const firstOrder = await createOrder(firstSeilPair, "BUY", firstAmount);
    }

    // Отримуємо актуальну ціну другої пари
    const secondPairBidAskPriсe = await getBidAskPrices(secondSeilPair);
     
    // Обчислення кількості монет для другої валюти для покупки
    const secondAmountSum = calculateAmountSecond(firstAmount, secondPairBidAskPriсe.bid, secondPairBidAskPriсe.ask, firstSeilPair, secondSeilPair);

    // Округлення кількості монет для другої валюти для покупки
    const secondAmount = roundToStepSize(secondAmountSum, secondPairQuantity);

    // Значення які ми отримуємо до та після округлення для другої монети
    console.log("Sum 2 до перетворення", secondAmountSum, "Округлення після перетворення", secondAmount);

    // Продаж першої валюти для купівлі другої
    // Для прямої пари
    
    if (pair.first.symbol !== "BTCUSDT" && pair.first.symbol !== "ETHUSDT" && pair.first.symbol !== "BNBUSDT") {
      // Для перевернутої пари
    /*  const secondOrderSell = await createOrder(secondSeilPair, "SELL", firstAmount);*/
    }
    /*else if (pair.first.symbol === "DAIUSDT" && secondSeilPair === "BTCDAI") {
    const secondOrderBuy = await createOrder(secondSeilPair, "BUY", secondAmount); // Виключення пряма пара
    }
    else if (pair.first.symbol === "DAIUSDT" && secondSeilPair === "ETHDAI") {
      const secondOrderBuy = await createOrder(secondSeilPair, "BUY", secondAmount); // Виключення пряма пара   
    } else if (pair.first.symbol === "ETHUSDT" && secondSeilPair === "ETHBTC") {
      const secondOrderSell = await createOrder(secondSeilPair, "SELL", firstAmount); // Виключення перевернута пара
    }
    else if (pair.first.symbol === "ETHUSDT" && secondSeilPair === "ETHDAI") {
    const secondOrderSell = await createOrder(secondSeilPair, "SELL", firstAmount); // Виключення перевернута пара
    }
    else if (pair.first.symbol === "BNBUSDT" && secondSeilPair === "BNBETH") {
    const secondOrderSell = await createOrder(secondSeilPair, "SELL", firstAmount); // Виключення перевернута пара
    }
    else if (pair.first.symbol === "BNBUSDT" && secondSeilPair === "BNBBTC") {
    const secondOrderSell = await createOrder(secondSeilPair, "SELL", firstAmount); // Виключення перевернута пара
    }
    else if (pair.first.symbol === "SHIB" && secondSeilPair === "DOGE") {
    const secondOrderSell = await createOrder(secondSeilPair, "SELL", firstAmount); // Виключення перевернута пара
    }*/
    else {
      const isFirstBalanceEnough = await waitForBalanceUpdate(
      firstCoin,
      firstAmount
      );
      // Для прямої пари, якщо баланс ще не оновлено, то операція буде очікувати оновлення
      if (isFirstBalanceEnough) {
        const secondOrderBuy = await createOrder(secondSeilPair, "BUY", secondAmount);
      }
    }

    // Третій ордер продаж другої валюти за USDT
    
    // Округлення не 
    let thirdAmount = roundToStepSize(secondAmount, thirdPairQuantity);

    console.log("Sum 3 до перетворення", secondAmount, "Округлення після перетворення", thirdAmount);
    // Очікуємо оновлення балансу другої валюти

    const isSecondBalanceEnough = await waitForBalanceUpdate(
      secondCoin,
      secondAmount
      );
      // Для прямої пари, якщо баланс ще не оновлено, то операція буде очікувати оновлення
      if (isSecondBalanceEnough) {
         await createOrder(thirdSeilPair, "SELL", thirdAmount);
    }

    // Запит актуальної ціни для третьої пари
    const thirdBidAskPairPriсe = await getBidAskPrices(thirdSeilPair);


    // Перша сума комісії
    const firstSumComision = (firstAmount * firstPairBidAskPriсe.ask) * 0.00075;

    // Друга сума комісії
    let secondSumComision
    if (
    pair.first.symbol !== "BTCUSDT" &&
    pair.first.symbol !== "ETHUSDT" &&
    pair.first.symbol !== "BNBUSDT"
    ) {
    // Перевернута пара: X → BTC, ETH, BNB (множимо)
      secondSumComision = (secondAmount * secondPairBidAskPriсe.ask * firstPairBidAskPriсe.ask) * 0.00075;
    } else {
      secondSumComision = (secondAmount * secondPairBidAskPriсe.ask * firstPairBidAskPriсe.ask) * 0.00075;
    }

    // Третя сума комісії
    const thirdSumComision = (thirdAmount * thirdBidAskPairPriсe.bid) * 0.00075;

    // Сума комісій разом 
    const totalSumOfComision = firstSumComision + secondSumComision + thirdSumComision;

    // Сума USDT після осанньої операції
    let sumUSDTAfterLastTrade = thirdAmount * thirdBidAskPairPriсe.bid;

    // Різниця початково затраченого капіталу та суми після продажу останньої пари з вирахуванням суми комісій
    let profit = sumUSDTAfterLastTrade - (firstAmount * firstPairBidAskPriсe.ask) - totalSumOfComision;
    console.log("Дохід: ", roundToStepSize(profit, 0.01), "Дохід у відсотках: ", ((profit) /(firstAmount * firstPairBidAskPriсe.ask)) * 100, "%" );
    

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
    executeArbitrage(mostProfitablePair);
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

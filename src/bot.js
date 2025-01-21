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

const executeArbitrage = async (pair, prices, workingСapital, ) => {  
  
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
    
    // До якого значення округляється торгова пара
    const [firstPairQuantity, secondPairQuantity, thirdPairQuantity, firstPairBidAskPriсe, secondPairBidAskPriсe, thirdBidAskPairPriсe, ] = await Promise.all([ 
      getStepSize(pair.first.symbol),
      getStepSize(pair.second.symbol),
      getStepSize(pair.third.symbol),
      getBidAskPrices(pair.first.symbol),
      getBidAskPrices(pair.second.symbol),
        getBidAskPrices(sellPair),
      /*getPrice(pair.first.symbol),
      getPrice(pair.second.symbol),
      getPrice(sellPair),*/
      // firstPairPriсe, secondPairPriсe, thirdPairPriсe,
      /* getBidAskVolumes(pair.first.symbol),
      getBidAskVolumes(pair.second.symbol),
      getBidAskVolumes(sellPair),*/
      //firstPairBidAskVolumes, secondPairBidAskVolumes, thirdPairBidAskVolumes
     ]);
    
    console.log(firstPairBidAskPriсe, secondPairBidAskPriсe, thirdBidAskPairPriсe,);
    
    console.log(firstPairQuantity, secondPairQuantity, thirdPairQuantity);
   
    
    // console.log(firstPairBidAskPriсe.ask, secondPairPriсe, thirdPairPriсe);
    
    // Отримуємо значення балансу BNB
     getBNBBalance();
    
    // Перевіряємо баланс на USDT
    const isUSDTBalanceEnough = await checkUSDTBalance(workingСapital);
    
    // Підрахунок кількості валюти, яку можна купить за workcapital
    // Скільки реально USDT піде на купівлю 
    const preFirstAmount = roundToStepSize(workingСapital / firstPairBidAskPriсe.ask, firstPairQuantity) * firstPairBidAskPriсe.ask;
    // Округлення суми до допустимих значень кількість USDT
    const firstAmountUSDT = roundToStepSize(preFirstAmount, firstPairQuantity);
    // Визначення неокругленої суми першої монети
    const firstAmountNotRounded = firstAmountUSDT / firstPairBidAskPriсe.ask;
    // Округлення суми до допустимих значень кількості першої монети
    const firstAmount = roundToStepSize(firstAmountNotRounded, firstPairQuantity);
    console.log("Округлена сума USDT", firstAmountUSDT, "Ціна пари", firstPairBidAskPriсe.ask, "Округлена кількість покупки ", firstAmount, "Округлення ", firstPairQuantity);
    

    if (isUSDTBalanceEnough) {
      // Купівля першої валюти за USDT
    const firstOrder = await createOrder(pair.first.symbol, "BUY", firstAmount);
    }
    
    // Обчислення кількості монет для другої валюти
    const secondAmountSum = calculateAmountSecond(firstAmount, secondPairBidAskPriсe.bid, secondPairBidAskPriсe.ask, pair.first.symbol, pair.second.symbol );
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

    // console.log(firstAmount, secondAmount, thirdAmount);
    
    // console.log(firstPairBidAskPriсe.ask, secondPairPriсe, thirdPairPriсe);

    const firstSumComision = (firstAmount * firstPairBidAskPriсe.ask) * 0.00075;
    let secondSumComision
    if (
    pair.first.symbol !== "BTCUSDT" &&
    pair.first.symbol !== "ETHUSDT" &&
    pair.first.symbol !== "BNBUSDT"
    ) {
    // Перевернута пара: X → BTC, ETH, BNB (множимо)
      secondSumComision = (secondAmount * secondPairBidAskPriсe.ask * firstPairBidAskPriсe.ask) * 0.00075
    } else {
      secondSumComision = (secondAmount * secondPairBidAskPriсe.bid * firstPairBidAskPriсe.ask) * 0.00075
    }
    const thirdSumComision = (thirdAmount * thirdBidAskPairPriсe.bid) * 0.00075
    const totalSumOfComision = firstSumComision + secondSumComision + thirdSumComision;
    const profit = (thirdAmount * thirdBidAskPairPriсe.bid) - (firstAmount / firstPairBidAskPriсe.ask) - totalSumOfComision
    console.log("Дохід: ", profit - (firstAmount * firstPairBidAskPriсe.ask), "Дохід у відсотках: ", (profit /(firstAmount * firstPairBidAskPriсe.ask)) * 100 - 100, "%" );
    

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
    console.log(mostProfitablePair);
    
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
     // Негайна синхронізація часу при запуску
    syncServerTime();
    // Регулярна синхронізація часу кожні 5 хвилин
    setInterval(syncServerTime, 5 * 60 * 1000);
  },
};

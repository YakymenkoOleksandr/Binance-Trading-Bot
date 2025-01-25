// src/utils/cslculateProfit.js
export function calculateProfit({ pricesFirstCoin, pricesCoinToCoin, pricesSecondCoin, firstSymbol, secondSymbol, firstQuantity, secondQuantity, thirdQuantity }) {
  // Перевірка, чи всі необхідні дані отримані
  if (
    !pricesFirstCoin || !pricesCoinToCoin ||
    !pricesSecondCoin || !firstSymbol ||
    !secondSymbol || !firstQuantity || !secondQuantity || !thirdQuantity
  ) {
   // console.log("Не всі данні отримано!", firstSymbol, secondSymbol, pricesFirstCoin, pricesCoinToCoin, pricesSecondCoin, firstSymbol, secondSymbol, firstQuantity, secondQuantity, thirdQuantity);
    
    return null; // Або повернути 0, або повідомлення, залежно від потреб
  }

  let workingСapital = 100;
 
  // Функція для обчислення суми після вирахування комісії
  const deductCommission = (amount) => amount - amount * 0.00075;
  //console.log(firstQuantity, secondQuantity, thirdQuantity);

  
  
  // Розрахунки

  let amountAfterFirstTrade
  amountAfterFirstTrade = workingСapital / pricesFirstCoin.ask; // Продаж USDT за першу валюту
  amountAfterFirstTrade = Math.floor(amountAfterFirstTrade / firstQuantity) * firstQuantity; // Округлення
  amountAfterFirstTrade = parseFloat(amountAfterFirstTrade.toFixed(-Math.log10(firstQuantity))); // Округлення

  let amountBeforeSecondOperation = amountAfterFirstTrade;

  let usedUSDTInFirstOperation = amountBeforeSecondOperation * pricesFirstCoin.ask

  let amountAfterSecondTrade

  if (
    firstSymbol !== "BTCUSDT" &&
    firstSymbol !== "ETHUSDT" &&
    firstSymbol !== "BNBUSDT"
  ) {
    // Підрахунок кількості для обміну перевернутої пари
    amountAfterSecondTrade = amountAfterFirstTrade * pricesCoinToCoin.bid; 
    amountAfterSecondTrade = Math.floor(amountAfterSecondTrade / thirdQuantity) * thirdQuantity;
    amountAfterSecondTrade = parseFloat(amountAfterSecondTrade.toFixed(-Math.log10(thirdQuantity)));
  } else {
    // Підрахунок кількості для обміну прямої пари
    amountAfterSecondTrade = amountBeforeSecondOperation / pricesCoinToCoin.ask; 
    amountAfterSecondTrade = Math.floor(amountAfterSecondTrade / secondQuantity) * secondQuantity;
    amountAfterSecondTrade = parseFloat(amountAfterSecondTrade.toFixed(-Math.log10(secondQuantity)));
  }
  
  // Підрахунок допустимої кількості для третьої операції 
  let amountBeforeThirdTrade = Math.floor(amountAfterSecondTrade / thirdQuantity) * thirdQuantity;
  amountBeforeThirdTrade = parseFloat(amountAfterSecondTrade.toFixed(-Math.log10(thirdQuantity)));

  let firstComision = (amountAfterFirstTrade * pricesFirstCoin.ask) - deductCommission(amountAfterFirstTrade * pricesFirstCoin.bid);

  let secondComision = (amountBeforeSecondOperation * pricesFirstCoin.ask) - deductCommission(amountBeforeSecondOperation * pricesFirstCoin.ask);

  let thirdComision = (amountBeforeThirdTrade * pricesSecondCoin.bid) - deductCommission(amountBeforeThirdTrade * pricesSecondCoin.bid)

  let sumOfComision = firstComision + secondComision + thirdComision;

  let finalAmountUSDT = amountBeforeThirdTrade * pricesSecondCoin.bid - sumOfComision; // Продаж другої валюти за USDT

  let amountAfterThirdTrade = Math.floor(finalAmountUSDT / 0.01) * 0.01;

  // Розрахунок прибутку
  let profitInPercentage = ((amountAfterThirdTrade - usedUSDTInFirstOperation)/usedUSDTInFirstOperation) * 100;
  profitInPercentage = Math.floor(profitInPercentage / 0.01) * 0.01;
  profitInPercentage = parseFloat(profitInPercentage.toFixed(-Math.log10(0.01)));
  
  /*console.log("Обмін", firstSymbol, secondSymbol, "Кількість USDT на першу операцію",usedUSDTInFirstOperation , "Кількість першої монети після покупки", amountAfterFirstTrade, "Кількість першої монети після округлення ", amountBeforeSecondOperation,
    "Кількість другої монети ", amountAfterSecondTrade, "Кількість другої монети після округлення ", amountBeforeThirdTrade, 
    "Кількість USDT після всіх операцій ", finalAmountUSDT, "Кількість USDT після округлення ", amountAfterThirdTrade,
    "tickSize1",  firstQuantity, "tickSize2", secondQuantity, "tickSize3", thirdQuantity, "Процент вигоди ", profitInPercentage,
   );*/
  
  
  return profitInPercentage;
}
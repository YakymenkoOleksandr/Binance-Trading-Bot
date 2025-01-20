// src/utils/cslculateProfit.js
export function calculateProfit({ pricesFirstCoin, pricesCoinToCoin, pricesSecondCoin, firstSymbol, secondSymbol, firstQuantity, secondQuantity, thirdQuantity }) {
  // Перевірка, чи всі необхідні дані отримані
  if (
    !pricesFirstCoin || !pricesFirstCoin.bid ||
    !pricesCoinToCoin || (!pricesCoinToCoin.bid && !pricesCoinToCoin.ask) ||
    !pricesSecondCoin || !pricesSecondCoin.bid
  ) {
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
   /* amountAfterSecondTrade = amountAfterFirstTrade * pricesCoinToCoin.ask; // Операція купівлі другої валюти за першу
    amountAfterSecondTrade = Math.floor(amountAfterSecondTrade / firstQuantity) * secondQuantity;*/

  } else {
    amountAfterSecondTrade = amountBeforeSecondOperation / pricesCoinToCoin.ask; // Операція продажу першої валюти за другу
    amountAfterSecondTrade = Math.floor(amountAfterSecondTrade / secondQuantity) * secondQuantity;
    amountAfterSecondTrade = parseFloat(amountAfterSecondTrade.toFixed(-Math.log10(secondQuantity)));
  }
  
  let amountBeforeThirdTrade = Math.floor(amountAfterSecondTrade / thirdQuantity) * thirdQuantity;
  amountBeforeThirdTrade = parseFloat(amountAfterSecondTrade.toFixed(-Math.log10(thirdQuantity)));

  let firstComision = (amountAfterFirstTrade * pricesFirstCoin.ask) - deductCommission(amountAfterFirstTrade * pricesFirstCoin.bid);

  let secondComision = (amountBeforeSecondOperation * pricesFirstCoin.ask) - deductCommission(amountBeforeSecondOperation * pricesFirstCoin.ask);

  let thirdComision = (amountBeforeThirdTrade * pricesSecondCoin.bid) - deductCommission(amountBeforeThirdTrade * pricesSecondCoin.bid)

  let sumOfComision = firstComision + secondComision + thirdComision;

  let finalAmountUSDT = amountBeforeThirdTrade * pricesSecondCoin.bid - sumOfComision; // Продаж другої валюти за USDT

  let amountAfterThirdTrade = Math.floor(finalAmountUSDT / 0.01) * 0.01;

  // Розрахунок прибутку
  const profitInPercentage = ((amountAfterThirdTrade - usedUSDTInFirstOperation)/usedUSDTInFirstOperation) * 100;

  
  console.log("Кількість USDT на першу операцію",usedUSDTInFirstOperation , "Кількість першої монети після покупки", amountAfterFirstTrade, "Кількість першої монети після округлення ", amountBeforeSecondOperation,
    "Кількість другої монети ", amountAfterSecondTrade, "Кількість другої монети після округлення ", amountBeforeThirdTrade, 
    "Кількість USDT після всіх операцій ", finalAmountUSDT, "Кількість USDT після округлення ", amountAfterThirdTrade,
    "tickSize1",  firstQuantity, "tickSize2", secondQuantity, "tickSize3", thirdQuantity, "Процент вигоди ", profitInPercentage,
   );
  
  
  return profitInPercentage;
}
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

  // Розрахунки
  let amountAfterFirstTrade = workingСapital / pricesFirstCoin.bid; // Продаж USDT за першу валюту
  amountAfterFirstTrade = Math.floor(amountAfterFirstTrade / firstQuantity) * firstQuantity; // Округлення
  amountAfterFirstTrade = parseFloat(amountAfterFirstTrade.toFixed(-Math.log10(firstQuantity))); // Округлення

  let sumToChangeInSecondOperation = Math.floor(amountAfterFirstTrade / secondQuantity) * secondQuantity;
  sumToChangeInSecondOperation = parseFloat(amountAfterFirstTrade.toFixed(-Math.log10(secondQuantity)));

  let amountAfterSecondTrade
  
  if (
    firstSymbol !== "BTCUSDT" &&
    firstSymbol !== "ETHUSDT" &&
    firstSymbol !== "BNBUSDT"
  ) {
   /* amountAfterSecondTrade = amountAfterFirstTrade * pricesCoinToCoin.ask; // Операція купівлі другої валюти за першу
    amountAfterSecondTrade = Math.floor(amountAfterSecondTrade / firstQuantity) * secondQuantity;
    amountAfterSecondTrade = parseFloat(amountAfterSecondTrade.toFixed(-Math.log10(secondQuantity)));*/
  } else {
    amountAfterSecondTrade = sumToChangeInSecondOperation / pricesCoinToCoin.bid; // Операція продажу першої валюти за другу
    amountAfterSecondTrade = Math.floor(amountAfterSecondTrade / secondQuantity) * secondQuantity;
    amountAfterSecondTrade = parseFloat(amountAfterSecondTrade.toFixed(-Math.log10(secondQuantity)));
  }
  
  let amountBeforeThirdTrade = Math.floor(amountAfterSecondTrade / thirdQuantity) * thirdQuantity;

  amountBeforeThirdTrade = parseFloat(amountAfterSecondTrade.toFixed(-Math.log10(thirdQuantity)));

  let firstComision = (amountAfterFirstTrade * pricesFirstCoin.bid) - deductCommission(amountAfterFirstTrade * pricesFirstCoin.bid);

  let secondComision = (amountAfterSecondTrade * pricesSecondCoin.bid) - deductCommission(amountAfterSecondTrade * pricesSecondCoin.bid);

  let thirdComision = (amountBeforeThirdTrade * pricesSecondCoin.bid) - deductCommission(amountBeforeThirdTrade * pricesSecondCoin.bid)

  let sumOfComision = firstComision + secondComision + thirdComision;

  let finalAmountUSDT = amountBeforeThirdTrade * pricesSecondCoin.bid - sumOfComision; // Продаж другої валюти за USDT

  let amountAfterThirdTrade = Math.floor(finalAmountUSDT / 0.01) * 0.01;

  // Розрахунок прибутку
  const profitInPercentage = ((amountAfterThirdTrade - (amountAfterFirstTrade * pricesFirstCoin.bid)) /(amountAfterFirstTrade * pricesFirstCoin.bid)) * 100;

  return profitInPercentage;
}
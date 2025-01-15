// src/utils/cslculateProfit.js
export function calculateProfit({ workingСapital, pricesFirstCoin, pricesCoinToCoin, pricesSecondCoin }) {
  
  // Функція для обчислення суми після вирахування комісії
  const deductCommission = (amount) => amount - amount * 0.00075;
  
  // Розрахунки
  const amountAfterFirstTrade = deductCommission(workingСapital) / pricesFirstCoin; // Купівля першої монети за USDT
  const amountAfterSecondTrade = deductCommission(amountAfterFirstTrade) / pricesCoinToCoin; // Обмін монети на іншу монету
  const finalAmountUSDT = deductCommission(amountAfterSecondTrade) * pricesSecondCoin; // Конвертація другої монети в USDT
  
  // Розрахунок прибутку
  const profitInPercentage = Math.round(((finalAmountUSDT / workingСapital) * 100 - 100) * 100) / 100;

  return profitInPercentage;
}
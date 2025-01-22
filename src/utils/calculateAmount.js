
export const calculateAmountSecond = (firstAmount, secondPairBidAskPriсeBid, secondPairBidAskPriсeAsk, firstSymbol, secondSymbol, firstPairQuantity, secondPairQuantity) => {

  let amount;

  // Визначаємо, чи це перевернута пара
  if (
    firstSymbol !== "BTCUSDT" &&
    firstSymbol !== "ETHUSDT" &&
    firstSymbol !== "BNBUSDT"
  ) {
    // Перевернута пара: X → BTC, ETH, BNB (множимо)
    amount = firstAmount * secondPairBidAskPriсeAsk; // Множимо на ціну для перевернутої пари
  }
  else if (firstSymbol === "ETHUSDT" && secondSymbol === "ETHBTC") {
    amount = firstAmount * secondPairBidAskPriсeAsk; // Множимо на ціну для перевернутої пари
  }
  else if (firstSymbol === "ETHUSDT" && secondSymbol === "ETHDAI") {
    amount = firstAmount * secondPairBidAskPriсeAsk; // Множимо на ціну для перевернутої пари
  }
  else if (firstSymbol === "BNBUSDT" && secondSymbol === "BNBETH") {
    amount = firstAmount * secondPairBidAskPriсeAsk; // Множимо на ціну для перевернутої пари
  }
  else if (firstSymbol === "BNBUSDT" && secondSymbol === "BNBBTC") {
    amount = firstAmount * secondPairBidAskPriсeAsk; // Множимо на ціну для перевернутої пари
  }
  else if (firstSymbol === "SHIB" && secondSymbol === "DOGE") {
    amount = firstAmount * secondPairBidAskPriсeAsk; // Множимо на ціну для перевернутої пари
  }
  else if (firstSymbol === "DAIUSDT" && secondSymbol === "BTCDAI") {
    amount = firstAmount / secondPairBidAskPriсeBid; // Ділимо на ціну для прямої пари
  }
  else if (firstSymbol === "DAIUSDT" && secondSymbol === "ETHDAI") {
    amount = firstAmount / secondPairBidAskPriсeBid; // Ділимо на ціну для прямої пари
  } else {
    // Пряма пара: BTC, ETH, BNB → X (ділимо)
    amount = firstAmount  / secondPairBidAskPriсeAsk; // Ділимо на ціну для прямої пари
  }

  return amount;
};
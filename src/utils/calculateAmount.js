
export const calculateAmountSecond = (firstAmount, price, firstSymbol, secondSymbol, firstPairQuantity, secondPairQuantity) => {
  if (!firstAmount || !price || price <= 0) {
    throw new Error(
      `Неможливо обчислити кількість монет: capital=${firstAmount}, price=${price}`
    );
  }

  let amount;

  // Визначаємо, чи це перевернута пара
  if (
    firstSymbol !== "BTCUSDT" &&
    firstSymbol !== "ETHUSDT" &&
    firstSymbol !== "BNBUSDT"
  ) {
    // Перевернута пара: X → BTC, ETH, BNB (множимо)
    amount = firstAmount * price; // Множимо на ціну для перевернутої пари
  }
  else if (firstSymbol === "ETHUSDT" && secondSymbol === "ETHBTC") {
    amount = firstAmount * price; // Множимо на ціну для перевернутої пари
  }
  else if (firstSymbol === "ETHUSDT" && secondSymbol === "ETHDAI") {
    amount = firstAmount * price; // Множимо на ціну для перевернутої пари
  }
  else if (firstSymbol === "BNBUSDT" && secondSymbol === "BNBETH") {
    amount = firstAmount * price; // Множимо на ціну для перевернутої пари
  }
  else if (firstSymbol === "BNBUSDT" && secondSymbol === "BNBBTC") {
    amount = firstAmount * price; // Множимо на ціну для перевернутої пари
  }
  else if (firstSymbol === "SHIB" && secondSymbol === "DOGE") {
    amount = firstAmount * price; // Множимо на ціну для перевернутої пари
  }
  else if (firstSymbol === "DAIUSDT" && secondSymbol === "BTCDAI") {
    amount = firstAmount * price; // Ділимо на ціну для прямої пари
  }
  else if (firstSymbol === "DAIUSDT" && secondSymbol === "ETHDAI") {
    amount = firstAmount * price; // Ділимо на ціну для прямої пари
  } else {
    // Пряма пара: BTC, ETH, BNB → X (ділимо)
    amount = firstAmount  / price; // Ділимо на ціну для прямої пари
  }

  return amount;
};
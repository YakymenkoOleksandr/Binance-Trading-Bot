import {
  getBidAskPrices,
  createOrder,
  getOpenOrders,
  createDOTUSDTLimitOrder,
} from "../services/binanceAPI.js";
import {
  checkUSDTBalance,
  checkBalance,
} from "../utils/showBalances.js";

export async function tradingDOTCoin() {
  const SYMBOL_DOTUSDT = "DOTUSDT";
  const MIN_PRICE = 6.2; // Мінімальна ціна
  const MAX_PRICE = 6.5; // Максимальна ціна
  const PRICE_STEP = 0.1; // Крок зміни ціни
  const ORDER_AMOUNT = 10; // Сума ордеру в USDT
  const QUANTITY_PAIR_DOTUSDT = 0.01; // Мінімальна кількість DOT, кратна парі

  try {
    // Отримуємо bid і ask ціни для DOTUSDT
    const { bid, ask } = await getBidAskPrices(SYMBOL_DOTUSDT);
    if (!bid || !ask) {
      console.log(`Ціна для ${SYMBOL_DOTUSDT} не отримана.`);
      return;
    }

    console.log(`Поточна ціна ${SYMBOL_DOTUSDT}: Bid = ${bid}, Ask = ${ask}`);

    // Отримуємо відкриті ордери
    const openOrders = await getOpenOrders(SYMBOL_DOTUSDT);
    console.log("Відкриті ордери:", openOrders);

    // Генеруємо ордери через крок у встановленому діапазоні
    for (let buyPrice = MIN_PRICE; buyPrice <= MAX_PRICE; buyPrice += PRICE_STEP) {
      const sellPrice = buyPrice + 0.1;

        // Шукаємо відкритий ордер на купівлю або продаж
        
      const existingBuyOrder = openOrders.find((order) => order.side === "BUY" && Math.round(order.price / 0.001) * 0.001 === Math.round(buyPrice / 0.001) * 0.001);

  
      const existingSellOrder = openOrders.find((order) => order.side === "SELL" && Math.round(order.price/ 0.001) * 0.001 === Math.round(sellPrice / 0.001) * 0.001);

      // Логіка ордерів: або купівля, або продаж
      if (existingBuyOrder) {
        console.log(`Очікуємо виконання ордеру на купівлю за ціною ${buyPrice}.`);
        continue; // Переходимо до наступного кроку, поки ордер не виконається
      }

      if (existingSellOrder) {
        console.log(`Очікуємо виконання ордеру на продаж за ціною ${sellPrice}.`);
        continue; // Переходимо до наступного кроку
      }

      // Якщо немає ордерів, перевіряємо баланс для купівлі
      const DOTNeedBUYMARKET = Math.floor(ORDER_AMOUNT / ask / QUANTITY_PAIR_DOTUSDT) * QUANTITY_PAIR_DOTUSDT;

      if (!existingSellOrder && !existingBuyOrder && buyPrice < ask) {
        console.log(`Створюємо ордер на купівлю за ціною ${buyPrice}.`);
        await createDOTUSDTLimitOrder(
          SYMBOL_DOTUSDT,
          "BUY",
          buyPrice,
          DOTNeedBUYMARKET
        );
      }

      // Перевіряємо баланс DOT для продажу
        const isDOTBalanceEnough = await checkBalance("DOT", DOTNeedBUYMARKET + 100);
        
      if (!existingBuyOrder && !existingSellOrder && isDOTBalanceEnough) {
        console.log(`Створюємо ордер на продаж за ціною ${sellPrice}.`);
        await createDOTUSDTLimitOrder(
          SYMBOL_DOTUSDT,
          "SELL",
          sellPrice,
          DOTNeedBUYMARKET
        );
      }
    }
    console.log(`Усі ордери в діапазоні [${MIN_PRICE}, ${MAX_PRICE}] оброблені.`);
  } catch (error) {
    console.error("Помилка у функції tradingDOTCoin:", error.message);
  }
}

import { log, logError } from "../services/logger.js";
import { getBalances, createOrder } from "../services/binanceAPI.js";

export const getBNBBalance = async () => {
  try {
    // Отримуємо всі баланси
    const balances = await getBalances();

    // Знаходимо баланс BNB
    const bnbBalance = balances.find(balance => balance.asset === 'BNB');

    if (!bnbBalance) {
      logError('BNB баланс не знайдено.');
      return null;
    }

    log(`Баланс BNB: ${bnbBalance.free}`); // free — це вільний баланс
      
      bnbBalance.free; // Повертаємо вільний баланс BNB
      
      if (bnbBalance.free < 0.002) {
        const buyBNBForFee = await createOrder("BNBUSDT", "BUY", 0.02);
      }
  } catch (error) {
    logError(`Помилка при отриманні балансу BNB: ${error.message}`);
    return null;
  }
};
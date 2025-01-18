import { getBalances } from '../services/binanceAPI.js';
import { logError, log } from '../services/logger.js';

export const checkBalance = async (symbol, amount) => {
  try {
    const balances = await getBalances();
    const balance = balances.find((b) => b.asset === symbol);

    if (!balance || parseFloat(balance.free) < amount) {
      throw new Error(`Недостатньо коштів для виконання ордеру: ${symbol}`);
    }

    return true;
  } catch (error) {
    logError(`Помилка при перевірці балансу: ${error.message}`);
    return false;
  }
};

export const checkUSDTBalance = async (capital) => {
  try {
    const balances = await getBalances();

    const usdtBalance = balances.find((b) => b.asset === "USDT");

    if (!usdtBalance || parseFloat(usdtBalance.free) < capital) {
      throw new Error(
        `Недостатньо коштів  USDT для виконання операції: ${capital} USDT потрібні.`
      );
    }

    log(`Баланс для USDT достатній: ${usdtBalance.free}. Операція може бути виконана.`);
    return true;
  } catch (error) {
    logError(`Помилка при перевірці балансу USDT: ${error.message}`);
    return false;
  }
};

export const waitForBalanceUpdate = async (
  symbol,
  expectedAmount,
  retries = 5,
  delay = 2000
) => {
  let attempt = 0;

  // Перевіряємо баланс для конкретного символу
  const checkBalance = async () => {
    const balances = await getBalances();
    const balance = balances.find((b) => b.asset === symbol);
    
    return balance ? parseFloat(balance.free) : 0;
  };

  while (attempt < retries) {
    const currentBalance = await checkBalance();
    
    // Якщо баланс достатній для виконання наступної операції, повертаємо true
    if (currentBalance >= expectedAmount) {
      log(`Баланс для ${symbol} достатній: ${currentBalance}. Операція може бути виконана.`);
      return true;
    }

    log(
      `Баланс для ${symbol} ще не оновлений, спроба ${
        attempt + 1
      } з ${retries}. Поточний баланс: ${currentBalance}, очікувана сума: ${expectedAmount}.`
    );

    attempt++;
    await new Promise((resolve) => setTimeout(resolve, delay)); // Затримка між спробами
  }

  logError(`Баланс для ${symbol} не оновлений після ${retries} спроб. Поточний баланс: ${await checkBalance()}.`);
  return false; // Після кількох спроб баланс не досяг потрібної суми
};

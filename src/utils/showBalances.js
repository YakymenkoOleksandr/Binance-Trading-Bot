import { getBalances } from '../services/binanceAPI.js';
import { logError, log } from '../services/logger.js';

export const checkBalance = async (symbol, amount) => {
  try {
    const balances = await getBalances();
    const balance = balances.find((b) => b.asset === symbol);

    if (!balance || parseFloat(balance.free) < amount) {
      throw new Error(`Недостатньо коштів для виконання ордеру: ${symbol}`);
    }

    log(`Баланс для ${symbol} достатній: ${balance.free} доступно.`);
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
        `Недостатньо коштів USDT для виконання операції: ${capital} USDT потрібні.`
      );
    }

    log(`Баланс USDT достатній: ${usdtBalance.free} доступно.`);
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
  delay = 5000
) => {
  let attempt = 0;
  let initialBalance = 0;

  // Спочатку отримуємо поточний баланс перед покупкою
  const balancesBefore = await getBalances();
  const initialBalanceObj = balancesBefore.find((b) => b.asset === symbol);
  if (initialBalanceObj) {
    initialBalance = parseFloat(initialBalanceObj.free);
  }

  while (attempt < retries) {
    const balances = await getBalances();
    const balance = balances.find((b) => b.asset === symbol);

    if (balance && parseFloat(balance.free) >= (initialBalance + expectedAmount)) {
      log(`Баланс для ${symbol} оновлено: ${balance.free} доступно.`);
      return true; // Баланс оновлено
    }

    log(
      `Баланс для ${symbol} ще не оновлений, спроба ${
        attempt + 1
      } з ${retries}.`
    );
    attempt++;
    await new Promise((resolve) => setTimeout(resolve, delay)); // Затримка між спробами
  }

  logError(`Баланс для ${symbol} не оновлений після ${retries} спроб.`);
  return false; // Після кількох спроб баланс так і не оновився
};

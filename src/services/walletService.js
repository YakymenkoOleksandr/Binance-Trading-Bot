
import binance from './binanceAPI.js';

export const getAccountBalance = async () => {
  try {
    const accountInfo = await binance.get('/api/v3/account'); // Використовуй правильний ендпоінт Binance
    const balances = accountInfo.data.balances.filter(balance => parseFloat(balance.free) > 0);
    return balances;
  } catch (error) {
    console.error('Помилка отримання балансу:', error.message);
    throw error;
  }
};
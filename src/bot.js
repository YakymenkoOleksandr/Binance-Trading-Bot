// src/bot.js
import { connectWebSocket } from './services/websocket.js';
import { calculateArbitrageProfit } from './strategies/arbitrage.js';

// Обробник для отриманих даних
const handlePricesUpdate = (updatedPrices) => {
  // console.log('Оновлені ціни:', updatedPrices);
  // Викликаємо обчислення прибутку для арбітражних пар
  calculateArbitrageProfit(updatedPrices);
};

// Підключаємося до WebSocket
const ws = connectWebSocket(handlePricesUpdate);

export const bot = {
  start: () => {
    console.log('Запуск бота');
    // Тут можна додати подальшу логіку для роботи бота
  }
};
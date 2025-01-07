const bot = require('./src/bot.js');
const { connectWebSocket } = require('./src/services/websocket.js');

// Обробник для отриманих даних
const handlePricesUpdate = (updatedPrices) => {
 // console.log('Оновлені ціни:', updatedPrices);
  // Ви можете зберігати дані в базі даних або виконувати торгові стратегії
};

// Підключаємося до Binance WebSocket
const ws = connectWebSocket(handlePricesUpdate);

// Наприклад, закриваємо WebSocket через 5 хвилин
setTimeout(() => {
  ws.close();
  console.log('WebSocket підключення завершено');
}, 5 * 60 * 1000);

// Запуск торгового бота
bot.start();
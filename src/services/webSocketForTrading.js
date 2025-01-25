// src/services/websocket.js
import { WebSocket } from 'ws';

let prices = {};
let reconnectInterval = 5000;

// Торгові пари
const symbols = ["DOTUSDT"];

// Функція для підключення до Binance WebSocket
export const connectWebSocketForTrading = (onPriceUpdate) => {
  const streams = symbols
    .map((symbol) => `${symbol.toLowerCase()}@bookTicker`)
    .join('/');

  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

  ws.on('open', () => {
    console.log('WebSocket підключено');
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.s && data.b && data.a) {
        // Оновлюємо ціни
        prices[data.s] = {
          bid: parseFloat(data.b),
          ask: parseFloat(data.a),
        };
        onPriceUpdate(prices); // Передаємо оновлені ціни
      } else {
        console.error('Невірні дані від WebSocket:', data);
      }
    } catch (error) {
      console.error('Помилка обробки отриманих даних WebSocket:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket помилка:', error);
  });

  ws.on('close', (code, reason) => {
    console.warn(`WebSocket закрито. Код: ${code}, Причина: ${reason || 'не вказана'}. Спроба перепідключення..`);
    setTimeout(() => connectWebSocket(onPriceUpdate), reconnectInterval); // Автоматичне перепідключення
  });

  return ws;
};
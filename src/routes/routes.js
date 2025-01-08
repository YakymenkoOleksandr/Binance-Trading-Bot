import express from 'express';
import { getAccountBalance } from '../services/walletService.js';

const router = express.Router();

// Маршрут для отримання балансу
router.get('/balance', async (req, res) => {
  try {
    const balances = await getAccountBalance();
    res.json({ success: true, balances });
  } catch (error) {
    console.error('Помилка отримання балансу:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/order', async (req, res) => {
  const { symbol, side, quantity } = req.body;

  try {
    const order = await createOrder(symbol, side, quantity);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Помилка створення ордеру:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/order/status', async (req, res) => {
  const { orderId, symbol } = req.query;

  try {
    const orderStatus = await getOrderStatus(symbol, orderId);
    res.json({ success: true, orderStatus });
  } catch (error) {
    console.error('Помилка отримання статусу ордеру:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
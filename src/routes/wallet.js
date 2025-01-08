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

export default router;
import express from 'express';
import walletRoutes from './routes/routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для обробки JSON
app.use(express.json());

// Підключаємо маршрути
app.use('/api/wallet', walletRoutes);

// Запускаємо сервер
app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});
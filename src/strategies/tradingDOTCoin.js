import { getBidAskPrices, createOrder, getOpenOrders, getAllOrders } from "../services/binanceAPI.js";

export async function tradingDOTCoin() {
    const SYMBOL_DOTUSDT = 'DOTUSDT';
    const STEP_PERCENTAGE = 0.02; // 2%
    const MIN_PRICE = 5.6;
    const MAX_PRICE = 9.6;
    const ORDER_STEP = 0.4;  // Крок ціни для ордерів
    const ORDER_AMOUNT = 20; // Сума ордеру в USDT

    try {
        // Отримуємо bid і ask ціни для DOTUSDT
        const { bid, ask } = await getBidAskPrices(SYMBOL_DOTUSDT);
        if (!bid || !ask) {
            console.log(`Ціна для ${SYMBOL_DOTUSDT} не отримана.`);
            return;
        }

        console.log(`Поточна ціна ${SYMBOL_DOTUSDT}: Bid = ${bid}, Ask = ${ask}`);

        // Якщо поточна ціна поза межами встановленого діапазону, припиняємо виконання
        if (ask < MIN_PRICE || ask > MAX_PRICE) {
            console.log(`Ціна ${ask} поза межами [${MIN_PRICE}, ${MAX_PRICE}]`);
            return;
        }

        // Створюємо ордери на купівлю та продаж в межах діапазону
        const buyOrders = [];
        const sellOrders = [];
        let currentPrice = ask;

        // Отримуємо відкриті ордери
        const openOrders = await getOpenOrders(SYMBOL_DOTUSDT);

        // Створюємо 10 ордерів на купівлю та продаж з кроком ціни 0.4
        for (let i = 0; i < 10; i++) {
            const buyPrice = (currentPrice - ORDER_STEP).toFixed(2);
            const sellPrice = (currentPrice + ORDER_STEP).toFixed(2);

            // Перевіряємо, чи існує вже ордер на покупку або продаж на цих цінах
            const existingBuyOrder = openOrders.find(order => order.side === 'BUY' && order.price === buyPrice);
            const existingSellOrder = openOrders.find(order => order.side === 'SELL' && order.price === sellPrice);

            if (!existingBuyOrder) {
                const buyOrder = await createOrder(SYMBOL_DOTUSDT, 'BUY', buyPrice, ORDER_AMOUNT);
                buyOrders.push(buyOrder);
                console.log(`Створено купівельний ордер за ${buyPrice}`);
            } else {
                console.log(`Ордер на покупку за ${buyPrice} вже існує.`);
            }

            if (!existingSellOrder) {
                const sellOrder = await createOrder(SYMBOL_DOTUSDT, 'SELL', sellPrice, ORDER_AMOUNT);
                sellOrders.push(sellOrder);
                console.log(`Створено продажний ордер за ${sellPrice}`);
            } else {
                console.log(`Ордер на продаж за ${sellPrice} вже існує.`);
            }

            // Оновлюємо поточну ціну для наступного ордеру
            currentPrice = parseFloat(buyPrice);
        }

        // Перевірка виконання ордерів
        while (true) {
            const openOrders = await getOpenOrders(SYMBOL_DOTUSDT);
            const executedSellOrder = openOrders.find(order => order.side === 'SELL' && order.status === 'FILLED');
            const executedBuyOrder = openOrders.find(order => order.side === 'BUY' && order.status === 'FILLED');

            if (executedSellOrder) {
                console.log(`Ордер на продажу виконано за ${executedSellOrder.price}`);

                // Створюємо ордер на купівлю
                const buyPrice = (executedSellOrder.price - ORDER_STEP).toFixed(2);
                const buyOrder = await createOrder(SYMBOL_DOTUSDT, 'BUY', buyPrice, ORDER_AMOUNT);
                console.log(`Створено ордер на купівлю за ${buyPrice}`);

                // Ожидаємо виконання ордера на купівлю
                await waitForBalanceUpdate('USDT', ORDER_AMOUNT);
                console.log('Баланс оновлено. Оновлюємо ордери.');

                // Створюємо ордер на продаж
                const sellPrice = (parseFloat(buyPrice) + ORDER_STEP).toFixed(2);
                const sellOrder = await createOrder(SYMBOL_DOTUSDT, 'SELL', sellPrice, ORDER_AMOUNT);
                console.log(`Створено ордер на продаж за ${sellPrice}`);
            }

            if (executedBuyOrder) {
                console.log(`Ордер на купівлю виконано за ${executedBuyOrder.price}`);

                // Створюємо ордер на продаж
                const sellPrice = (executedBuyOrder.price + ORDER_STEP).toFixed(2);
                const sellOrder = await createOrder(SYMBOL_DOTUSDT, 'SELL', sellPrice, ORDER_AMOUNT);
                console.log(`Створено ордер на продаж за ${sellPrice}`);

                // Ожидаємо виконання ордера на продаж
                await waitForBalanceUpdate('DOT', ORDER_AMOUNT);
                console.log('Баланс оновлено. Оновлюємо ордери.');

                // Створюємо ордер на купівлю
                const buyPrice = (parseFloat(sellPrice) - ORDER_STEP).toFixed(2);
                const buyOrder = await createOrder(SYMBOL_DOTUSDT, 'BUY', buyPrice, ORDER_AMOUNT);
                console.log(`Створено ордер на купівлю за ${buyPrice}`);
            }

            // Додаємо затримку для зменшення навантаження на API
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    } catch (error) {
        console.error("Помилка у функції tradingDOTCoin:", error.message);
    }
}
    

// script.js

document.getElementById('payment-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const withdrawalAddress = document.getElementById('withdrawal-address').value;

    try {
        // Send withdrawal address to backend to initiate the payment
        const response = await fetch('/pay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ withdrawalAddress }),
        });

        const result = await response.json();

        if (result.success) {
            document.getElementById('payment-section').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            checkPrice(); // Start fetching price data
        } else {
            alert('Payment failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});

// Function to check and update Bitcoin price
async function checkPrice() {
    const apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
    const historicalApiUrl = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30'; // Historical data for forecasting

    try {
        const priceResponse = await fetch(apiUrl);
        const priceData = await priceResponse.json();
        const currentPrice = priceData.bitcoin.usd;

        // Display the current price
        document.getElementById('price').innerText = `$${currentPrice}`;

        // Fetch historical data for forecasting
        const historicalResponse = await fetch(historicalApiUrl);
        const historicalData = await historicalResponse.json();
        const prices = historicalData.prices.map(price => price[1]); // Extract price from timestamp

        // Forecasting using moving averages
        const shortTermWindow = 7; // Short-term moving average (e.g., 7 days)
        const longTermWindow = 30; // Long-term moving average (e.g., 30 days)
        const shortTermMA = calculateMovingAverage(prices, shortTermWindow);
        const longTermMA = calculateMovingAverage(prices, longTermWindow);

        const forecastPrice = calculateForecast(prices);
        document.getElementById('forecast').innerText = `Forecasted Price (next day): $${forecastPrice.toFixed(2)}`;

        // Generate signals based on moving average crossover
        const signal = generateSignal(shortTermMA, longTermMA);
        document.getElementById('signal').innerText = `Signal: ${signal}`;

        // Check price change and send notification if needed
        if (localStorage.getItem('lastPrice')) {
            const lastPrice = parseFloat(localStorage.getItem('lastPrice'));
            const threshold = 0.05; // 5% change

            if (Math.abs(currentPrice - lastPrice) / lastPrice > threshold) {
                sendNotification(currentPrice);
            }
        }

        localStorage.setItem('lastPrice', currentPrice);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Function to calculate moving average
function calculateMovingAverage(prices, window) {
    if (prices.length < window) return [];
    let movingAverages = [];
    for (let i = window - 1; i < prices.length; i++) {
        const windowPrices = prices.slice(i - window + 1, i + 1);
        const average = windowPrices.reduce((sum, price) => sum + price, 0) / windowPrices.length;
        movingAverages.push(average);
    }
    return movingAverages;
}

// Function to calculate forecast price (simple average of the last few days)
function calculateForecast(prices) {
    const days = 7;
    const recentPrices = prices.slice(-days);
    const average = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
    return average; // Simple average as the forecast
}

// Function to generate buy/sell signal based on moving average crossover
function generateSignal(shortTermMA, longTermMA) {
    if (shortTermMA.length === 0 || longTermMA.length === 0) return 'Waiting...';

    const shortTermLatest = shortTermMA[shortTermMA.length - 1];
    const longTermLatest = longTermMA[longTermMA.length - 1];

    if (shortTermLatest > longTermLatest) {
        return 'Buy Signal';
    } else if (shortTermLatest < longTermLatest) {
        return 'Sell Signal';
    } else {
        return 'Hold Signal';
    }
}

// Function to send a browser notification
function sendNotification(price) {
    if (Notification.permission === 'granted') {
        new Notification('Bitcoin Price Alert', {
            body: `The Bitcoin price has changed significantly: $${price}`,
            icon: 'assets/notification-icon.png' // Add your notification icon path
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                sendNotification(price);
            }
        });
    }
}

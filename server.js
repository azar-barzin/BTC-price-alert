const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config(); // Load environment variables

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = 3000;

// Access environment variables
const binanceWalletAddress = process.env.BINANCE_WALLET_ADDRESS;
const binanceApiKey = process.env.BINANCE_API_KEY;
const binanceApiSecret = process.env.BINANCE_API_SECRET;

// Function to sign API requests
function signQuery(params) {
    const queryString = new URLSearchParams(params).toString();
    return crypto.createHmac('sha256', binanceApiSecret)
        .update(queryString)
        .digest('hex');
}

// Handle POST request to /pay
app.post('/pay', async (req, res) => {
    const { withdrawalAddress } = req.body;

    if (!withdrawalAddress) {
        return res.status(400).json({ success: false, message: 'Invalid address' });
    }

    try {
        const paymentResult = await makePayment(withdrawalAddress);
        res.json(paymentResult);
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ success: false, message: 'Payment failed' });
    }
});

async function makePayment(withdrawalAddress) {
    try {
        const params = {
            asset: 'USDT',
            amount: 1,
            address: withdrawalAddress,
            timestamp: Date.now()
        };

        const signature = signQuery(params);

        // Mock implementation for demonstration
        // Replace with actual API call to Binance's withdrawal endpoint
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Payment processing error' };
    }
}

// Handle GET request to /price
app.get('/price', async (req, res) => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: 'bitcoin',
                vs_currencies: 'usd'
            }
        });

        const price = response.data.bitcoin.usd;
        res.json({ success: true, price });
    } catch (error) {
        console.error('Error fetching price:', error);
        res.status(500).json({ success: false, message: 'Error fetching price' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

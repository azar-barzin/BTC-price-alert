import axios from 'axios';

export default async function handler(req, res) {
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
}

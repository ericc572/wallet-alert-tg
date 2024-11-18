const axios = require('axios');

const HELIUS_API_KEY = '835277a3-5538-432d-a9d8-81c3c8e55fe1';
const WEBHOOK_URL = 'https://test.com/webhook'; // Replace with your ngrok for now server's URL
const walletAddresses = [
    "HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp",
    "FUY8wjDdQwTkJ58rRC2jsKQofmNP1eHXBxLSQHq5ZX9y",
    "7JqxsZ89cAAzLY7qcZTQ1gkPcnurEaw6QaXr6RG31t1u"
    // Add more wallet addresses here
];

// Function to create a webhook for each wallet
async function createWebhooks() {
    for (const address of walletAddresses) {
        const webhookData = {
            webhookUrl: WEBHOOK_URL,
            accountAddresses: [address],
            transactionTypes: ['ANY'] // Listen for swap and transfer events
        };

        try {
            const response = await axios.post(
                `https://api.helius.xyz/v0/webhooks`,
                webhookData,
                {
                    headers: {
                        'Authorization': `Bearer ${HELIUS_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log(`Webhook created for ${address}:`, response.data);
        } catch (error) {
            console.error(`Error creating webhook for ${address}:`, error);
        }
    }
}

// Call the function to create webhooks for all wallets
createWebhooks();

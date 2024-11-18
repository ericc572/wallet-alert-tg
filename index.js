const { Telegraf } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '7575968174:AAE1_zzirO2-T0szgrCkO_EzNm-HYiPGMR0'; // Your bot token
const GROUP_CHAT_ID = '-1002448827303'; // The chat ID of your group (e.g. -1001234567890 for supergroups)
const HELIUS_API_KEY = 'bd28a336-5882-49fb-9d60-6076c30b403a';

const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
console.log(bot);

const walletMapping = {
    "FUY8wjDdQwTkJ58rRC2jsKQofmNP1eHXBxLSQHq5ZX9y": "eric-test",
    "FYGgfgZFeVxnJKF2RS6MKYHBsUpfJdCwumzkPpxWPM4u": "big-whale",
    "7aSkmM4qDyvXQQaDGhZH6axiGqMq4teioHhm8BXZTjY5": "eric-second-wallet",
    "5Qar6dwzrjKWSXaUZwKNNwv7xuBYMojNwBrZPF7nqK1o": "gm-gn-find",
    "B8CdgWxMFm8vARVjXaR2cngTgAxYz9LJYBdikXHxi4dd": "daniel"
};

// Create Express server
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;

// Webhook endpoint to receive Helius events
app.post('/webhook', async (req, res) => {
    const events = req.body;
    console.log("event received~!", events);
    txData = events[0];
    // console.log(txData.transaction);
    // Check if the event is a SWAP or TRANSFER

    const swapData = txData.events.swap;
    const account = txData.feePayer;
    const description = txData.description;

    if (swapData) {
        console.log("SWAP FOUND!!", swapData);
        bot.telegram.sendMessage(GROUP_CHAT_ID, "FOUND SWAP!!");

        const message = formatHeliusEvent(swapData, account, description);
        console.log(message);
        
        try {
            // Forward the formatted message to the Telegram group
            await bot.telegram.sendMessage(GROUP_CHAT_ID, message);
            console.log('Forwarded event to Telegram:', message);
        } catch (error) {
            console.error('Failed to forward message to Telegram:', error);
        }
    } else if (txData.type == "UNKNOWN") {
        console.log("UNKNOWN EVENT FOUND. Token Transfers:", txData.tokenTransfers);

        try {
            //"7aSkmM4qDyvXQQaDGhZH6axiGqMq4teioHhm8BXZTjY5",
//     "mint": "FDKBUXKxCdNQnDrqP7DLe8Kri3hzFRxcXyoskoPa74rk",
//     "toTokenAccount": "3XFW16F78YURDiN1Q18nhBkMpQLAX97ntSTDDT4NfbbB",
//     "toUserAccount": "GGztQqQ6pCPaJQnNpXBgELr5cs3WwDakRbh1iEMzjgSJ",
//     "tokenAmount": 11000,
//     "tokenStandard": "Fungible"
//   },
            const mintAddress = txData.tokenTransfers[0].mint;
            const amount = txData.tokenTransfers[0].tokenAmount;
            const symbol = await fetchTokenMetadata(mintAddress);

            const message = `UNKNOWN EVENT DETECTED:\nToken Swap: ${amount} of ${mintAddress}: ${symbol}`; 
            await bot.telegram.sendMessage(GROUP_CHAT_ID, message);
            console.log("Forwarded UNKNOWN event to Telegram:", message);
        } catch (error) {
            console.error("Failed to forward UNKNOWN event to Telegram:", error);
        }
    }

    res.status(200).send('Event received');
});

async function fetchTokenMetadata(mintAddress) {
    try {
        const { data } = await axios.post(HELIUS_URL, {
            jsonrpc: '2.0',
            id: 'my-id',
            method: 'getAsset',
            params: {
              id: mintAddress,
              displayOptions: {
                showFungible: true,
              },
            },
          });
        //   console.log("Asset: ", data.result);
          return data.result.token_info.symbol;
        } catch (error) {
        console.error("Error fetching asset: ", error.response?.data || error.message);
    }
};


// Function to format the incoming Helius event into a readable message
function formatHeliusEvent(account, description) {
    const walletLabel = walletMapping[account] || account; // Get the wallet name or fallback to address
    console.log(description);

    // Regular expression to match possible address formats
    const addressRegex = /[a-zA-Z0-9]{32,44}/g; // Matches alphanumeric strings of length 32 to 44

    // Extract all matching addresses
    const matches = description.match(addressRegex);

    if (matches && matches.length > 0) {
        // Get the last address
        const lastAddress = matches[matches.length - 1];
        console.log("Token Address:", lastAddress);

        // Perform a lookup (replace with your actual lookup logic)
        const symbol = fetchTokenMetadata(lastAddress);
        console.log("symbol", symbol);
    } else {
        console.log("No valid addresses found in the description.");
    }

    // Format the description with the wallet label if available
    return `🔔 Event from ${walletLabel}:\n WALLET ${description}: +++++++++++++++++++++++++++ ${symbol} +++++++ https://dexscreener.com/solana/${address}`;
}

// Start the Telegram bot
bot.launch().then(() => {
    console.log('Telegram bot is running...');
    bot.telegram.sendMessage(GROUP_CHAT_ID, "sup u fucking pussies!");
}).catch((err) => {
    console.error('Failed to launch bot:', err);
});;

bot.command('ping', (ctx) => {
    ctx.reply('sup u fucking pussies!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



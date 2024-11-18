const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const EventEmitter = require('events');


const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");

const TELEGRAM_BOT_TOKEN = '7787145504:AAFaY7-4NvZe_QISGIbDuUlx92ndrEfpEEE'; // Your bot token
const GROUP_CHAT_ID = '-1002448827303'; // The chat ID of your group (e.g. -1001234567890 for supergroups)
const HELIUS_API_KEY = '835277a3-5538-432d-a9d8-81c3c8e55fe1';
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const POLL_INTERVAL = 4 * 60 * 1000; // 3 minutes
// const POLL_INTERVAL = 50000;

// Initialize Express App
const app = express();
app.use(bodyParser.json());
const eventEmitter = new EventEmitter();

// Solana Connection
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
console.log(connection);

// Replace with the wallet address you want to monitor
const walletAddress = '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9';
const owner = new PublicKey(walletAddress);

console.log("Eric's test wallet:", owner);

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

bot.launch().then(() => {
  console.log('Telegram bot is running...!');
  bot.telegram.sendMessage(GROUP_CHAT_ID, "sup u fucking pussies!");
}).catch((err) => {
  console.error('Failed to launch bot:', err);
});;
// Track all known accounts for the wallet
const trackedAccounts = new Set();

// Function to fetch all token accounts associated with the wallet
async function fetchAllAccounts() {
  console.log("Fetching token accounts...");
  const response = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  console.log(response);

    // Map each token account to its token name
    const tokenAccounts = await Promise.all(
        response.value.map(async (accountInfo) => {
          const account = accountInfo.pubkey.toBase58();
          const mint = accountInfo.account.data["parsed"]["info"]["mint"];
    
          // Fetch metadata for the token mint
          const tokenName = await fetchTokenMetadata(mint);
    
          return {
            account,
            mint,
            tokenName,
          };
        })
      );

      tokenAccounts.forEach(({ account, mint, tokenName }) => {
        console.log(`Account: ${account}`);
        console.log(`Address: ${mint}`);
        console.log(`Token Name: ${tokenName}`);
        console.log("====================");
      });

  return tokenAccounts;
}

// Monitor wallet for new token accounts
async function monitorAccounts() {
    // Fetch initial accounts and add them to the tracker
    const initialAccounts = await fetchAllAccounts();
    initialAccounts.forEach((accountInfo) => {
      const account = accountInfo.account;
      trackedAccounts.add(accountInfo.tokenName);
    });
  
    console.log('Initial accounts:', Array.from(trackedAccounts));
  
    // Periodically check for new accounts
    setInterval(async () => {
      console.log('Checking for new accounts...');
      const currentAccounts = await fetchAllAccounts();
  
      currentAccounts.forEach((accountInfo) => {
        const account = accountInfo.account;
        const mint = accountInfo.mint;
        const tokenName = accountInfo.tokenName;
  
        if (!trackedAccounts.has(tokenName)) {
          console.log('New token account detected:', tokenName);
          trackedAccounts.add(tokenName);
  
          // Emit an event for the new token account
          eventEmitter.emit('newATA', { account, mint, tokenName });
        }
      });
    }, POLL_INTERVAL);
}

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

// Listener for new ATA events
eventEmitter.on('newATA', ({ account, mint, tokenName }) => {
  const message = `Event Received: New Binance Token Account added - ${tokenName} (${mint}) at https://solscan.io/account/${account}'`
  console.log(message);
  
  bot.telegram.sendMessage(GROUP_CHAT_ID, message);
  console.log('Forwarded event to Telegram:', message);
});
  
  // Start Express server
  app.get('/', (req, res) => {
    res.send('Token Account Monitor is running!');
  });
  
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  
// Start monitoring
monitorAccounts().catch((err) => console.error('Error monitoring accounts:', err));
// Example Usage



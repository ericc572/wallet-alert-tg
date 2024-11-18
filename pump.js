require('dotenv').config();
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { Jupiter, TokenSwapMode } = require('@jup-ag/core');
const bs58 = require('bs58');

// Load the private key from .env
const privateKey = process.env.PRIVATE_KEY; // Base58 private key
if (!privateKey) {
    throw new Error("Missing PRIVATE_KEY in environment variables.");
}

// Decode the private key
const secretKey = bs58.decode(privateKehy);
const wallet = Keypair.fromSecretKey(secretKey);

// Configurations
const RPC_ENDPOINT = "https://mainnet.helius-rpc.com/?api-key=835277a3-5538-432d-a9d8-81c3c8e55fe1"; // Use a reliable RPC endpoint
const connection = new Connection(RPC_ENDPOINT, 'confirmed');

// Token Information
const INPUT_TOKEN_MINT = "So11111111111111111111111111111111111111112"; // SOL Mint Address
const OUTPUT_TOKEN_MINT = process.env.TOKEN_TO_SWAP; // Replace with SPL token mint address

(async () => {
    try {
         // Fetch wallet balance (for testing)
         const balance = await connection.getBalance(wallet.publicKey);
         console.log(`Wallet address: ${wallet.publicKey.toBase58()}`);
         console.log(`Wallet balance: ${balance / 10 ** 9} SOL`);

        // Initialize Jupiter
        const jupiter = await Jupiter.load({
            connection,
            cluster: 'mainnet-beta', // Use 'devnet' for testing
            user: wallet, // Wallet to execute the transaction
        });

        console.log("jupiter connected");
        // Fetch Routes
        console.log("Fetching routes...");
        const inputAmountLamports = Math.floor(0.01 * 10 ** 9); // Convert SOL to lamports

        if (inputAmountLamports <= 0) {
            throw new Error("Invalid input amount. Amount must be greater than zero.");
        }

        const routes = await jupiter.computeRoutes({
            inputMint: new PublicKey(INPUT_TOKEN_MINT),
            outputMint: new PublicKey(OUTPUT_TOKEN_MINT),
            amount: inputAmountLamports,
            slippage: 1, // 1% slippage
            swapMode: TokenSwapMode.ExactIn, // You specify the input amount
        });

        if (!routes || routes.routesInfos.length === 0) {
            throw new Error("No routes found for the swap");
        }

        console.log("Routes found:", routes.routesInfos);

        // Execute Swap
        const bestRoute = routes.routesInfos[0]; // Select the best route
        const { execute } = await jupiter.exchange({
            routeInfo: bestRoute,
        });

        console.log("Executing swap...");
        const swapResult = await execute();
        console.log("Swap completed:", swapResult.txid);

    } catch (error) {
        console.error("Error during token swap:", error);
    }
})();

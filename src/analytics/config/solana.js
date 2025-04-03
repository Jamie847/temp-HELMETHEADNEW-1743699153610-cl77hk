import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Solana connection with fallback and retry logic
function createConnection() {
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  return new Connection(rpcUrl, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
    wsEndpoint: null, // Disable WebSocket
    fetch: async (url, options) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    }
  });
}

// Create connection with retry logic
const connection = createConnection();

// JAN token configuration
const JAN_TOKEN = new PublicKey(process.env.JAN_TOKEN_ADDRESS);

// Treasury wallet configuration
const TREASURY_WALLET = new PublicKey(process.env.SOLANA_TREASURY_ADDRESS);

// Properly decode the treasury secret key from base58
let treasuryKeypair;
try {
  const secretKey = bs58.decode(process.env.SOLANA_TREASURY_SECRET_KEY);
  treasuryKeypair = Keypair.fromSecretKey(secretKey);
  console.log('Treasury keypair initialized successfully');
} catch (error) {
  console.error('Error initializing treasury keypair:', error);
  throw new Error('Invalid treasury secret key format');
}

export async function getJANBalance(walletAddress) {
  try {
    console.log('Checking JAN balance for:', walletAddress);
    const wallet = new PublicKey(walletAddress);
    
    // Get associated token account
    const tokenAccount = await getAssociatedTokenAddress(
      JAN_TOKEN,
      wallet,
      false,
      TOKEN_PROGRAM_ID
    );
    
    try {
      const balance = await connection.getTokenAccountBalance(tokenAccount);
      console.log('Balance retrieved:', balance.value.uiAmount);
      return balance.value.uiAmount;
    } catch (error) {
      if (error.message.includes('could not find account')) {
        console.log('No JAN token account found - balance is 0');
        return 0;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error getting JAN balance:', error);
    return 0;
  }
}

export async function sendJANTokens(fromAddress, toAddress, amount) {
  try {
    console.log(`Initiating transfer of ${amount} JAN tokens...`);
    console.log(`From: ${fromAddress}`);
    console.log(`To: ${toAddress}`);

    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = new PublicKey(toAddress);

    // Only allow transfers from treasury
    if (fromAddress !== TREASURY_WALLET.toString()) {
      throw new Error('Unauthorized transfer source');
    }

    // Get associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      JAN_TOKEN,
      fromPubkey
    );
    
    const toTokenAccount = await getAssociatedTokenAddress(
      JAN_TOKEN,
      toPubkey
    );

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      amount * Math.pow(10, 9) // Convert to raw amount (9 decimals)
    );

    // Create and sign transaction
    const transaction = new Transaction().add(transferInstruction);
    transaction.feePayer = fromPubkey;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    // Sign and send transaction with retries
    const signature = await connection.sendTransaction(
      transaction,
      [treasuryKeypair],
      { skipPreflight: false, preflightCommitment: 'confirmed' }
    );

    // Confirm transaction
    await connection.confirmTransaction(signature);

    console.log('Transfer successful!');
    console.log('Transaction signature:', signature);

    return {
      success: true,
      signature,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error sending JAN tokens:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
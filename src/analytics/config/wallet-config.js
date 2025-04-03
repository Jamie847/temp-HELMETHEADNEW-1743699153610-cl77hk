import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

// Initialize Solana connection with fallback and retry logic
async function initializeConnection() {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  try {
    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });
    // Test connection
    await connection.getVersion();
    return connection;
  } catch (error) {
    console.error('Failed to initialize Solana connection:', error);
    throw error;
  }
}

// Treasury configuration
export const TREASURY_CONFIG = {
  MIN_BALANCE: 10000,
  MAX_TRANSFER: 1000,
  RATE_LIMITS: {
    TRANSFERS_PER_MINUTE: 10,
    TRANSFERS_PER_HOUR: 100,
    COOLDOWN_MINUTES: 60
  }
};

// Enhanced security checks
export async function validateTreasuryStatus() {
  try {
    const connection = await initializeConnection();
    
    if (!process.env.SOLANA_TREASURY_ADDRESS || !process.env.JAN_TOKEN_ADDRESS) {
      throw new Error('Missing required environment variables');
    }

    const treasuryPubkey = new PublicKey(process.env.SOLANA_TREASURY_ADDRESS);
    const tokenPubkey = new PublicKey(process.env.JAN_TOKEN_ADDRESS);

    // Get associated token account
    const tokenAccount = await getAssociatedTokenAddress(
      tokenPubkey,
      treasuryPubkey
    );

    try {
      const balance = await connection.getTokenAccountBalance(tokenAccount);
      
      return {
        isHealthy: balance.value.uiAmount >= TREASURY_CONFIG.MIN_BALANCE,
        balance: balance.value.uiAmount,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      if (error.message.includes('could not find account')) {
        return {
          isHealthy: false,
          balance: 0,
          error: 'Token account not found'
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Treasury validation failed:', error);
    return {
      isHealthy: false,
      error: error.message
    };
  }
}

// Required permissions for token distribution
export const REQUIRED_PERMISSIONS = {
  SOLANA: [
    'TRANSFER_TOKENS',
    'READ_BALANCE',
    'CREATE_ASSOCIATED_ACCOUNT'
  ],
  TWITTER: [
    'TWEET.READ',
    'TWEET.WRITE',
    'USERS.READ',
    'DM.WRITE'
  ]
};

// Initialize treasury wallet with validation
export async function initializeTreasuryWallet() {
  if (!process.env.SOLANA_TREASURY_ADDRESS) {
    throw new Error('Treasury address not configured');
  }
  return new PublicKey(process.env.SOLANA_TREASURY_ADDRESS);
}
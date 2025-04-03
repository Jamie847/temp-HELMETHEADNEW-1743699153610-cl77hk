import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { ethers } from 'ethers';

// Rate limiting configuration
const RATE_LIMITS = {
  TRANSFERS_PER_MINUTE: 10,
  TRANSFERS_PER_HOUR: 100,
  MAX_TOKENS_PER_TRANSFER: 1000,
  COOLDOWN_PERIOD: 3600000 // 1 hour in milliseconds
};

// Security checks for wallet addresses
export async function validateWalletAddress(address) {
  try {
    // Validate Solana address format
    new PublicKey(address);
    
    // Check address isn't blacklisted
    if (BLACKLISTED_ADDRESSES.has(address)) {
      throw new Error('Address is blacklisted');
    }
    
    // Verify address has been active (has SOL balance)
    const connection = new Connection(process.env.SOLANA_RPC_URL);
    const balance = await connection.getBalance(new PublicKey(address));
    if (balance === 0) {
      throw new Error('Address has no SOL balance');
    }
    
    return true;
  } catch (error) {
    console.error('Invalid wallet address:', error);
    return false;
  }
}

// Transaction monitoring
export class TransactionMonitor {
  constructor() {
    this.recentTransfers = new Map();
    this.transferCounts = {
      minutely: 0,
      hourly: 0
    };
    
    // Reset counters periodically
    setInterval(() => this.transferCounts.minutely = 0, 60000);
    setInterval(() => this.transferCounts.hourly = 0, 3600000);
  }
  
  async canTransfer(fromAddress, toAddress, amount) {
    // Check rate limits
    if (this.transferCounts.minutely >= RATE_LIMITS.TRANSFERS_PER_MINUTE) {
      throw new Error('Minute transfer limit reached');
    }
    if (this.transferCounts.hourly >= RATE_LIMITS.TRANSFERS_PER_HOUR) {
      throw new Error('Hour transfer limit reached');
    }
    
    // Check amount limit
    if (amount > RATE_LIMITS.MAX_TOKENS_PER_TRANSFER) {
      throw new Error('Transfer amount exceeds limit');
    }
    
    // Check cooldown period
    const lastTransfer = this.recentTransfers.get(toAddress);
    if (lastTransfer && Date.now() - lastTransfer < RATE_LIMITS.COOLDOWN_PERIOD) {
      throw new Error('Address in cooldown period');
    }
    
    return true;
  }
  
  recordTransfer(toAddress) {
    this.recentTransfers.set(toAddress, Date.now());
    this.transferCounts.minutely++;
    this.transferCounts.hourly++;
  }
}

// Double-spend protection
export class DoubleSpendProtection {
  constructor() {
    this.processedSignatures = new Set();
    this.pendingTransactions = new Map();
  }
  
  async checkTransaction(signature) {
    if (this.processedSignatures.has(signature)) {
      throw new Error('Transaction already processed');
    }
    
    if (this.pendingTransactions.has(signature)) {
      throw new Error('Transaction is pending');
    }
    
    this.pendingTransactions.set(signature, Date.now());
    return true;
  }
  
  confirmTransaction(signature) {
    this.pendingTransactions.delete(signature);
    this.processedSignatures.add(signature);
  }
}

// Treasury balance monitoring
export class TreasuryMonitor {
  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL);
    this.treasuryAddress = new PublicKey(process.env.SOLANA_TREASURY_ADDRESS);
    this.minBalance = 1000; // Minimum JAN balance
  }
  
  async checkTreasuryHealth() {
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        new PublicKey(process.env.JAN_TOKEN_ADDRESS),
        this.treasuryAddress
      );
      
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      
      if (balance.value.uiAmount < this.minBalance) {
        throw new Error('Treasury balance below minimum threshold');
      }
      
      return true;
    } catch (error) {
      console.error('Treasury health check failed:', error);
      return false;
    }
  }
}

// Audit logging
export class AuditLogger {
  constructor() {
    this.logs = [];
  }
  
  logTransfer(from, to, amount, type) {
    const log = {
      timestamp: new Date().toISOString(),
      from,
      to,
      amount,
      type,
      id: ethers.utils.id(Date.now().toString())
    };
    
    this.logs.push(log);
    console.log('Transfer logged:', log);
  }
  
  async getTransferHistory(address) {
    return this.logs.filter(log => 
      log.from === address || log.to === address
    );
  }
}
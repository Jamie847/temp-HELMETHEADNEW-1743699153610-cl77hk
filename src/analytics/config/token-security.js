import { TransactionMonitor, DoubleSpendProtection, TreasuryMonitor, AuditLogger } from './security.js';

// Initialize security components
const transactionMonitor = new TransactionMonitor();
const doubleSpendProtection = new DoubleSpendProtection();
const treasuryMonitor = new TreasuryMonitor();
const auditLogger = new AuditLogger();

export async function secureTokenTransfer(fromAddress, toAddress, amount, type) {
  try {
    // Validate addresses
    if (!await validateWalletAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }
    
    // Check treasury health
    if (!await treasuryMonitor.checkTreasuryHealth()) {
      throw new Error('Treasury health check failed');
    }
    
    // Check rate limits and cooldown
    await transactionMonitor.canTransfer(fromAddress, toAddress, amount);
    
    // Generate transaction signature
    const signature = ethers.utils.id(
      `${fromAddress}${toAddress}${amount}${Date.now()}`
    );
    
    // Check for double-spend
    await doubleSpendProtection.checkTransaction(signature);
    
    // Perform transfer
    const success = await sendJANTokens(fromAddress, toAddress, amount);
    
    if (success) {
      // Record successful transfer
      transactionMonitor.recordTransfer(toAddress);
      doubleSpendProtection.confirmTransaction(signature);
      auditLogger.logTransfer(fromAddress, toAddress, amount, type);
      
      return {
        success: true,
        signature,
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('Transfer failed');
  } catch (error) {
    console.error('Secure transfer failed:', error);
    throw error;
  }
}

export async function getTransferHistory(address) {
  return await auditLogger.getTransferHistory(address);
}

export async function checkTransferEligibility(address, amount) {
  try {
    await transactionMonitor.canTransfer(
      process.env.TREASURY_WALLET,
      address,
      amount
    );
    return true;
  } catch (error) {
    console.error('Transfer eligibility check failed:', error);
    return false;
  }
}
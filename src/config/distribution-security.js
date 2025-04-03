import { TREASURY_CONFIG, validateTreasuryStatus } from './wallet-config.js';
import { secureTokenTransfer } from './token-security.js';

// Enhanced security for token distribution
export class DistributionSecurity {
  constructor() {
    this.lastCheck = null;
    this.distributionEnabled = false;
  }

  async enableDistribution() {
    const status = await validateTreasuryStatus();
    
    if (!status.isHealthy) {
      throw new Error('Treasury health check failed');
    }
    
    this.distributionEnabled = true;
    this.lastCheck = new Date();
    
    return {
      enabled: true,
      timestamp: this.lastCheck.toISOString(),
      treasuryBalance: status.balance
    };
  }

  async validateTransfer(recipientAddress, amount) {
    // Ensure distribution is enabled
    if (!this.distributionEnabled) {
      throw new Error('Token distribution is not enabled');
    }
    
    // Check amount limits
    if (amount > TREASURY_CONFIG.MAX_TRANSFER) {
      throw new Error('Transfer amount exceeds maximum allowed');
    }
    
    // Validate treasury status
    const status = await validateTreasuryStatus();
    if (!status.isHealthy) {
      throw new Error('Treasury health check failed');
    }
    
    return true;
  }

  async processRewardTransfer(recipientAddress, amount, reason) {
    try {
      // Validate transfer
      await this.validateTransfer(recipientAddress, amount);
      
      // Process secure transfer
      return await secureTokenTransfer(
        process.env.SOLANA_TREASURY_ADDRESS,
        recipientAddress,
        amount,
        reason
      );
    } catch (error) {
      console.error('Reward transfer failed:', error);
      throw error;
    }
  }
}
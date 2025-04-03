import { getJANBalance, sendJANTokens } from '../config/solana.js';
import { secureTokenTransfer } from '../config/token-security.js';
import { DistributionSecurity } from '../config/distribution-security.js';

export class TokenDistributor {
  constructor() {
    this.security = new DistributionSecurity();
    this.rewardTiers = {
      SHARE: 500,          // Share HH content
      PREDICTION_WIN: {
        FIRST: 1000,
        SECOND: 750,
        THIRD: 500
      },
      ENGAGEMENT: 100      // High engagement post
    };
  }

  async initialize() {
    await this.security.enableDistribution();
    await this.checkTreasuryBalance();
  }

  async checkTreasuryBalance() {
    const balance = await getJANBalance(process.env.SOLANA_TREASURY_ADDRESS);
    if (balance < 10000) { // Minimum required balance
      throw new Error('Treasury balance too low');
    }
    return balance;
  }

  async distributeReward(recipientAddress, amount, reason) {
    try {
      // Validate the transfer
      await this.security.validateTransfer(recipientAddress, amount);

      // Process the secure transfer
      const result = await secureTokenTransfer(
        process.env.SOLANA_TREASURY_ADDRESS,
        recipientAddress,
        amount,
        reason
      );

      console.log(`Distributed ${amount} JAN to ${recipientAddress} for ${reason}`);
      return result;
    } catch (error) {
      console.error('Reward distribution failed:', error);
      throw error;
    }
  }

  async processShareReward(userAddress) {
    return this.distributeReward(
      userAddress, 
      this.rewardTiers.SHARE,
      'content_share'
    );
  }

  async processPredictionReward(userAddress, position) {
    const amount = this.rewardTiers.PREDICTION_WIN[position];
    return this.distributeReward(
      userAddress,
      amount,
      'prediction_win'
    );
  }

  async processEngagementReward(userAddress) {
    return this.distributeReward(
      userAddress,
      this.rewardTiers.ENGAGEMENT,
      'high_engagement'
    );
  }
}
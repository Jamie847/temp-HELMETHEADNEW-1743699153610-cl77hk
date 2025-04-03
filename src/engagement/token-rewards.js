import { TokenStrategy } from '../tokenomics/strategy.js';
import { getJANBalance, sendJANTokens } from '../config/solana.js';

export class TokenRewards {
  constructor() {
    this.strategy = TokenStrategy;
  }

  async processEngagement(type, userAddress, content) {
    try {
      // Verify user holds minimum required JAN
      const balance = await getJANBalance(userAddress);
      if (balance < 100) {
        console.log(`User ${userAddress} doesn't meet minimum JAN requirement`);
        return;
      }

      // Calculate reward based on engagement type
      const reward = this.calculateReward(type, content);
      if (reward > 0) {
        await sendJANTokens(
          process.env.TREASURY_WALLET,
          userAddress,
          reward
        );

        console.log(`Rewarded ${reward} JAN to ${userAddress} for ${type}`);
      }
    } catch (error) {
      console.error('Error processing engagement reward:', error);
    }
  }

  calculateReward(type, content) {
    const base = this.strategy.REWARD_TIERS.ENGAGEMENT[type] || 0;
    let multiplier = 1;

    // Viral multiplier based on engagement
    if (content.likes > 1000 || content.retweets > 500) {
      multiplier = 3;
    } else if (content.likes > 500 || content.retweets > 250) {
      multiplier = 2;
    }

    return base * multiplier;
  }

  async checkVIPStatus(userAddress) {
    return await this.strategy.UTILITY.checkVIPStatus(userAddress);
  }
}
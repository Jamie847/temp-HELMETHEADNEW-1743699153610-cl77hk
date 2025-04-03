import { TokenStrategy } from '../tokenomics/strategy.js';
import { sendJANTokens } from '../config/solana.js';
import { PERSONALITY_TRAITS } from '../config/personality.js';

// ... [previous code remains unchanged until processNewFollower function]

async processNewFollower(userId) {
  try {
    if (this.processedUsers.has(userId)) {
      return;
    }

    // Get user details
    const user = await this.twitter.v2.user(userId, {
      'user.fields': ['public_metrics']
    });

    // Send welcome DM with wallet collection
    await this.twitter.v2.sendDM({
      recipient_id: userId,
      text: `🏈 Welcome to the Helmet Head community! You've earned 500 $JAN tokens!\n\nTo claim:\n1. Reply with your Solana wallet address\n2. Share our profile to earn 500 more tokens!`
    });

    this.processedUsers.add(userId);
  } catch (error) {
    console.error('Error processing new follower:', error);
  }
}

// ... [rest of the file remains unchanged]
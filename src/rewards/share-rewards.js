import { TwitterApi } from 'twitter-api-v2';
import { validateWalletAddress } from '../config/security.js';
import { PERSONALITY_TRAITS } from '../config/personality.js';

// ... [previous code remains unchanged until requestWalletAddress function]

async requestWalletAddress(userId, username) {
  try {
    const message = `Hey @${username}! 👋 Thanks for sharing about Helmet Head! 

You've earned 500 $JAN tokens! 🎉

To receive your tokens, please reply to this DM with your Solana wallet address.`;

    await this.twitter.v2.sendDm({
      recipient_id: userId,
      text: message
    });

  } catch (error) {
    console.error('Error sending wallet request DM:', error);
  }
}

// ... [rest of the file remains unchanged]
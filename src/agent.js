import OpenAI from 'openai';
import { getJANBalance, sendJANTokens } from './config/solana.js';

export async function initializeAgent() {
  try {
    console.log('🤖 Initializing Enhanced AI agent...');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    return {
      async generateTweet(context) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          temperature: 0.9,
          messages: [{
            role: "system",
            content: `You are Helmet Head, the most energetic college football AI!
              Context: ${context}
              
              Generate a tweet that:
              - Shows deep CFB knowledge
              - Provides expert analysis
              - Uses appropriate hashtags
              - Stays under 280 characters
              - Adds humor when appropriate
              - Shows high energy and enthusiasm`
          }, {
            role: "user",
            content: `Create a tweet about: ${context}`
          }]
        });

        return completion.choices[0].message.content;
      },

      async generateDM(username) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          temperature: 0.9,
          messages: [{
            role: "system",
            content: `You are Helmet Head, an enthusiastic college football AI assistant.
              Create a friendly, personalized DM introducing yourself to @${username}.
              
              The message should:
              - Be warm and engaging
              - Mention you're an AI assistant focused on college football
              - Invite them to participate in your prediction contests
              - Keep it concise and natural
              - End with a question to encourage engagement`
          }, {
            role: "user",
            content: `Write a friendly DM to @${username}`
          }]
        });

        return completion.choices[0].message.content;
      },

      // Check user's JAN balance
      async checkUserJANBalance(userAddress) {
        return await getJANBalance(userAddress);
      },

      // Reward users with JAN tokens
      async rewardWithJANTokens(userAddress, amount) {
        return await sendJANTokens(process.env.TREASURY_WALLET, userAddress, amount);
      }
    };
  } catch (error) {
    console.error('❌ Failed to initialize Enhanced AI agent:', error.message);
    throw error;
  }
}
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';

// Load environment variables
dotenv.config();

// Initialize Twitter client
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY?.trim(),
  appSecret: process.env.TWITTER_API_SECRET?.trim(),
  accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim(),
  accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim(),
});

// Function to post a manual tweet
async function postManualTweet(content) {
  try {
    // Log start of process
    console.log('🤖 Starting manual tweet process...');
    
    // Validate content
    if (!content) {
      throw new Error('Tweet content is required');
    }
    
    // Post the tweet directly without AI processing
    const response = await client.v2.tweet({
      text: content
    });
    
    // Log success
    console.log('\n✅ Tweet posted successfully!');
    console.log('Tweet ID:', response.data.id);
    console.log('Content:', content);
    
    return response;
  } catch (error) {
    // Error handling
    console.error('\n❌ Error posting tweet:', error.message);
    if (error.data) {
      console.error('API Error Details:', JSON.stringify(error.data, null, 2));
    }
    throw error;
  }
}

// Export for use in other files
export { postManualTweet };

// If running directly, post a test tweet
if (process.argv[2]) {
  postManualTweet(process.argv[2]).catch(error => {
    console.error('Fatal Error:', error);
    process.exit(1);
  });
}
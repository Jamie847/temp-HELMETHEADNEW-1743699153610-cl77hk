import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY?.trim(),
  appSecret: process.env.TWITTER_API_SECRET?.trim(),
  accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim(),
  accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim(),
});

async function verifyTwitterAccess() {
  try {
    console.log('Verifying Twitter API access...');
    
    // Check app settings
    const appSettings = await client.v2.get('users/me');
    console.log('\nApp Settings:', JSON.stringify(appSettings, null, 2));
    
    // Try to post a test tweet first
    console.log('\nTesting tweet creation...');
    const testTweet = await client.v2.tweet('Test tweet - will be deleted');
    console.log('Test tweet created successfully:', testTweet.data.id);
    
    // Delete test tweet
    await client.v2.deleteTweet(testTweet.data.id);
    console.log('Test tweet deleted successfully');
    
    // Now try to create a test poll
    console.log('\nTesting poll creation...');
    const pollTweet = await client.v2.tweet({
      text: 'Test poll - will be deleted',
      poll: {
        duration_minutes: 5,
        options: ['Option 1', 'Option 2']
      }
    });
    console.log('Test poll created successfully:', pollTweet.data.id);
    
    // Delete test poll
    await client.v2.deleteTweet(pollTweet.data.id);
    console.log('Test poll deleted successfully');
    
    console.log('\n✅ All functionality verified successfully!');
  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    if (error.data) {
      console.error('API Error Details:', JSON.stringify(error.data, null, 2));
    }
    throw error;
  }
}

verifyTwitterAccess().catch(error => {
  console.error('Final Error:', error);
  process.exit(1);
});
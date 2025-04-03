import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function checkRateLimit() {
  try {
    const response = await client.v2.get('rate_limit');
    const tweetsEndpoint = response?.data?.resources?.tweets?.['/2/tweets'];
    
    if (tweetsEndpoint) {
      const resetTime = new Date(tweetsEndpoint.reset * 1000);
      console.log('\nRate Limit Status:');
      console.log('----------------');
      console.log(`Remaining requests: ${tweetsEndpoint.remaining}`);
      console.log(`Reset time: ${resetTime.toLocaleString()}`);
      console.log(`Time until reset: ${Math.ceil((resetTime - new Date()) / 1000)} seconds`);
    } else {
      console.log('Unable to fetch rate limit information');
    }
  } catch (error) {
    console.error('Error checking rate limit:', error);
  }
}

checkRateLimit();
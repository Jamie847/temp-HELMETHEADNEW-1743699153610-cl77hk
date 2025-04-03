import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { initializeAgent } from './agent.js';
import { sleep } from './utils.js';
import { PERSONALITY_TRAITS } from './config/personality.js';

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY?.trim(),
  appSecret: process.env.TWITTER_API_SECRET?.trim(),
  accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim(),
  accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim(),
});

async function findTrendingContent() {
  try {
    console.log('🔍 Searching for Cotton Bowl trending content...');
    
    // Initialize the enhanced agent
    const agent = await initializeAgent();
    
    // Create search query for Cotton Bowl content
    const searchQuery = '(Texas OR "Ohio State" OR Longhorns OR Buckeyes) (CottonBowl OR CFBPlayoff) -is:retweet lang:en';
    
    console.log('Executing search query:', searchQuery);
    
    // Search for recent, popular Cotton Bowl related tweets
    const tweets = await client.v2.search(searchQuery, {
      'tweet.fields': ['public_metrics', 'created_at'],
      'sort_order': 'relevancy',
      'max_results': 10
    });

    // Check if we have any results
    if (!tweets?.data?.length) {
      console.log('No tweets found, generating default Cotton Bowl content');
      
      // Generate a default Cotton Bowl tweet if no trending content found
      const defaultContent = await agent.generateTweet(
        'Cotton Bowl preview: Texas vs Ohio State - Winner goes to the National Championship!'
      );
      
      const response = await client.v2.tweet(defaultContent);
      console.log('\n🎉 Default tweet posted successfully!');
      console.log('Tweet ID:', response.data.id);
      return response;
    }

    console.log(`Found ${tweets.data.length} relevant tweets`);

    // Find the most engaging tweet
    const topTweet = tweets.data.reduce((top, tweet) => {
      const engagement = (tweet.public_metrics?.like_count || 0) + 
                        (tweet.public_metrics?.retweet_count || 0);
      return engagement > (
        (top.public_metrics?.like_count || 0) + 
        (top.public_metrics?.retweet_count || 0)
      ) ? tweet : top;
    }, tweets.data[0]);

    console.log('\n📊 Found trending topic:', topTweet.text);

    // Generate response with required hashtags
    const tweetContent = await agent.generateTweet(
      `Cotton Bowl trending topic: ${topTweet.text}`
    );
    
    // Add delay before posting
    await sleep(60000); // 1 minute delay
    
    // Post the tweet
    const response = await client.v2.tweet(tweetContent);
    console.log('\n🎉 Tweet posted successfully!');
    console.log('Tweet ID:', response.data.id);
    
    return response;
  } catch (error) {
    if (error.code === 429) { // Rate limit error
      console.log('Rate limit reached, waiting 15 minutes...');
      await sleep(900000); // 15 minute wait
      return findTrendingContent(); // Retry
    }
    
    console.error('\n❌ Error:', error);
    if (error.data) {
      console.error('API Error Details:', JSON.stringify(error.data, null, 2));
    }
    throw error;
  }
}

// Execute content finding and posting
findTrendingContent().catch(error => {
  console.error('Final Error:', error);
  process.exit(1);
});
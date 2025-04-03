import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN, 
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function checkRecentTweets() {
  try {
    console.log('Checking recent tweets...');
    
    const tweets = await client.v2.userTimeline(process.env.TWITTER_ACCESS_TOKEN.split('-')[0], {
      exclude: ['retweets', 'replies'],
      'tweet.fields': ['created_at'],
      max_results: 5
    });
    
    if (tweets.data && tweets.data.length > 0) {
      console.log('\nMost recent tweets:');
      tweets.data.forEach(tweet => {
        const date = new Date(tweet.created_at);
        console.log(`\n[${date.toLocaleString()}]`);
        console.log(tweet.text);
      });
    } else {
      console.log('No tweets found in the last few hours');
    }
  } catch (error) {
    console.error('Error checking tweets:', error);
  }
}

checkRecentTweets();
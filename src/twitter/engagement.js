import { TwitterApi } from 'twitter-api-v2';
import { sleep } from '../utils.js';

// Basic Plan Rate Limits
const RATE_LIMITS = {
  TWEETS_PER_HOUR: 50,
  TWEETS_PER_MONTH: 3000,
  TWEET_READS_PER_MONTH: 50000,
  DMS_PER_MONTH: 300
};

// Conservative engagement settings
const ENGAGEMENT_DELAY = 300000; // 5 minutes between engagements
const MAX_ENGAGEMENTS_PER_HOUR = 30; // Keep well under the 50/hour limit

// Monthly tracking
let monthlyTweetCount = 0;
let monthlyReadCount = 0;
let lastMonthReset = new Date();

// Focused list of key accounts to monitor
const INFLUENTIAL_ACCOUNTS = [
  'CFBPlayoff',
  'Brett_McMurphy',
  'PeteThamel',
  'ESPNCollegeFB'
];

export async function strategicEngage(client) {
  try {
    // Reset monthly counters if needed
    const now = new Date();
    if (now.getMonth() !== lastMonthReset.getMonth()) {
      monthlyTweetCount = 0;
      monthlyReadCount = 0;
      lastMonthReset = now;
    }

    // Check monthly limits
    if (monthlyTweetCount >= RATE_LIMITS.TWEETS_PER_MONTH) {
      console.log('Monthly tweet limit reached. Waiting for next month.');
      return;
    }

    if (monthlyReadCount >= RATE_LIMITS.TWEET_READS_PER_MONTH) {
      console.log('Monthly read limit reached. Waiting for next month.');
      return;
    }

    let engagementCount = 0;
    console.log('Starting strategic engagement within Basic plan limits...');

    // Search for CFP-related tweets
    const cfpTweets = await client.v2.search(
      'CFBPlayoff OR (playoff AND football) -is:retweet', {
      'tweet.fields': ['public_metrics', 'created_at'],
      max_results: 10 // Reduced to conserve read limit
    });
    monthlyReadCount += 10;

    if (cfpTweets.data) {
      for (const tweet of cfpTweets.data) {
        if (engagementCount >= MAX_ENGAGEMENTS_PER_HOUR) break;
        
        try {
          await client.v2.like(tweet.id);
          engagementCount++;
          monthlyTweetCount++;
          await sleep(ENGAGEMENT_DELAY);
        } catch (error) {
          console.error('Error liking tweet:', error);
        }
      }
    }

    console.log(`Engagement cycle complete. Monthly stats:
      Tweets: ${monthlyTweetCount}/${RATE_LIMITS.TWEETS_PER_MONTH}
      Reads: ${monthlyReadCount}/${RATE_LIMITS.TWEET_READS_PER_MONTH}`);
  } catch (error) {
    console.error('Strategic engagement error:', error);
  }
}
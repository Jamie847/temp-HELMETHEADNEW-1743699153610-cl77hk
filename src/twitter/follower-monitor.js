import { TwitterApi } from 'twitter-api-v2';
import { AirdropManager } from '../rewards/airdrop.js';

export async function monitorFollowers(client) {
  const airdropManager = new AirdropManager(client);

  try {
    console.log('Setting up follower monitoring...');

    const stream = await client.v2.searchStream({
      'tweet.fields': ['referenced_tweets', 'author_id'],
      'expansions': ['referenced_tweets.id']
    });

    // Monitor new followers and shares
    stream.on('data', async tweet => {
      try {
        // Check for profile shares
        if (tweet.text.toLowerCase().includes('@helmethead')) {
          await airdropManager.processProfileShare(tweet.author_id, tweet.id);
        }
      } catch (error) {
        console.error('Error processing stream data:', error);
      }
    });

    // Monitor new followers (poll every 5 minutes)
    setInterval(async () => {
      try {
        const followers = await client.v2.followers(process.env.TWITTER_USER_ID);
        for (const follower of followers.data || []) {
          await airdropManager.processNewFollower(follower.id);
        }
      } catch (error) {
        console.error('Error checking followers:', error);
      }
    }, 300000);

  } catch (error) {
    console.error('Error setting up follower monitoring:', error);
  }
}
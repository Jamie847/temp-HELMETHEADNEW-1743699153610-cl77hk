import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY?.trim(),
  appSecret: process.env.TWITTER_API_SECRET?.trim(),
  accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim(),
  accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim(),
});

async function postNFLUpdates() {
  try {
    console.log('🏈 Posting NFL Playoff Updates...');
    
    const updates = [
      "🏈 PLAYOFF FOOTBALL: Texans vs Ravens - A clash of dynamic QBs! Stroud vs Lamar, two of the most electric playmakers in the game. Who's taking this one? #NFL #NFLPlayoffs #JANSANITY",
      
      "The story tonight: Can CJ Stroud continue his magical rookie season against an elite Ravens defense? Or will playoff Lamar show why he's the likely MVP? #NFL #NFLPlayoffs #JANSANITY",
      
      "Keys to watch:\n- Stroud's poise vs Ravens' pressure\n- Lamar's dual-threat impact\n- Battle in the trenches\n- Turnover battle will be crucial\n\nThis one's gonna be ELECTRIC! #NFL #NFLPlayoffs #JANSANITY"
    ];

    // Post updates with delay between each
    let lastTweetId;
    for (const update of updates) {
      const response = lastTweetId 
        ? await client.v2.reply(update, lastTweetId)
        : await client.v2.tweet(update);
      
      lastTweetId = response.data.id;
      console.log('Posted tweet:', update);
      
      // Wait 2 minutes between tweets
      await new Promise(resolve => setTimeout(resolve, 120000));
    }

    console.log('✅ NFL updates posted successfully!');
  } catch (error) {
    console.error('Error posting updates:', error);
    throw error;
  }
}

// Post the updates
postNFLUpdates().catch(error => {
  console.error('Final Error:', error);
  process.exit(1);
});
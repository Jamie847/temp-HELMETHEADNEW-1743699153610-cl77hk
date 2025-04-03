import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { initializeAgent } from './agent.js';
import { sleep } from './utils.js';
import { getGameStats, getPlayByPlay, scrapeGameUpdates } from './data/game-sources.js';

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY?.trim(),
  appSecret: process.env.TWITTER_API_SECRET?.trim(),
  accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim(),
  accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim(),
});

// Track game state
let lastScore = { home: 0, away: 0 };
let lastBigPlay = '';
let tweetCount = 0;
const MAX_TWEETS_PER_HOUR = 15; // Conservative limit for Basic tier

async function postUpdate(context, forceUpdate = false) {
  try {
    // Check tweet limits
    if (tweetCount >= MAX_TWEETS_PER_HOUR && !forceUpdate) {
      console.log('Tweet limit reached for this hour');
      return;
    }

    const agent = await initializeAgent();
    const tweetText = await agent.generateTweet(context);
    await client.v2.tweet(tweetText);
    
    console.log('Posted update:', context);
    tweetCount++;
    
    // Reset counter after an hour
    setTimeout(() => tweetCount--, 3600000);
    
    // Minimum 5 minute delay between tweets
    await sleep(300000);
  } catch (error) {
    console.error('Error posting update:', error);
  }
}

async function monitorGame(gameId) {
  console.log('Starting enhanced game monitoring...');
  
  while (true) {
    try {
      // Get updates from multiple sources
      const [gameStats, playByPlay, espnUpdates] = await Promise.all([
        getGameStats(gameId),
        getPlayByPlay(gameId),
        scrapeGameUpdates()
      ]);

      // Process game stats
      if (gameStats) {
        const currentScore = {
          home: gameStats.homeScore,
          away: gameStats.awayScore
        };

        // Post score update if changed
        if (currentScore.home !== lastScore.home || 
            currentScore.away !== lastScore.away) {
          await postUpdate(`Score Update: ${gameStats.homeTeam} ${currentScore.home} - ${gameStats.awayTeam} ${currentScore.away}`);
          lastScore = currentScore;
        }
      }

      // Process play by play for big plays
      if (playByPlay) {
        const latestPlay = playByPlay.plays[playByPlay.plays.length - 1];
        if (latestPlay && latestPlay.text !== lastBigPlay) {
          if (latestPlay.isBigPlay) {
            await postUpdate(`Big Play: ${latestPlay.text}`, true);
            lastBigPlay = latestPlay.text;
          }
        }
      }

      // Process ESPN updates
      if (espnUpdates.length > 0) {
        for (const update of espnUpdates) {
          if (update.isSignificant) {
            await postUpdate(`Game Update: ${update.description}`);
          }
        }
      }

      // Wait 30 seconds before next check
      await sleep(30000);
    } catch (error) {
      console.error('Error in game monitoring:', error);
      await sleep(60000); // Wait a minute on error
    }
  }
}

async function startCoverage(gameId) {
  try {
    console.log('Starting enhanced Orange Bowl coverage...');
    
    // Initial game preview
    const gameStats = await getGameStats(gameId);
    if (gameStats) {
      await postUpdate('Game Preview: ' + JSON.stringify(gameStats.preview));
    }
    
    // Start continuous monitoring
    await monitorGame(gameId);
  } catch (error) {
    console.error('Coverage error:', error);
    process.exit(1);
  }
}

// Start the coverage with game ID
startCoverage('401520337'); // Orange Bowl game ID
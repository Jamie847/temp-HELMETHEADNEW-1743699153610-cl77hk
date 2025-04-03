import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import fetch from 'node-fetch';

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY?.trim(),
  appSecret: process.env.TWITTER_API_SECRET?.trim(),
  accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim(),
  accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim(),
});

// Game state tracking
let lastScore = { home: 0, away: 0 };
let lastPlay = '';
let lastQuarter = 1;
let lastDrive = null;
let lastTweetTime = Date.now();
let tweetCount = 0;

// Rate limiting
const TWEET_DELAY = 120000; // 2 minutes between tweets
const MAX_TWEETS_PER_HOUR = 15;
const RATE_LIMIT_RESET = 3600000; // 1 hour in ms

async function fetchGameData(gameId) {
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`,
      {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data?.gameInfo?.status) {
      throw new Error('Invalid game data format');
    }

    return {
      score: {
        home: parseInt(data.boxscore.teams[0].score) || 0,
        away: parseInt(data.boxscore.teams[1].score) || 0
      },
      teams: {
        home: data.boxscore.teams[0].team.name,
        away: data.boxscore.teams[1].team.name
      },
      quarter: data.gameInfo.period.number,
      clock: data.gameInfo.clock.displayValue,
      status: data.gameInfo.status.type.name,
      lastPlay: data.drives?.current?.plays?.slice(-1)[0] || null,
      currentDrive: data.drives?.current || null,
      redZone: data.situation?.isRedZone || false
    };
  } catch (error) {
    console.error('Error fetching game data:', error);
    return null;
  }
}

async function postTweet(text) {
  try {
    // Rate limit checks
    if (Date.now() - lastTweetTime < TWEET_DELAY) {
      console.log('Rate limit: Too soon since last tweet');
      return false;
    }

    if (tweetCount >= MAX_TWEETS_PER_HOUR) {
      console.log('Rate limit: Hourly tweet limit reached');
      return false;
    }

    // Ensure tweet length is valid
    const finalText = text.length > 280 ? text.substring(0, 277) + '...' : text;

    console.log('Posting tweet:', finalText);
    await client.v2.tweet(finalText);
    
    lastTweetTime = Date.now();
    tweetCount++;

    // Reset tweet count after an hour
    setTimeout(() => tweetCount--, RATE_LIMIT_RESET);

    return true;
  } catch (error) {
    console.error('Error posting tweet:', error);
    return false;
  }
}

function shouldTweet(gameData) {
  if (!gameData) return false;

  const scoreChanged = 
    gameData.score.home !== lastScore.home || 
    gameData.score.away !== lastScore.away;

  const quarterChanged = gameData.quarter !== lastQuarter;

  const bigPlay = gameData.lastPlay && (
    gameData.lastPlay.scoringPlay ||
    gameData.lastPlay.yards >= 20 ||
    gameData.lastPlay.turnover ||
    (gameData.redZone && gameData.lastPlay.yards > 0)
  );

  const newDrive = gameData.currentDrive?.id !== lastDrive?.id;

  return {
    shouldPost: scoreChanged || quarterChanged || bigPlay || newDrive,
    reason: {
      scoreChanged,
      quarterChanged,
      bigPlay,
      newDrive
    }
  };
}

async function monitorGame(gameId) {
  console.log(`Starting NFL game monitoring for game ${gameId}...`);
  
  let consecutiveErrors = 0;
  const MAX_ERRORS = 5;

  while (true) {
    try {
      const gameData = await fetchGameData(gameId);

      if (!gameData) {
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_ERRORS) {
          throw new Error('Too many consecutive errors');
        }
        await new Promise(resolve => setTimeout(resolve, 60000));
        continue;
      }

      consecutiveErrors = 0;

      const { shouldPost, reason } = shouldTweet(gameData);
      
      if (shouldPost) {
        let tweetText = '';

        if (reason.scoreChanged) {
          tweetText = `${gameData.teams.away} ${gameData.score.away}, ${gameData.teams.home} ${gameData.score.home} - ${gameData.quarter}Q ${gameData.clock}`;
        } else if (reason.bigPlay && gameData.lastPlay) {
          tweetText = gameData.lastPlay.text;
        } else if (reason.quarterChanged) {
          tweetText = `End of Q${lastQuarter}. ${gameData.teams.away} ${gameData.score.away}, ${gameData.teams.home} ${gameData.score.home}`;
        }

        if (tweetText) {
          tweetText += ' #NFL #NFLPlayoffs';
          await postTweet(tweetText);
        }

        // Update tracking variables
        lastScore = gameData.score;
        lastQuarter = gameData.quarter;
        lastPlay = gameData.lastPlay?.id;
        lastDrive = gameData.currentDrive;
      }

      if (gameData.status === 'STATUS_FINAL') {
        const finalText = `FINAL: ${gameData.teams.away} ${gameData.score.away}, ${gameData.teams.home} ${gameData.score.home} #NFL #NFLPlayoffs`;
        await postTweet(finalText);
        break;
      }

      // Check every 30 seconds
      await new Promise(resolve => setTimeout(resolve, 30000));
    } catch (error) {
      console.error('Error in game monitoring:', error);
      break;
    }
  }
}

// Start monitoring (replace with actual game ID)
const GAME_ID = '401547796'; // Replace with actual NFL playoff game ID
monitorGame(GAME_ID);
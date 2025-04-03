import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { verifyGameData } from './data/game-verification.js';
import { sleep } from './utils.js';

// Twitter Basic API Limits
const API_LIMITS = {
  TWEETS_PER_HOUR: 50,
  TWEETS_PER_DAY: 200,
  TWEET_READS_PER_MONTH: 50000,
  SEARCH_REQUESTS_PER_MONTH: 60000,
  MIN_TWEET_INTERVAL: 300000 // 5 minutes in milliseconds
};

export class GameMonitor {
  constructor(twitterClient, openaiClient) {
    this.twitter = twitterClient;
    this.openai = openaiClient;
    this.activeGames = new Map();
    this.lastTweetTime = Date.now();
    this.tweetCount = 0;
    this.dailyTweetCount = 0;
    this.monthlyReadCount = 0;
    this.monthlySearchCount = 0;
    this.MAX_TWEETS_PER_HOUR = Math.min(10, API_LIMITS.TWEETS_PER_HOUR / 5); // Conservative limit
    
    // Reset counters
    this.initializeCounterResets();

    // Important game IDs
    this.upcomingGames = {
      NFL_PLAYOFFS: ['401547796', '401547797', '401547798'],
      CFB_CHAMPIONSHIP: ['401547799']
    };
  }

  initializeCounterResets() {
    // Reset hourly tweet count
    setInterval(() => {
      this.tweetCount = 0;
    }, 3600000);

    // Reset daily tweet count
    setInterval(() => {
      this.dailyTweetCount = 0;
    }, 86400000);

    // Reset monthly counters
    setInterval(() => {
      this.monthlyReadCount = 0;
      this.monthlySearchCount = 0;
    }, 2592000000);
  }

  async startMonitoring() {
    console.log('Starting rate-limited game monitoring...');
    
    // Stagger monitoring intervals to prevent API spikes
    setTimeout(() => this.monitorPreGameContent(), 0);
    setTimeout(() => this.monitorGameUpdates(), 30000);
    setTimeout(() => this.monitorSocialReactions(), 60000);
  }

  async monitorPreGameContent() {
    setInterval(async () => {
      try {
        if (this.canMakeAPIRequest()) {
          for (const [league, gameIds] of Object.entries(this.upcomingGames)) {
            for (const gameId of gameIds) {
              const gameData = await verifyGameData(gameId);
              
              if (gameData && this.shouldPostPreGame(gameData)) {
                const content = await this.generatePreGameContent(gameData, league);
                await this.postUpdate(content);
                await sleep(API_LIMITS.MIN_TWEET_INTERVAL);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in pre-game monitoring:', error);
      }
    }, 3600000); // Check every hour instead of 30 minutes
  }

  async monitorGameUpdates() {
    setInterval(async () => {
      try {
        if (this.canMakeAPIRequest()) {
          for (const [league, gameIds] of Object.entries(this.upcomingGames)) {
            for (const gameId of gameIds) {
              const gameData = await verifyGameData(gameId);
              
              if (gameData?.status === 'in_progress') {
                const lastState = this.activeGames.get(gameId);
                if (this.shouldPostUpdate(gameData, lastState)) {
                  const content = await this.generateGameUpdate(gameData, league);
                  await this.postUpdate(content);
                  this.activeGames.set(gameId, {
                    score: gameData.score,
                    quarter: gameData.quarter,
                    lastPlay: gameData.lastPlay
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in game updates:', error);
      }
    }, 300000); // Check every 5 minutes instead of every minute
  }

  async monitorSocialReactions() {
    setInterval(async () => {
      try {
        if (this.canMakeAPIRequest() && this.canMakeSearchRequest()) {
          const tweets = await this.twitter.v2.search(
            '(NFL Playoffs OR CFBPlayoff) (from:AdamSchefter OR from:RapSheet OR from:Brett_McMurphy OR from:PeteThamel)', {
            'tweet.fields': ['public_metrics'],
            'max_results': 5 // Reduced from 10 to conserve rate limits
          });

          this.monthlySearchCount++;
          this.monthlyReadCount += tweets?.data?.length || 0;

          if (tweets?.data) {
            for (const tweet of tweets.data) {
              if (this.isSignificantUpdate(tweet)) {
                const response = await this.generateReaction(tweet);
                await this.postUpdate(response);
                await sleep(API_LIMITS.MIN_TWEET_INTERVAL);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in social monitoring:', error);
      }
    }, 900000); // Check every 15 minutes instead of 5
  }

  canMakeAPIRequest() {
    return (
      this.tweetCount < this.MAX_TWEETS_PER_HOUR &&
      this.dailyTweetCount < API_LIMITS.TWEETS_PER_DAY &&
      Date.now() - this.lastTweetTime >= API_LIMITS.MIN_TWEET_INTERVAL
    );
  }

  canMakeSearchRequest() {
    return (
      this.monthlySearchCount < API_LIMITS.SEARCH_REQUESTS_PER_MONTH &&
      this.monthlyReadCount < API_LIMITS.TWEET_READS_PER_MONTH
    );
  }

  // ... [previous helper methods remain unchanged] ...

  async postUpdate(content) {
    try {
      if (!this.canMakeAPIRequest()) {
        console.log('Rate limit reached, skipping update');
        return;
      }

      await this.twitter.v2.tweet(content);
      this.lastTweetTime = Date.now();
      this.tweetCount++;
      this.dailyTweetCount++;
      
      console.log(`Tweet posted. Counts - Hour: ${this.tweetCount}, Day: ${this.dailyTweetCount}`);
    } catch (error) {
      console.error('Error posting update:', error);
    }
  }
}
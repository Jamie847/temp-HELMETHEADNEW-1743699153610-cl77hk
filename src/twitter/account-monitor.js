import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { PERSONALITY_TRAITS } from '../config/personality.js';
import { EventEmitter } from 'events';

const INFLUENTIAL_ACCOUNTS = {
  NFL: [
    'AdamSchefter',
    'RapSheet',
    'TomPelissero',
    'NFLNetwork'
  ],
  COLLEGE: [
    'Brett_McMurphy',
    'PeteThamel',
    'CFBPlayoff',
    'ESPNCollegeFB'
  ],
  NETWORKS: [
    'ESPN',
    'CBSSports',
    'FOXSports',
    'NBCSports'
  ]
};

export class AccountMonitor extends EventEmitter {
  constructor(twitterClient, openaiClient) {
    super();
    this.twitter = twitterClient;
    this.openai = openaiClient;
    this.lastTweetTime = Date.now();
    this.lastLikeTime = Date.now();
    this.lastRetweetTime = Date.now();
    this.tweetCount = 0;
    this.likeCount = 0;
    this.retweetCount = 0;
    this.MAX_TWEETS_PER_HOUR = 15;
    this.MAX_LIKES_PER_HOUR = 20;
    this.MAX_RETWEETS_PER_HOUR = 5;
    this.processedTweets = new Set();
    this.LIKE_COOLDOWN = 180000;
    this.RETWEET_COOLDOWN = 900000;
    this.TWEET_COOLDOWN = 300000;
    this.isInitialized = false;
  }

  async startMonitoring() {
    try {
      console.log('Starting account monitoring...');

      // Verify Twitter API access first
      try {
        await this.twitter.v2.me();
        this.isInitialized = true;
      } catch (error) {
        if (error.code === 403) {
          console.log('Twitter API access not properly configured. Account monitoring disabled.');
          return;
        }
        throw error;
      }

      if (!this.isInitialized) return;

      // Monitor followed accounts every 5 minutes
      setInterval(async () => {
        try {
          await this.monitorFollowedAccounts();
        } catch (error) {
          if (error.code === 403) {
            console.log('Twitter API permission error - skipping followed accounts check');
          } else {
            console.error('Error monitoring followed accounts:', error);
          }
        }
      }, 300000);

      // Monitor influential accounts every 10 minutes
      setInterval(async () => {
        try {
          await this.monitorInfluentialAccounts();
        } catch (error) {
          if (error.code === 403) {
            console.log('Twitter API permission error - skipping influential accounts check');
          } else {
            console.error('Error monitoring influential accounts:', error);
          }
        }
      }, 600000);

    } catch (error) {
      console.error('Error in account monitoring:', error);
    }
  }

  async monitorFollowedAccounts() {
    try {
      const following = await this.twitter.v2.following(process.env.TWITTER_USER_ID, {
        max_results: 100
      });

      if (!following?.data) {
        console.log('No followed accounts found');
        return;
      }

      for (const user of following.data) {
        try {
          const tweets = await this.twitter.v2.userTimeline(user.id, {
            max_results: 5,
            'tweet.fields': ['public_metrics', 'created_at'],
            exclude: ['replies', 'retweets']
          });

          if (tweets?.data) {
            for (const tweet of tweets.data) {
              await this.processFollowedTweet(tweet);
            }
          }

          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          console.error(`Error processing user ${user.username}:`, error);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async monitorInfluentialAccounts() {
    try {
      const query = this.buildInfluentialQuery();
      
      const tweets = await this.twitter.v2.search(query, {
        'tweet.fields': ['public_metrics', 'created_at', 'author_id'],
        'user.fields': ['username'],
        'expansions': ['author_id'],
        'max_results': 10
      });

      if (!tweets?.data) {
        console.log('No new tweets found from influential accounts');
        return;
      }

      for (const tweet of tweets.data || []) {
        try {
          await this.processInfluentialTweet(tweet, tweets.includes?.users);
        } catch (error) {
          console.error('Error processing influential tweet:', error);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  buildInfluentialQuery() {
    const allAccounts = [
      ...INFLUENTIAL_ACCOUNTS.NFL,
      ...INFLUENTIAL_ACCOUNTS.COLLEGE,
      ...INFLUENTIAL_ACCOUNTS.NETWORKS
    ];
    return `(${allAccounts.map(account => `from:${account}`).join(' OR ')}) -is:retweet`;
  }

  async processFollowedTweet(tweet) {
    try {
      if (this.processedTweets.has(tweet.id)) return;

      const metrics = tweet.public_metrics || {};
      const isFootballRelated = this.isFootballContent(tweet.text);

      if (isFootballRelated) {
        if (this.canLike() && metrics.like_count > 20) {
          await this.twitter.v2.like(process.env.TWITTER_USER_ID, tweet.id);
          this.likeCount++;
          this.lastLikeTime = Date.now();
        }

        if (this.canRetweet() && metrics.like_count > 100) {
          await this.twitter.v2.retweet(process.env.TWITTER_USER_ID, tweet.id);
          this.retweetCount++;
          this.lastRetweetTime = Date.now();
        }

        this.processedTweets.add(tweet.id);
      }
    } catch (error) {
      console.error('Error processing followed tweet:', error);
    }
  }

  async processInfluentialTweet(tweet, users) {
    try {
      if (this.processedTweets.has(tweet.id)) return;

      const metrics = tweet.public_metrics || {};
      const isSignificant = metrics.like_count > 100 || metrics.retweet_count > 50;

      if (isSignificant && this.canTweet()) {
        const author = users?.find(u => u.id === tweet.author_id);
        const response = await this.generateResponse(tweet, author);
        
        if (response) {
          const postedTweet = await this.twitter.v2.tweet(response);
          this.emit('tweet', postedTweet);
          this.updateTweetTracking();
        }

        if (this.canLike()) {
          await this.twitter.v2.like(process.env.TWITTER_USER_ID, tweet.id);
          this.likeCount++;
          this.lastLikeTime = Date.now();
        }

        this.processedTweets.add(tweet.id);
      }
    } catch (error) {
      console.error('Error processing influential tweet:', error);
    }
  }

  isFootballContent(text) {
    const keywords = [
      'NFL', 'football', 'touchdown', 'quarterback', 'CFB', 'NCAA',
      'playoff', 'bowl game', 'CFBPlayoff', 'NFLPlayoffs'
    ];
    return keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  canLike() {
    return (
      Date.now() - this.lastLikeTime >= this.LIKE_COOLDOWN &&
      this.likeCount < this.MAX_LIKES_PER_HOUR
    );
  }

  canRetweet() {
    return (
      Date.now() - this.lastRetweetTime >= this.RETWEET_COOLDOWN &&
      this.retweetCount < this.MAX_RETWEETS_PER_HOUR
    );
  }

  canTweet() {
    return (
      Date.now() - this.lastTweetTime >= this.TWEET_COOLDOWN &&
      this.tweetCount < this.MAX_TWEETS_PER_HOUR
    );
  }

  updateTweetTracking() {
    this.tweetCount++;
    this.lastTweetTime = Date.now();
    setTimeout(() => this.tweetCount--, 3600000);
  }

  async generateResponse(tweet, author) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        temperature: 0.9,
        messages: [{
          role: "system",
          content: `You are Helmet Head, an expert football analyst AI.
            
            Original tweet from ${author?.username}: ${tweet.text}
            
            Create an insightful response that:
            1. Shows deep understanding of the news/topic
            2. Provides unique analysis or perspective
            3. Uses proper football terminology
            4. Stays under 240 characters
            5. Maintains professional tone
            6. Do not add any default hashtags`
        }]
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      return null;
    }
  }
}
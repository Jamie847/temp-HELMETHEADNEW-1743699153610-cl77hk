import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { sleep } from '../utils.js';
import { PERSONALITY_TRAITS } from '../config/personality.js';
import { EventEmitter } from 'events';

// Enhanced growth strategy configuration
const GROWTH_CONFIG = {
  ENGAGEMENT_WINDOWS: {
    WEEKDAY: [14, 15, 16, 17, 18, 19, 20, 21], // Peak hours (EST)
    WEEKEND: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
  },
  
  ENGAGEMENT_LIMITS: {
    HOURLY_TWEETS: 10,
    HOURLY_LIKES: 50,  // Increased from 20
    HOURLY_REPLIES: 30, // Increased from 15
    MIN_TWEET_INTERVAL: 600000, // 10 minutes
    MIN_ENGAGEMENT_INTERVAL: 120000 // Reduced to 2 minutes
  },

  // Expanded target communities
  TARGET_COMMUNITIES: [
    'CFBPlayoff',
    'SEC',
    'Big12Conference',
    'Big10Conference',
    'pac12',
    'accfootball',
    'NFLDraft',
    'NFLPlayoffs',
    'CryptoTwitter',
    'Web3Football',
    'NIL',
    'CFBRecruiting'
  ],

  // High-engagement hashtags
  ENGAGEMENT_HASHTAGS: [
    'CFB',
    'CollegeFootball',
    'NFLDraft',
    'NFLPlayoffs',
    'CryptoTwitter',
    'Web3',
    'JANSANITY',
    'NIL'
  ],

  // Expanded influencer list
  INFLUENCERS: {
    ANALYSTS: [
      'Brett_McMurphy',
      'PeteThamel',
      'BruceFeldmanCFB',
      'AdamSchefter',
      'RapSheet'
    ],
    MEDIA: [
      'ESPNCFB',
      'CBSSportsCFB',
      'FOXSports',
      'BleacherReport',
      'TheAthletic'
    ],
    CRYPTO: [
      'CryptoXfootball',
      'Web3Sports',
      'NILDeals',
      'SportsCrypto'
    ]
  }
};

export class FollowerGrowthStrategy extends EventEmitter {
  constructor(twitterClient, openaiClient) {
    super();
    this.twitter = twitterClient;
    this.openai = openaiClient;
    this.metrics = {
      startingFollowers: 0,
      currentFollowers: 0,
      dailyGrowth: [],
      engagementStats: new Map(),
      successfulContent: new Set()
    };
    this.lastEngagementTime = new Map();
    this.processedTweets = new Set();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      const user = await this.twitter.v2.me();
      this.metrics.startingFollowers = user.data.public_metrics.followers_count;
      this.metrics.currentFollowers = this.metrics.startingFollowers;
      this.isInitialized = true;
      
      // Start tracking metrics
      this.startMetricsTracking();
      
      console.log('Follower growth strategy initialized');
      console.log(`Starting followers: ${this.metrics.startingFollowers}`);
    } catch (error) {
      console.error('Error initializing follower strategy:', error);
    }
  }

  async startGrowthStrategy() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('Starting enhanced follower growth strategy...');

    // Run multiple growth tactics in parallel
    await Promise.all([
      this.monitorInfluencerConversations(),
      this.engageWithTargetCommunities(),
      this.runContentStrategy(),
      this.trackGrowthMetrics(),
      this.engageWithCryptoNILCommunity() // New method for crypto/NIL engagement
    ]);
  }

  async monitorInfluencerConversations() {
    const allInfluencers = [
      ...GROWTH_CONFIG.INFLUENCERS.ANALYSTS,
      ...GROWTH_CONFIG.INFLUENCERS.MEDIA,
      ...GROWTH_CONFIG.INFLUENCERS.TEAMS
    ];

    while (true) {
      try {
        if (this.isInEngagementWindow()) {
          const query = `(${allInfluencers.map(user => `from:${user}`).join(' OR ')}) -is:retweet`;
          
          const tweets = await this.twitter.v2.search(query, {
            'tweet.fields': ['public_metrics', 'created_at'],
            'user.fields': ['username'],
            'max_results': 20
          });

          if (tweets?.data) {
            for (const tweet of tweets.data) {
              if (await this.shouldEngageWithTweet(tweet)) {
                await this.engageWithTweet(tweet);
                await sleep(GROWTH_CONFIG.ENGAGEMENT_LIMITS.MIN_ENGAGEMENT_INTERVAL);
              }
            }
          }
        }
        await sleep(300000); // Check every 5 minutes
      } catch (error) {
        console.error('Error monitoring influencers:', error);
        await sleep(900000); // Wait 15 minutes on error
      }
    }
  }

  async engageWithTargetCommunities() {
    while (true) {
      try {
        if (this.isInEngagementWindow()) {
          for (const community of GROWTH_CONFIG.TARGET_COMMUNITIES) {
            const tweets = await this.twitter.v2.search(
              `#${community} -is:retweet has:mentions`, // Removed min_faves operator
              {
                'tweet.fields': ['public_metrics', 'created_at'],
                'user.fields': ['username', 'public_metrics'],
                'max_results': 10
              }
            );

            if (tweets?.data) {
              for (const tweet of tweets.data) {
                // Only engage with tweets that have significant engagement
                const metrics = tweet.public_metrics || {};
                if (metrics.like_count >= 50) {
                  if (await this.shouldEngageWithTweet(tweet)) {
                    await this.engageWithTweet(tweet);
                    await sleep(GROWTH_CONFIG.ENGAGEMENT_LIMITS.MIN_ENGAGEMENT_INTERVAL);
                  }
                }
              }
            }
            await sleep(60000); // 1 minute between communities
          }
        }
        await sleep(900000); // Check every 15 minutes
      } catch (error) {
        console.error('Error engaging with communities:', error);
        await sleep(900000);
      }
    }
  }

  async runContentStrategy() {
    while (true) {
      try {
        if (this.isInEngagementWindow() && this.canTweet()) {
          const contentTypes = [
            'analysis',
            'prediction',
            'stats',
            'discussion'
          ];

          const type = contentTypes[Math.floor(Math.random() * contentTypes.length)];
          const tweet = await this.generateStrategicContent(type);
          
          const postedTweet = await this.twitter.v2.tweet(tweet);
          this.emit('tweet', postedTweet);
          this.trackContentPerformance(postedTweet.data.id, type);
          
          await sleep(GROWTH_CONFIG.ENGAGEMENT_LIMITS.MIN_TWEET_INTERVAL);
        }
        await sleep(600000); // Check every 10 minutes
      } catch (error) {
        console.error('Error in content strategy:', error);
        await sleep(900000);
      }
    }
  }

  async trackGrowthMetrics() {
    while (true) {
      try {
        const user = await this.twitter.v2.me();
        const currentFollowers = user.data.public_metrics.followers_count;
        
        // Calculate daily growth
        const growth = currentFollowers - this.metrics.currentFollowers;
        this.metrics.dailyGrowth.push({
          date: new Date().toISOString(),
          growth,
          total: currentFollowers
        });

        // Keep only last 30 days
        if (this.metrics.dailyGrowth.length > 30) {
          this.metrics.dailyGrowth.shift();
        }

        this.metrics.currentFollowers = currentFollowers;
        
        // Log growth metrics
        console.log('\nGrowth Metrics:');
        console.log(`Total Followers: ${currentFollowers}`);
        console.log(`Daily Growth: ${growth}`);
        console.log(`30-Day Growth: ${this.calculate30DayGrowth()}`);
        
        await sleep(86400000); // Check once per day
      } catch (error) {
        console.error('Error tracking metrics:', error);
        await sleep(3600000); // Retry after an hour
      }
    }
  }

  async engageWithCryptoNILCommunity() {
    while (true) {
      try {
        if (this.isInEngagementWindow()) {
          const query = '(NIL OR "Name Image Likeness" OR CryptoTwitter OR Web3) (football OR CFB OR NFL) -is:retweet';
          
          const tweets = await this.twitter.v2.search(query, {
            'tweet.fields': ['public_metrics', 'created_at'],
            'user.fields': ['username'],
            'max_results': 20
          });

          if (tweets?.data) {
            for (const tweet of tweets.data) {
              if (await this.shouldEngageWithTweet(tweet)) {
                const response = await this.generateCryptoNILResponse(tweet);
                if (response) {
                  const postedTweet = await this.twitter.v2.reply(response, tweet.id);
                  this.emit('tweet', postedTweet);
                  await sleep(GROWTH_CONFIG.ENGAGEMENT_LIMITS.MIN_ENGAGEMENT_INTERVAL);
                }
              }
            }
          }
        }
        await sleep(300000); // Check every 5 minutes
      } catch (error) {
        console.error('Error in crypto/NIL engagement:', error);
        await sleep(900000);
      }
    }
  }

  async generateCryptoNILResponse(tweet) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        temperature: 0.9,
        messages: [{
          role: "system",
          content: `You are Helmet Head, bridging football and crypto communities.
            
            Original tweet: ${tweet.text}
            
            Create a response that:
            - Connects football analysis with crypto/NIL relevance
            - Mentions $JAN token utility where relevant
            - Shows deep understanding of both spaces
            - Encourages community engagement
            - Stays under 240 characters
            - Uses both football and crypto terminology naturally
            - Do not add any default hashtags`
        }]
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating crypto/NIL response:', error);
      return null;
    }
  }

  async shouldEngageWithTweet(tweet) {
    if (this.processedTweets.has(tweet.id)) return false;
    
    const metrics = tweet.public_metrics || {};
    const engagementScore = 
      (metrics.like_count || 0) +
      (metrics.retweet_count || 0) * 2 +
      (metrics.reply_count || 0) * 3;

    return engagementScore > 100;
  }

  async engageWithTweet(tweet) {
    try {
      const response = await this.generateResponse(tweet);
      if (response) {
        const postedTweet = await this.twitter.v2.reply(response, tweet.id);
        this.emit('tweet', postedTweet);
        this.processedTweets.add(tweet.id);
        this.trackEngagement('reply', tweet.id);
      }
    } catch (error) {
      console.error('Error engaging with tweet:', error);
    }
  }

  async generateStrategicContent(type) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.9,
      messages: [{
        role: "system",
        content: `Create a highly engaging tweet about college football (${type}).
          
          Guidelines:
          - Show deep football knowledge
          - Be controversial but professional
          - Encourage discussion and debate
          - Use data and stats when relevant
          - Keep it under 240 characters
          - Make it shareable
          - Target football enthusiasts
          
          Content type: ${type}`
      }]
    });

    return completion.choices[0].message.content;
  }

  isInEngagementWindow() {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    return isWeekend ? 
      GROWTH_CONFIG.ENGAGEMENT_WINDOWS.WEEKEND.includes(hour) :
      GROWTH_CONFIG.ENGAGEMENT_WINDOWS.WEEKDAY.includes(hour);
  }

  canTweet() {
    const lastTweet = this.lastEngagementTime.get('tweet') || 0;
    return Date.now() - lastTweet >= GROWTH_CONFIG.ENGAGEMENT_LIMITS.MIN_TWEET_INTERVAL;
  }

  trackEngagement(type, tweetId) {
    this.lastEngagementTime.set(type, Date.now());
    
    const stats = this.metrics.engagementStats.get(type) || {
      count: 0,
      successful: 0
    };
    
    stats.count++;
    this.metrics.engagementStats.set(type, stats);
  }

  async trackContentPerformance(tweetId, type) {
    // Check tweet performance after 1 hour
    await sleep(3600000);
    
    try {
      const tweet = await this.twitter.v2.tweet(tweetId, {
        'tweet.fields': ['public_metrics']
      });
      
      const metrics = tweet.data.public_metrics;
      if (metrics.like_count > 50 || metrics.retweet_count > 20) {
        this.metrics.successfulContent.add({
          id: tweetId,
          type,
          metrics
        });
      }
    } catch (error) {
      console.error('Error tracking content performance:', error);
    }
  }

  calculate30DayGrowth() {
    if (this.metrics.dailyGrowth.length === 0) return 0;
    
    const totalGrowth = this.metrics.dailyGrowth.reduce(
      (sum, day) => sum + day.growth, 0
    );
    
    return totalGrowth;
  }
}
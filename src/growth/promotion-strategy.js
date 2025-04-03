import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';

export class RewardsPromotionStrategy {
  constructor(twitterClient, openaiClient) {
    this.twitter = twitterClient;
    this.openai = openaiClient;
    this.lastEngagementTime = new Map();
    
    // Target communities for promotion
    this.targetCommunities = [
      'CFBPlayoff',
      'SEC',
      'Big12Conference',
      'Big10Conference',
      'pac12',
      'accfootball'
    ];

    // Relevant hashtags for maximum visibility
    this.promotionHashtags = [
      'CFB',
      'CFBPlayoff',
      'CollegeFootball',
      'CFBTwitter',
      'NIL',
      'CryptoTwitter',
      'Web3'
    ];
  }

  async startPromotion() {
    console.log('Starting rewards program promotion...');

    // Run promotion strategies in parallel
    await Promise.all([
      this.engageWithCFBDiscussions(),
      this.targetNILConversations(),
      this.monitorCryptoDiscussions(),
      this.postRegularPromotions()
    ]);
  }

  async engageWithCFBDiscussions() {
    try {
      // Monitor high-engagement CFB discussions
      const stream = await this.twitter.v2.searchStream({
        'tweet.fields': ['public_metrics', 'created_at'],
        expansions: ['author_id']
      });

      stream.on('data', async tweet => {
        const metrics = tweet.public_metrics || {};
        const isEngaging = metrics.like_count > 50 || metrics.retweet_count > 20;

        if (isEngaging) {
          const completion = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            temperature: 0.8,
            messages: [{
              role: "system",
              content: \`Create a reply that naturally promotes our rewards program:
                Original tweet: ${tweet.text}
                
                Key points to include:
                - Share Helmet Head content for 500 $JAN tokens
                - Hold tokens for exclusive predictions & rewards
                - Join the community for CFB analysis
                
                Keep it natural and relevant to the discussion.
                End with #CFB #JANSANITY\`
            }]
          });

          await this.twitter.v2.reply(completion.choices[0].message.content, tweet.id);
        }
      });
    } catch (error) {
      console.error('Error in CFB engagement:', error);
    }
  }

  async targetNILConversations() {
    setInterval(async () => {
      try {
        const nilTweets = await this.twitter.v2.search(
          '(NIL OR "Name Image Likeness") (college football OR CFB) -is:retweet', {
          'tweet.fields': ['public_metrics'],
          'max_results': 10
        });

        for (const tweet of nilTweets.data || []) {
          const completion = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            temperature: 0.8,
            messages: [{
              role: "system",
              content: \`Create a reply connecting NIL discussion to our rewards program:
                Original tweet: ${tweet.text}
                
                Key points:
                - Connect NIL to crypto/token rewards
                - Mention community benefits
                - Highlight prediction contests
                
                Keep it relevant to NIL discussion.
                End with #NIL #JANSANITY\`
            }]
          });

          await this.twitter.v2.reply(completion.choices[0].message.content, tweet.id);
          await new Promise(resolve => setTimeout(resolve, 300000)); // 5 min delay
        }
      } catch (error) {
        console.error('Error in NIL targeting:', error);
      }
    }, 1800000); // Run every 30 minutes
  }

  async monitorCryptoDiscussions() {
    setInterval(async () => {
      try {
        const cryptoTweets = await this.twitter.v2.search(
          '(crypto OR web3) (sports OR betting OR predictions) -is:retweet', {
          'tweet.fields': ['public_metrics'],
          'max_results': 10
        });

        for (const tweet of cryptoTweets.data || []) {
          const completion = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            temperature: 0.8,
            messages: [{
              role: "system",
              content: \`Create a reply promoting our program to crypto users:
                Original tweet: ${tweet.text}
                
                Key points:
                - $JAN token utility in CFB predictions
                - Share-to-earn mechanics
                - Community-driven project
                
                Keep it crypto-native friendly.
                End with #CryptoTwitter #JANSANITY\`
            }]
          });

          await this.twitter.v2.reply(completion.choices[0].message.content, tweet.id);
          await new Promise(resolve => setTimeout(resolve, 300000)); // 5 min delay
        }
      } catch (error) {
        console.error('Error in crypto monitoring:', error);
      }
    }, 2700000); // Run every 45 minutes
  }

  async postRegularPromotions() {
    setInterval(async () => {
      try {
        const promotionTypes = [
          'Share-to-earn announcement',
          'Prediction contest preview',
          'Community benefits highlight',
          'Token utility explanation'
        ];

        const type = promotionTypes[Math.floor(Math.random() * promotionTypes.length)];
        
        const completion = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          temperature: 0.9,
          messages: [{
            role: "system",
            content: \`Create a promotional tweet about: ${type}
              
              Key points:
              - Share HH content = 500 $JAN tokens
              - Token holders get exclusive access
              - Join prediction contests
              - Be part of CFB's first AI community
              
              Include relevant hashtags.
              End with #CFB #CryptoTwitter #JANSANITY\`
          }]
        });

        await this.twitter.v2.tweet(completion.choices[0].message.content);
      } catch (error) {
        console.error('Error posting promotion:', error);
      }
    }, 14400000); // Post every 4 hours
  }
}
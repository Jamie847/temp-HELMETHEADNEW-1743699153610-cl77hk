import { TokenRewards } from '../engagement/token-rewards.js';
import { PredictionContests } from '../predictions/contests.js';

export async function enhancedInteractions(client, agent) {
  const rewards = new TokenRewards();
  const contests = new PredictionContests(client);

  try {
    console.log('Setting up enhanced Twitter interactions with JAN rewards...');

    const stream = await client.v2.searchStream({
      'tweet.fields': ['referenced_tweets', 'public_metrics', 'context_annotations'],
      'expansions': ['referenced_tweets.id', 'author_id']
    });

    stream.on('data', async tweet => {
      try {
        // Skip retweets
        if (tweet.referenced_tweets?.some(ref => ref.type === 'retweeted')) {
          return;
        }

        // Process predictions if tweet is a reply to a contest
        if (tweet.referenced_tweets?.some(ref => ref.type === 'replied_to')) {
          const contestTweet = tweet.referenced_tweets.find(ref => ref.type === 'replied_to');
          if (contests.activeContests.has(contestTweet.id)) {
            await contests.processPrediction(tweet.author_id, contestTweet.id, parsePrediction(tweet.text));
          }
        }

        // Process engagement rewards
        const metrics = tweet.public_metrics || {};
        if (metrics.like_count > 100 || metrics.retweet_count > 50) {
          await rewards.processEngagement('VIRAL_POST', tweet.author_id, metrics);
        }

        // Generate AI response with JAN token context
        const response = await agent.generateResponse(tweet.text, 'crypto-enhanced');
        await client.v2.reply(response, tweet.id);

      } catch (error) {
        console.error('Error processing tweet:', error);
      }
    });

  } catch (error) {
    console.error('Error setting up enhanced interactions:', error);
  }
}

function parsePrediction(text) {
  // Extract score prediction from tweet text
  const scorePattern = /(\d+)[- ](\d+)/;
  const match = text.match(scorePattern);
  if (match) {
    return {
      home: parseInt(match[1]),
      away: parseInt(match[2])
    };
  }
  return null;
}
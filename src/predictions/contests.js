import { TokenStrategy } from '../tokenomics/strategy.js';
import { EngagementRewards } from '../engagement/rewards.js';
import { TwitterApi } from 'twitter-api-v2';
import { PERSONALITY_TRAITS } from '../config/personality.js';

// ... [previous code remains unchanged until createGamePredictionContest function]

async createGamePredictionContest(game) {
  const contestId = `${game.id}-${Date.now()}`;
  
  // Create prediction poll tweet
  const pollTweet = await this.twitter.v2.tweet({
    text: `🏈 PREDICTION CONTEST! Win $JAN tokens!\n\nWho wins ${game.homeTeam} vs ${game.awayTeam}?\n\nRules:\n- Must hold min 100 $JAN\n- Reply with exact score\n- Top 3 most accurate win!\n\n1st: 1000 $JAN\n2nd: 750 $JAN\n3rd: 500 $JAN`,
    poll: {
      duration_minutes: 1440, // 24 hours
      options: [game.homeTeam, game.awayTeam]
    }
  });

  this.activeContests.set(contestId, {
    tweetId: pollTweet.data.id,
    game,
    predictions: new Map(),
    endTime: Date.now() + 86400000 // 24 hours
  });

  return pollTweet;
}

// ... [rest of the file remains unchanged]
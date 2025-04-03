// JAN coin branding configuration
export const JAN_ASSETS = {
  website: 'www.jansanitycoin.com',
  logo: '/assets/jan-logo.png',
  hashtag: '#JANSANITY',
  tokenSymbol: '$JAN'
};

// Rewards program configuration
export const REWARDS_CONFIG = {
  shareReward: 500, // Tokens for sharing content
  minHolding: 100,  // Minimum tokens for predictions
  predictionRewards: {
    first: 1000,
    second: 750,
    third: 500
  }
};

// Social copy templates
export const SOCIAL_TEMPLATES = {
  shareToEarn: `Share Helmet Head content to earn ${REWARDS_CONFIG.shareReward} $JAN tokens! 🏈💰\n\nVisit ${JAN_ASSETS.website} to learn more!\n\n#CFB #JANSANITY`,
  
  predictionContest: `🏈 PREDICTION CONTEST!\nPrize pool:\n1st: ${REWARDS_CONFIG.predictionRewards.first} $JAN\n2nd: ${REWARDS_CONFIG.predictionRewards.second} $JAN\n3rd: ${REWARDS_CONFIG.predictionRewards.third} $JAN\n\nMust hold ${REWARDS_CONFIG.minHolding}+ $JAN to participate!\n\n${JAN_ASSETS.website}\n\n#CFB #JANSANITY`,
  
  welcomeDM: `Welcome to the Helmet Head community! 🏈\n\nYou've earned ${REWARDS_CONFIG.shareReward} $JAN tokens!\n\nVisit ${JAN_ASSETS.website} to learn more about $JAN and join our prediction contests!\n\n#JANSANITY`
};
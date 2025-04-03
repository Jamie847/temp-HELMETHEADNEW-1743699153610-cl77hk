// Football subreddits to monitor
export const SUBREDDITS = {
  COLLEGE: [
    'CFB',              // College Football
    'CFBAnalysis',      // College Football Analysis
    'CFBRecruiting',    // College Football Recruiting
    'CFBRisk',          // College Football Risk Game
    'CFBOffTopic',      // College Football Off Topic
  ],
  NFL: [
    'NFL',              // NFL
    'NFLDraft',         // NFL Draft
    'NFLNoobs',         // NFL for Beginners
    'NFLRoundTable',    // NFL Discussion
    'NFLAnalysis',      // NFL Analysis
  ],
  TEAM_SPECIFIC: [
    'rolltide',         // Alabama
    'longhornnation',   // Texas
    'MichiganWolverines', // Michigan
    'OhioStateFootball',  // Ohio State
    'LSUFootball',      // LSU
    'GatersFootball',   // Florida
    'ockytop',          // Tennessee
    'FSUsports',        // Florida State
  ]
};

// Rate limiting configuration
export const RATE_LIMITS = {
  FETCH_DELAY: 300000,      // 5 minutes between fetches
  COMMENT_DELAY: 180000,    // 3 minutes between comments
  MAX_COMMENTS_PER_HOUR: 10,
  MAX_POSTS_PER_DAY: 5,
  KARMA_THRESHOLD: 2        // Minimum score to respond to
};

// Keywords to monitor
export const KEYWORDS = [
  'analysis',
  'breakdown',
  'stats',
  'prediction',
  'opinion',
  'thoughts',
  'question',
  'help',
  'explain'
];

// Response triggers
export const TRIGGERS = {
  QUESTIONS: [
    'what do you think',
    'thoughts on',
    'how about',
    'anyone know',
    'can someone explain'
  ],
  ANALYSIS_REQUESTS: [
    'analyze',
    'break down',
    'explain',
    'help understand'
  ]
};

// Bot commands
export const COMMANDS = {
  HELP: '!help',
  ANALYZE: '!analyze',
  PREDICT: '!predict',
  STATS: '!stats',
  COMPARE: '!compare',
  RANKINGS: '!rankings'
};

// Command descriptions
export const COMMAND_HELP = {
  [COMMANDS.HELP]: 'Show this help message',
  [COMMANDS.ANALYZE]: 'Analyze a team or player (e.g., !analyze Alabama)',
  [COMMANDS.PREDICT]: 'Get game predictions (e.g., !predict Michigan vs Ohio State)',
  [COMMANDS.STATS]: 'Get team/player stats (e.g., !stats Georgia)',
  [COMMANDS.COMPARE]: 'Compare two teams/players (e.g., !compare LSU vs Alabama)',
  [COMMANDS.RANKINGS]: 'Get current rankings'
};
import Snoowrap from 'snoowrap';
import { generateResponse } from '../../config/personality.js';
import { handleCommand } from './commands.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { SUBREDDITS, RATE_LIMITS, KEYWORDS, TRIGGERS, COMMANDS } from './config.js';

dotenv.config();

// Rate limiting state
const rateLimits = {
  commentCount: 0,
  postCount: 0,
  lastCommentTime: 0,
  processedItems: new Set()
};

// Reset counters every hour
setInterval(() => {
  rateLimits.commentCount = 0;
  rateLimits.postCount = 0;
}, 3600000);

// Initialize Reddit client
function initializeReddit() {
  return new Snoowrap({
    userAgent: 'Helmet Head Football AI v1.0',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD
  });
}

// Check if we can comment based on rate limits
function canComment() {
  const now = Date.now();
  return (
    rateLimits.commentCount < RATE_LIMITS.MAX_COMMENTS_PER_HOUR &&
    now - rateLimits.lastCommentTime >= RATE_LIMITS.COMMENT_DELAY
  );
}

// Check if content contains relevant keywords or triggers
function shouldRespond(content) {
  const text = content.body || content.selftext || '';
  const title = content.title || '';
  const combinedText = `${title} ${text}`.toLowerCase();

  // Check keywords
  const hasKeyword = KEYWORDS.some(keyword => 
    combinedText.includes(keyword.toLowerCase())
  );

  // Check question triggers
  const hasQuestionTrigger = TRIGGERS.QUESTIONS.some(trigger => 
    combinedText.includes(trigger.toLowerCase())
  );

  // Check analysis triggers
  const hasAnalysisTrigger = TRIGGERS.ANALYSIS_REQUESTS.some(trigger => 
    combinedText.includes(trigger.toLowerCase())
  );

  // Check karma score
  const score = content.score || 0;

  return (
    (hasKeyword || hasQuestionTrigger || hasAnalysisTrigger) &&
    score >= RATE_LIMITS.KARMA_THRESHOLD
  );
}

// Process a post or comment
async function processContent(content, reddit, openai) {
  try {
    if (!canComment()) return;

    const text = content.body || content.selftext;
    const firstWord = text.split(' ')[0];

    // Check if it's a command
    if (Object.values(COMMANDS).includes(firstWord)) {
      const args = text.split(' ').slice(1);
      const response = await handleCommand(firstWord, args, openai);
      
      if (response) {
        await content.reply(response);
        rateLimits.commentCount++;
        rateLimits.lastCommentTime = Date.now();
      }
      return;
    }

    // Generate regular response
    const response = await generateResponse(openai, text);

    if (response) {
      await content.reply(response);
      rateLimits.commentCount++;
      rateLimits.lastCommentTime = Date.now();
    }
  } catch (error) {
    console.error('Error processing content:', error);
  }
}

// Monitor subreddits for relevant content
async function monitorSubreddits(reddit, openai) {
  try {
    const allSubreddits = [
      ...SUBREDDITS.COLLEGE,
      ...SUBREDDITS.NFL,
      ...SUBREDDITS.TEAM_SPECIFIC
    ];

    for (const subreddit of allSubreddits) {
      // Get new posts and comments
      const posts = await reddit.getSubreddit(subreddit).getNew({ limit: 25 });
      const comments = await reddit.getSubreddit(subreddit).getComments({ limit: 25 });

      // Process posts
      for (const post of posts) {
        if (rateLimits.processedItems.has(post.id)) continue;
        if (shouldRespond(post)) {
          await processContent(post, reddit, openai);
        }
        rateLimits.processedItems.add(post.id);
      }

      // Process comments
      for (const comment of comments) {
        if (rateLimits.processedItems.has(comment.id)) continue;
        if (shouldRespond(comment)) {
          await processContent(comment, reddit, openai);
        }
        rateLimits.processedItems.add(comment.id);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('Error monitoring subreddits:', error);
  }
}

// Start the bot
async function startBot() {
  try {
    console.log('🤖 Initializing Reddit bot...');
    
    // Initialize clients
    const reddit = initializeReddit();
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log('✅ Clients initialized successfully');
    console.log('🏈 Starting subreddit monitoring...');

    // Main monitoring loop
    while (true) {
      await monitorSubreddits(reddit, openai);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMITS.FETCH_DELAY));
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Start the bot if running directly
if (process.argv[1].endsWith('bot.js')) {
  startBot();
}

export { startBot };
import dotenv from 'dotenv';
import express from 'express';
import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { InteractionManager } from './twitter/interactions.js';
import { GameMonitor } from './data/game-monitor.js';
import { BreakingNewsMonitor } from './twitter/breaking-news-monitor.js';
import { TokenDistributor } from './rewards/token-distributor.js';
import { startFactPosting } from './auto-facts.js';
import { AccountMonitor } from './twitter/account-monitor.js';
import { FollowerGrowthStrategy } from './growth/follower-strategy.js';
import { ImageTweetGenerator } from './twitter/image-tweet.js';
import { setupMobileAPI } from './mobile/api.js';
import { GamePredictor } from './predictions/game-predictor.js';
import { BotCommandHandler } from './commands/command-handler.js';
import { startWeeklyPredictions } from './betting/analysis.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Get directory name in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Initialize Twitter client
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY?.trim(),
  appSecret: process.env.TWITTER_API_SECRET?.trim(),
  accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim(),
  accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim(),
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Setup mobile API endpoints
setupMobileAPI(app, client, openai);

// Initialize command handler
const commandHandler = new BotCommandHandler();

// Track last tweet time
let lastTweetTime = Date.now();

// Safe interval constant (30 days in milliseconds instead of using 2147483647)
const SAFE_INTERVAL = 2592000000;

// Monitor tweet gaps with safe interval
setInterval(async () => {
  const now = Date.now();
  const hoursSinceLastTweet = (now - lastTweetTime) / (1000 * 60 * 60);
  
  if (hoursSinceLastTweet >= 1) {
    console.log(`⚠️ Alert: No tweets in the last ${hoursSinceLastTweet.toFixed(1)} hours`);
    
    // Check Twitter API status
    try {
      await client.v2.me();
      console.log('✅ Twitter API connection is active');
    } catch (error) {
      console.error('❌ Twitter API connection error:', error);
    }
  }
}, 300000); // Check every 5 minutes

// Update lastTweetTime whenever a tweet is sent
const updateLastTweetTime = () => {
  lastTweetTime = Date.now();
  console.log(`Tweet posted at: ${new Date(lastTweetTime).toISOString()}`);
};

// Health check endpoint
app.get('/health', (req, res) => {
  const status = {
    healthy: true,
    lastTweetTime: new Date(lastTweetTime).toISOString(),
    hoursSinceLastTweet: ((Date.now() - lastTweetTime) / (1000 * 60 * 60)).toFixed(1)
  };
  res.status(200).json(status);
});

// Command endpoint
app.post('/command', (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Command required' });
  }
  const response = commandHandler.handleCommand(command);
  res.json({ response });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json(commandHandler.getFormattedStatus());
});

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { news_story } = req.body;
    
    if (!news_story) {
      return res.status(400).json({ error: 'News story or game result required' });
    }
    
    const imageTweetGenerator = new ImageTweetGenerator(client, openai);
    const result = await imageTweetGenerator.generateImage(news_story);
    
    res.json(result);
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message });
  }
});

async function startBot() {
  try {
    console.log('\n🤖 Initializing Helmet Head...');

    // Check if Supabase environment variables are properly set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('http')) {
      console.warn('\n⚠️ Warning: SUPABASE_URL is missing or invalid. Some features will be disabled.');
    }
    if (!process.env.SUPABASE_ANON_KEY) {
      console.warn('\n⚠️ Warning: SUPABASE_ANON_KEY is missing. Some features will be disabled.');
    }

    // Initialize components with command handler
    const interactionManager = new InteractionManager(client, openai);
    const gameMonitor = new GameMonitor(client, openai);
    const newsMonitor = new BreakingNewsMonitor(client, openai, commandHandler);
    const accountMonitor = new AccountMonitor(client, openai);
    const growthStrategy = new FollowerGrowthStrategy(client, openai);
    const gamePredictor = new GamePredictor(client, openai);
    const imageTweetGenerator = new ImageTweetGenerator(client, openai);

    // Set up tweet tracking for all components
    const components = [
      interactionManager,
      gameMonitor,
      newsMonitor,
      accountMonitor,
      growthStrategy,
      gamePredictor,
      imageTweetGenerator
    ];

    // Add tweet tracking to all components
    components.forEach(component => {
      if (typeof component.on === 'function') {
        component.on('tweet', updateLastTweetTime);
      }
    });

    // Start all components in parallel, with error handling for each
    try {
      await Promise.all([
        gameMonitor.startMonitoring().catch(e => console.error('Error starting game monitor:', e)),
        interactionManager.startListening().catch(e => console.error('Error starting interaction manager:', e)),
        newsMonitor.startMonitoring().catch(e => console.error('Error starting news monitor:', e)),
        startFactPosting().catch(e => console.error('Error starting fact posting:', e)),
        accountMonitor.startMonitoring().catch(e => console.error('Error starting account monitor:', e)),
        growthStrategy.startGrowthStrategy().catch(e => console.error('Error starting growth strategy:', e)),
      ]);
      
      // Start weekly predictions with error handling
      try {
        startWeeklyPredictions();
      } catch (e) {
        console.error('Error starting weekly predictions:', e);
        console.warn('Weekly predictions disabled due to error');
      }

      console.log('\n✅ Helmet Head is now active!');
    } catch (error) {
      console.error('\n⚠️ Some components failed to start:', error);
      console.log('Continuing with available functionality...');
    }
  } catch (error) {
    console.error('\n❌ Error starting bot:', error);
    throw error;
  }
}

// Start the server first
app.listen(port, () => {
  console.log(`\n🚀 Server running on port ${port}`);
  
  // Then start the bot
  startBot().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
});
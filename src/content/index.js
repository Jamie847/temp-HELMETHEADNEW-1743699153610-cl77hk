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
import { BotCommandHandler } from './commands/command-handler.js';
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

// Initialize command handler
const commandHandler = new BotCommandHandler();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
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

async function startBot() {
  try {
    console.log('\n🤖 Initializing Helmet Head...');

    // Initialize components with command handler
    const interactionManager = new InteractionManager(client, openai);
    const gameMonitor = new GameMonitor(client, openai);
    const newsMonitor = new BreakingNewsMonitor(client, openai, commandHandler);
    const accountMonitor = new AccountMonitor(client, openai);
    const growthStrategy = new FollowerGrowthStrategy(client, openai);

    // Start all components in parallel
    await Promise.all([
      gameMonitor.startMonitoring([]),
      interactionManager.startListening(),
      newsMonitor.startMonitoring(),
      startFactPosting(),
      accountMonitor.startMonitoring(),
      growthStrategy.startGrowthStrategy()
    ]);

    console.log('\n✅ Helmet Head is now active!');
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
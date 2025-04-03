import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { sleep } from './utils.js';
import { PERSONALITY_TRAITS } from './config/personality.js';

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY?.trim(),
  appSecret: process.env.TWITTER_API_SECRET?.trim(),
  accessToken: process.env.TWITTER_ACCESS_TOKEN?.trim(),
  accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim(),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Track recently posted facts to avoid duplicates
const recentFacts = new Set();
const MAX_RECENT_FACTS = 50; // Keep track of last 50 facts

// Topics to rotate through
const TOPICS = [
  'historical college football facts',
  'interesting football statistics',
  'legendary coaches',
  'memorable games',
  'football traditions',
  'football strategy and tactics',
  'football rules and evolution',
  'college football rivalries',
  'historic upsets',
  'Heisman Trophy history',
  'conference realignment history',
  'bowl game history',
  'record-breaking performances',
  'historic stadiums',
  'influential players'
];

async function generateFootballFact() {
  try {
    // Pick random topic
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.9,
      messages: [{
        role: "system",
        content: `You are Helmet Head, a football expert AI.
          
          Generate an interesting fact about: ${topic}
          
          Requirements:
          - Be accurate and informative
          - Include specific details (dates, names, numbers)
          - Keep it engaging and conversational
          - Stay under 240 characters
          - Must be DIFFERENT from these recent facts: ${Array.from(recentFacts).join(' | ')}
          - Do not add any default hashtags`
      }]
    });

    const fact = completion.choices[0].message.content;
    
    // Store in recent facts
    recentFacts.add(fact);
    if (recentFacts.size > MAX_RECENT_FACTS) {
      recentFacts.delete(Array.from(recentFacts)[0]); // Remove oldest fact
    }

    return fact;
  } catch (error) {
    console.error('Error generating fact:', error);
    throw error;
  }
}

async function postFact() {
  try {
    const fact = await generateFootballFact();
    const tweet = await client.v2.tweet(fact);
    console.log('Posted fact:', fact);
    console.log('Tweet ID:', tweet.data.id);
    return tweet;
  } catch (error) {
    console.error('Error posting fact:', error);
    throw error;
  }
}

// Post facts periodically
async function startFactPosting() {
  console.log('Starting automated football facts...');
  
  while (true) {
    try {
      await postFact();
      // Wait 4 hours between facts
      await sleep(14400000);
    } catch (error) {
      console.error('Error in fact posting loop:', error);
      // Wait 15 minutes on error
      await sleep(900000);
    }
  }
}

// Start if run directly
if (process.argv[1].endsWith('auto-facts.js')) {
  startFactPosting().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { generateFootballFact, postFact, startFactPosting };
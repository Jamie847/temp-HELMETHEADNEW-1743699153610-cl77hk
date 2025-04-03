import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { CohereClient } from 'cohere-ai';
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

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// Track recently posted facts to avoid duplicates
const recentFacts = new Set();
const MAX_RECENT_FACTS = 50; // Keep track of last 50 facts

// Fallback facts for when both APIs are unavailable
const FALLBACK_FACTS = [
  "The first Rose Bowl was played in 1902, with Michigan defeating Stanford 49-0 🏈",
  "The forward pass was legalized in college football in 1906, revolutionizing the game 🏈",
  "The Heisman Trophy was first awarded in 1935 to Jay Berwanger of the University of Chicago 🏆",
  "Alabama has won the most national championships in the poll era with 13 titles 🏆",
  "Notre Dame's 'Win one for the Gipper' speech was given by Knute Rockne in 1928 🏈",
  "The longest winning streak in college football is 47 games by Oklahoma (1953-1957) 📊",
  "Red Grange scored 6 touchdowns against Michigan in 1924, earning the nickname 'The Galloping Ghost' 🏃",
  "The first televised college football game was Fordham vs. Waynesburg in 1939 📺",
  "Army and Navy first played each other in football in 1890 ⚓️",
  "The 'Game of the Century' between Notre Dame and Michigan State ended in a 10-10 tie in 1966 🏈"
];

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
    
    try {
      // Try OpenAI first
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
      recentFacts.add(fact);
      if (recentFacts.size > MAX_RECENT_FACTS) {
        recentFacts.delete(Array.from(recentFacts)[0]);
      }
      return fact;
    } catch (error) {
      if (error.code === 'insufficient_quota') {
        console.log('OpenAI quota exceeded, trying Cohere...');
        
        // Try Cohere as fallback
        const response = await cohere.generate({
          model: 'command',
          prompt: `Generate an interesting college football fact about ${topic}. Be accurate, include specific details, and keep it under 240 characters. Make it engaging and conversational, like a Gen Z football expert would write it.`,
          max_tokens: 100,
          temperature: 0.9,
          k: 0,
          stop_sequences: ["."],
          return_likelihoods: 'NONE'
        });

        const fact = response.generations[0].text.trim();
        recentFacts.add(fact);
        if (recentFacts.size > MAX_RECENT_FACTS) {
          recentFacts.delete(Array.from(recentFacts)[0]);
        }
        return fact;
      }
      
      // If both APIs fail, use fallback facts
      console.log('Both APIs unavailable, using fallback facts');
      const availableFacts = FALLBACK_FACTS.filter(fact => !recentFacts.has(fact));
      if (availableFacts.length === 0) {
        recentFacts.clear();
        return FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
      }
      const fact = availableFacts[Math.floor(Math.random() * availableFacts.length)];
      recentFacts.add(fact);
      return fact;
    }
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
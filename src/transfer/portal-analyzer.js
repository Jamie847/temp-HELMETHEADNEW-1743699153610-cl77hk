
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { TwitterApi } from 'twitter-api-v2';

export class TransferPortalAnalyzer {
  constructor(twitterClient, openaiClient) {
    this.twitter = twitterClient;
    this.openai = openaiClient;
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.lastCheck = Date.now();
  }
  
  async monitorTransferNews() {
    // Check for new portal entries every 3 hours
    setInterval(async () => {
      await this.checkNewEntries();
    }, 10800000);
  }
  
  async checkNewEntries() {
    try {
      // Search for transfer portal news
      const tweets = await this.twitter.v2.search(
        '("transfer portal" OR "entered portal" OR "committed to") (football OR CFB) -is:retweet', {
        'tweet.fields': ['created_at'],
        'max_results': 15
      });
      
      if (!tweets?.data) return;
      
      for (const tweet of tweets.data) {
        // Check if tweet is new since last check
        const tweetTime = new Date(tweet.created_at).getTime();
        if (tweetTime > this.lastCheck) {
          await this.processTransferNews(tweet);
        }
      }
      
      this.lastCheck = Date.now();
    } catch (error) {
      console.error('Error checking transfer news:', error);
    }
  }
  
  async processTransferNews(tweet) {
    // Extract player and team info
    const { player, fromTeam, toTeam } = await this.extractTransferInfo(tweet.text);
    
    if (!player) return;
    
    // For portal entries (no toTeam yet)
    if (!toTeam) {
      await this.suggestTeamFits(player, fromTeam);
    } 
    // For commitments (both fromTeam and toTeam)
    else {
      await this.analyzeTransferFit(player, fromTeam, toTeam);
    }
  }
  
  async extractTransferInfo(tweetText) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `Extract transfer portal information from this tweet. 
          Return JSON with fields: player, fromTeam, toTeam (null if just entering portal).
          Example: {"player": "John Smith", "fromTeam": "Alabama", "toTeam": "Ohio State"}
          If entering portal: {"player": "John Smith", "fromTeam": "Alabama", "toTeam": null}`
      }, {
        role: "user",
        content: tweetText
      }]
    });
    
    try {
      return JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      return { player: null, fromTeam: null, toTeam: null };
    }
  }
  
  async suggestTeamFits(player, fromTeam) {
    // Generate team fit analysis
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `${player} from ${fromTeam} just entered the transfer portal.
          
          Provide a detailed analysis including:
          1. Player's style, strengths, and production
          2. Top 5 team fits based on scheme, need, and opportunity
          3. Each team's offense/defense and how player would fit
          4. Potential impact on depth chart
          5. Development potential`
      }]
    });
    
    const analysis = completion.choices[0].message.content;
    
    // Post the analysis as a thread
    await this.twitter.v2.tweetThread([
      `🚨 TRANSFER PORTAL ANALYSIS 🚨\n\n${player} from ${fromTeam} has entered the portal. Here's my breakdown of ideal fits:`,
      analysis.substring(0, 280),
      analysis.substring(280, 560),
      `Follow @HelmetHeadAI for more transfer portal analysis and predictions!`
    ]);
  }
  
  async analyzeTransferFit(player, fromTeam, toTeam) {
    // Generate fit analysis for player's new team
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `${player} is transferring from ${fromTeam} to ${toTeam}.
          
          Provide an in-depth analysis including:
          1. Why player left original school
          2. Scheme fit at new school
          3. Impact on depth chart
          4. Statistical projections for next season
          5. How this affects both programs
          6. Development outlook under new coaching staff`
      }]
    });
    
    const analysis = completion.choices[0].message.content;
    
    // Post tweet with analysis
    await this.twitter.v2.tweet(
      `🔄 TRANSFER COMMITMENT: ${player} (${fromTeam} ➡️ ${toTeam})\n\n${analysis.substring(0, 200)}...`
    );
  }
}

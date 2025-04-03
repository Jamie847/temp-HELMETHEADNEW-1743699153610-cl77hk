
import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

export class NILDealTracker {
  constructor(twitterClient, openaiClient) {
    this.twitter = twitterClient;
    this.openai = openaiClient;
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.lastCheck = Date.now();
  }
  
  async monitorNILNews() {
    // Check for new NIL news every 4 hours
    setInterval(async () => {
      await this.checkNewDeals();
    }, 14400000);
  }
  
  async checkNewDeals() {
    try {
      // Search for NIL news tweets
      const tweets = await this.twitter.v2.search(
        '("NIL deal" OR "NIL announcement" OR "announces partnership") -is:retweet', {
        'tweet.fields': ['created_at'],
        'max_results': 20
      });
      
      if (!tweets?.data) return;
      
      for (const tweet of tweets.data) {
        // Check if tweet is new since last check
        const tweetTime = new Date(tweet.created_at).getTime();
        if (tweetTime > this.lastCheck) {
          await this.processNILDealNews(tweet);
        }
      }
      
      this.lastCheck = Date.now();
    } catch (error) {
      console.error('Error checking NIL deal news:', error);
    }
  }
  
  async processNILDealNews(tweet) {
    // Extract deal info
    const dealInfo = await this.extractDealInfo(tweet.text);
    
    if (!dealInfo.player || !dealInfo.brand) return;
    
    // Store deal in database
    await this.storeDealInfo(dealInfo);
    
    // Generate deal analysis
    await this.analyzeAndPostDeal(dealInfo);
  }
  
  async extractDealInfo(tweetText) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `Extract NIL deal information from this tweet. 
          Return JSON with fields: player, sport, team, brand, dealType, estimatedValue (null if unknown).
          Example: {"player": "Jane Smith", "sport": "football", "team": "Alabama", 
                   "brand": "Nike", "dealType": "apparel", "estimatedValue": 50000}`
      }, {
        role: "user",
        content: tweetText
      }]
    });
    
    try {
      return JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      return { player: null, sport: null, team: null, brand: null };
    }
  }
  
  async storeDealInfo(dealInfo) {
    try {
      await this.supabase.from('nil_deals').insert({
        player_name: dealInfo.player,
        sport: dealInfo.sport,
        team: dealInfo.team,
        brand: dealInfo.brand,
        deal_type: dealInfo.dealType,
        estimated_value: dealInfo.estimatedValue,
        announced_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error storing NIL deal:', error);
    }
  }
  
  async analyzeAndPostDeal(dealInfo) {
    // Get comparable deals
    const { data: comparableDeals } = await this.supabase
      .from('nil_deals')
      .select('*')
      .eq('sport', dealInfo.sport)
      .eq('deal_type', dealInfo.dealType)
      .neq('player_name', dealInfo.player)
      .order('announced_date', { ascending: false })
      .limit(5);
    
    // Generate analysis
    const analysis = await this.generateDealAnalysis(dealInfo, comparableDeals);
    
    // Post tweet thread
    await this.twitter.v2.tweetThread([
      `💰 NIL DEAL ALERT: ${dealInfo.player} (${dealInfo.team}) signs with ${dealInfo.brand}`,
      analysis.substring(0, 280),
      `Follow @HelmetHeadAI for more NIL market analysis and college football insights!`
    ]);
  }
  
  async generateDealAnalysis(deal, comparableDeals) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `Analyze this NIL deal and provide market insights:
          
          Deal: ${JSON.stringify(deal)}
          Comparable Deals: ${JSON.stringify(comparableDeals)}
          
          Provide analysis on:
          1. Market value assessment (is it over/under market value?)
          2. How it compares to similar deals
          3. Why this brand chose this athlete
          4. Potential impact on player's brand and future deals
          5. How this fits into current NIL market trends`
      }]
    });
    
    return completion.choices[0].message.content;
  }
}

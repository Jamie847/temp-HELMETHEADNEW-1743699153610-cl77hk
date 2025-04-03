import { createClient } from '@supabase/supabase-js';
import { bettingClient } from './api-client.js';
import { StatisticalModel } from './statistical-model.js';
import { HistoricalAnalyzer } from './historical-data.js';
import { SpreadAnalyzer } from './spread-analyzer.js';
import OpenAI from 'openai';

export class BettingAnalyzer {
  constructor() {
    // Check if Supabase credentials are properly configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
      console.warn('Invalid or missing SUPABASE_URL. Betting analysis features will be disabled.');
      this.supabase = null;
    } else if (!supabaseKey) {
      console.warn('Missing SUPABASE_ANON_KEY. Betting analysis features will be disabled.');
      this.supabase = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.statisticalModel = new StatisticalModel();
    this.historicalAnalyzer = new HistoricalAnalyzer();
    this.spreadAnalyzer = new SpreadAnalyzer();
  }

  async analyzeBettingOpportunities() {
    try {
      // Skip analysis if Supabase client is not initialized
      if (!this.supabase) {
        console.warn('Skipping betting analysis: Supabase connection not available');
        return;
      }
      
      // Get odds data with rate limiting
      const oddsData = await bettingClient.getOdds();
      if (!oddsData) return;

      // Get additional context from Rundown
      const rundownData = await bettingClient.getRundownGames();

      // Track spread movements
      for (const game of oddsData) {
        await this.spreadAnalyzer.trackSpreadMovement(game.id, game.spread);
      }

      // Find market discrepancies
      const discrepancies = await this.spreadAnalyzer.findSpreadDiscrepancies();
      // Analyze each game
      for (const game of oddsData) {
        const analysis = await this.analyzeGame(game, {
          rundownData,
          discrepancies
        });
        if (analysis.edgeFound) {
          await this.storePrediction(analysis);
        }
      }
    } catch (error) {
      console.error('Error analyzing betting opportunities:', error);
    }
  }

  async analyzeGame(game, context) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        temperature: 0.7,
        messages: [{
          role: "system",
          content: `Analyze this betting opportunity:
            Game: ${JSON.stringify(game)}
            Model Prediction: ${JSON.stringify(modelPrediction)}
            Historical Data: ${JSON.stringify(historicalData)}
            Market Analysis: ${JSON.stringify(context)}
            
            Provide analysis that:
            1. Evaluates the odds and lines
            2. Considers historical matchups
            3. Analyzes key statistics
            4. Identifies potential edges
            5. Calculates estimated win probability
            6. Considers model prediction
            7. Evaluates market sentiment
            
            Return a JSON object with:
            {
              "edgeFound": boolean,
              "confidence": number (0-1),
              "prediction": string,
              "analysis": string,
              "estimatedValue": number
            }`
        }]
      });

      const aiAnalysis = JSON.parse(completion.choices[0].message.content);
      
      // Combine AI and model predictions
      return {
        edgeFound: aiAnalysis.edgeFound || (modelPrediction?.confidence > 0.8),
        confidence: Math.max(aiAnalysis.confidence, modelPrediction?.confidence || 0),
        prediction: aiAnalysis.prediction,
        analysis: `Model: ${modelPrediction?.analysis || 'N/A'} | AI: ${aiAnalysis.analysis}`,
        estimatedValue: Math.max(aiAnalysis.estimatedValue, modelPrediction?.estimatedValue || 0)
      };
    } catch (error) {
      console.error('Error analyzing game:', error);
      return { edgeFound: false };
    }
  }

  async storePrediction(analysis) {
    try {
      // Skip if Supabase client is not initialized
      if (!this.supabase) {
        console.warn('Skipping prediction storage: Supabase connection not available');
        return;
      }
      
      const { data, error } = await this.supabase
        .from('betting_predictions')
        .insert({
          prediction: analysis.prediction,
          confidence: analysis.confidence,
          analysis: analysis.analysis,
          estimated_value: analysis.estimatedValue,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      console.log('Stored new betting prediction');
    } catch (error) {
      console.error('Error storing prediction:', error);
    }
  }
}

// Create weekly prediction schedule
export function startWeeklyPredictions() {
  const analyzer = new BettingAnalyzer();
  
  // Run analysis every Tuesday at 2 AM
  setInterval(async () => {
    const now = new Date();
    if (now.getDay() === 2 && now.getHours() === 2) {
      console.log('Starting weekly betting analysis...');
      await analyzer.analyzeBettingOpportunities();
    }
  }, 3600000); // Check every hour
}

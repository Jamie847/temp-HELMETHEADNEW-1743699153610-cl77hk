import { SentimentAnalyzer } from 'natural';
import { WordTokenizer } from 'natural';

export class EmotionAnalyzer {
  private analyzer: SentimentAnalyzer;
  private tokenizer: WordTokenizer;

  constructor() {
    this.analyzer = new SentimentAnalyzer('English', 'afinn');
    this.tokenizer = new WordTokenizer();
  }

  public analyzeEmotion(text: string): {
    sentiment: number;
    excitement: number;
    intensity: number;
  } {
    const tokens = this.tokenizer.tokenize(text);
    const sentiment = this.analyzer.getSentiment(tokens);
    
    // Calculate excitement based on exclamation marks and caps
    const excitementScore = (text.match(/!/g) || []).length + 
      (text.match(/[A-Z]{2,}/g) || []).length;
    
    // Calculate intensity based on emotional words
    const intensityWords = ['incredible', 'amazing', 'unbelievable', 'epic'];
    const intensity = tokens.filter(word => 
      intensityWords.includes(word.toLowerCase())
    ).length;

    return {
      sentiment,
      excitement: excitementScore,
      intensity
    };
  }
}
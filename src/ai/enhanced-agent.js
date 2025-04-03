import { ElizaEngine } from './eliza.js';
import { EmotionAnalyzer } from './sentiment.js';
import { ContextManager } from './context-manager.js';
import OpenAI from 'openai';

export class EnhancedAgent {
  private elizaEngine: ElizaEngine;
  private emotionAnalyzer: EmotionAnalyzer;
  private contextManager: ContextManager;
  private openai: OpenAI;

  constructor(openaiApiKey: string) {
    this.elizaEngine = new ElizaEngine();
    this.emotionAnalyzer = new EmotionAnalyzer();
    this.contextManager = new ContextManager();
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  public async generateResponse(input: string, context?: string): Promise<string> {
    // Get base response from local ELIZA patterns
    const elizaResponse = this.elizaEngine.processInput(input);
    
    // Analyze emotion locally
    const emotion = this.emotionAnalyzer.analyzeEmotion(input);
    
    // Get context from recent events
    const recentEvents = this.contextManager.getRecentEvents();

    // Enhance with GPT-4 while maintaining local personality
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.9,
      messages: [{
        role: "system",
        content: `You are Helmet Head, combining deep football knowledge with bold analysis.
          Base response: ${elizaResponse}
          Emotional context: ${JSON.stringify(emotion)}
          Recent events: ${JSON.stringify(recentEvents)}
          
          Enhance this response while:
          - Using your own unique voice and personality
          - Focusing on deep strategic insights
          - Being direct and unfiltered in analysis
          - Showing genuine excitement for the game
          - Making bold predictions when warranted
          - Using football-specific terminology
          
          For Transfer Portal news:
          - Analyze fit and impact bluntly
          - Make clear predictions about success/failure
          
          For NIL news:
          - Give candid takes on deals and impact
          - Discuss broader implications
          
          For Recruitment news:
          - Evaluate talent honestly
          - Project development timeline
          
          For Breaking news:
          - Provide immediate strategic analysis
          - Make bold predictions about impact`
      }, {
        role: "user",
        content: input
      }]
    });

    const enhancedResponse = completion.choices[0].message.content;
    
    // Store in context for future responses
    this.contextManager.addToShortTermMemory(input);
    
    return enhancedResponse;
  }

  public async generateTweet(context: string): Promise<string> {
    const emotion = this.emotionAnalyzer.analyzeEmotion(context);
    const elizaBase = this.elizaEngine.processInput(context);
    
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.9,
      messages: [{
        role: "system",
        content: `You are Helmet Head, delivering unfiltered college football analysis!
          Base tweet: ${elizaBase}
          Emotion level: ${emotion.excitement}
          
          Create a tweet that:
          - Shows your unique personality
          - Makes bold, direct statements
          - Uses deep football knowledge
          - Stays under 280 characters
          - Uses appropriate hashtags
          - Isn't afraid to make waves`
      }, {
        role: "user",
        content: `Tweet about: ${context}`
      }]
    });

    return completion.choices[0].message.content;
  }
}
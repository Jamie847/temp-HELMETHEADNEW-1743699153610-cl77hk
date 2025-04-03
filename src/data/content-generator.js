import OpenAI from 'openai';
import { KnowledgeBase } from './knowledge/index.js';

export class ContentGenerator {
  constructor(openaiClient) {
    this.openai = openaiClient;
    this.knowledgeBase = new KnowledgeBase();
  }

  async generateFactFromNews(newsItem) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        temperature: 0.8,
        messages: [{
          role: "system",
          content: `Generate an interesting football fact based on this news:
            ${newsItem.title}
            
            Guidelines:
            - Extract a unique or surprising fact
            - Connect to historical context if relevant
            - Keep it engaging and educational
            - Stay under 240 characters
            - Do not add any default hashtags`
        }]
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating fact:', error);
      return null;
    }
  }

  async generateAnalysis(content) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        temperature: 0.7,
        messages: [{
          role: "system",
          content: `Analyze this football content and provide insights:
            ${content}
            
            Guidelines:
            - Focus on strategic analysis
            - Use proper football terminology
            - Highlight key takeaways
            - Keep it under 240 characters
            - Do not add any default hashtags`
        }]
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating analysis:', error);
      return null;
    }
  }
}
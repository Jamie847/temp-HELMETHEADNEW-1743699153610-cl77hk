export class ContextManager {
  private context: Map<string, any> = new Map();
  private shortTermMemory: string[] = [];
  private longTermMemory: Map<string, any> = new Map();

  constructor() {
    this.initializeContext();
  }

  private initializeContext() {
    // Game context
    this.context.set('currentGame', null);
    this.context.set('score', { home: 0, away: 0 });
    this.context.set('quarter', 1);
    this.context.set('timeRemaining', '15:00');
    
    // Team context
    this.context.set('homeTeam', null);
    this.context.set('awayTeam', null);
    this.context.set('keyPlayers', new Map());
    
    // Conversation context
    this.context.set('lastTopic', null);
    this.context.set('conversationStyle', 'enthusiastic');
  }

  public updateGameContext(gameData: any) {
    this.context.set('currentGame', gameData.id);
    this.context.set('score', gameData.score);
    this.context.set('quarter', gameData.quarter);
    this.context.set('timeRemaining', gameData.timeRemaining);
  }

  public addToShortTermMemory(event: string) {
    this.shortTermMemory.unshift(event);
    if (this.shortTermMemory.length > 10) {
      this.shortTermMemory.pop();
    }
  }

  public addToLongTermMemory(key: string, value: any) {
    this.longTermMemory.set(key, value);
  }

  public getContext(): Map<string, any> {
    return this.context;
  }

  public getRecentEvents(): string[] {
    return this.shortTermMemory;
  }
}
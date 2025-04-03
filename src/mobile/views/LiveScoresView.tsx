import { Page, GridLayout, Label, ScrollView, ObservableArray } from '@nativescript/core';
import { verifyGameData } from '../../data/game-verification';

export class LiveScoresView extends Page {
  private games = new ObservableArray([]);
  private updateInterval: any;

  constructor() {
    super();
    this.createUI();
    this.startScoreUpdates();
  }

  async startScoreUpdates() {
    // Update scores every 30 seconds
    this.updateInterval = setInterval(async () => {
      const activeGames = await this.getActiveGames();
      this.updateScores(activeGames);
    }, 30000);
  }

  async getActiveGames() {
    const games = await getVerifiedGames();
    return games.filter(game => game.status === 'in_progress');
  }

  updateScores(games) {
    this.games.splice(0);
    games.forEach(game => {
      const scoreCard = new GridLayout();
      scoreCard.addRow();
      scoreCard.addColumn();
      
      const homeTeam = new Label();
      homeTeam.text = `${game.homeTeam} ${game.homeScore}`;
      
      const awayTeam = new Label();
      awayTeam.text = `${game.awayTeam} ${game.awayScore}`;
      
      const quarter = new Label();
      quarter.text = `Q${game.quarter} ${game.timeRemaining}`;
      
      scoreCard.addChild(homeTeam);
      scoreCard.addChild(awayTeam);
      scoreCard.addChild(quarter);
      
      this.games.push(scoreCard);
    });
  }

  createUI() {
    const layout = new ScrollView();
    const content = new GridLayout();
    
    const header = new Label();
    header.text = "🏈 Live Scores";
    header.className = "h1";
    
    content.addChild(header);
    layout.content = content;
    
    this.content = layout;
  }

  onUnloaded() {
    // Clean up interval when view is unloaded
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
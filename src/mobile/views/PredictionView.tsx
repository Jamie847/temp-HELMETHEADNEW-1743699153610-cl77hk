import { Page, StackLayout, Label, TextField, Button, ObservableArray } from '@nativescript/core';
import { getVerifiedGames } from '../../data/game-verification';

export class PredictionView extends Page {
  private predictions = new ObservableArray([]);
  private rewards = new Map();

  constructor() {
    super();
    this.createUI();
    this.loadUpcomingGames();
  }

  async loadUpcomingGames() {
    const games = await getVerifiedGames();
    games.forEach(game => {
      const gameLayout = new StackLayout();
      
      const title = new Label();
      title.text = `${game.homeTeam} vs ${game.awayTeam}`;
      
      const homeScore = new TextField();
      homeScore.hint = "Home Score";
      homeScore.keyboardType = "number";
      
      const awayScore = new TextField();
      awayScore.hint = "Away Score";
      awayScore.keyboardType = "number";
      
      const submitBtn = new Button();
      submitBtn.text = "Submit Prediction";
      submitBtn.on('tap', () => {
        this.submitPrediction(game.id, {
          home: parseInt(homeScore.text),
          away: parseInt(awayScore.text)
        });
      });

      gameLayout.addChild(title);
      gameLayout.addChild(homeScore);
      gameLayout.addChild(awayScore);
      gameLayout.addChild(submitBtn);
      
      this.predictions.push(gameLayout);
    });
  }

  async submitPrediction(gameId, scores) {
    // Store prediction and set up reward tracking
    this.rewards.set(gameId, {
      prediction: scores,
      reward: 0
    });
  }

  createUI() {
    const layout = new StackLayout();
    
    // Add JAN token logo for rewards section
    const rewardsLayout = new StackLayout();
    rewardsLayout.className = "rewards-section";
    
    const janLogo = new Image();
    janLogo.src = "~/assets/jansanity-logo.png";
    janLogo.className = "jan-logo";
    
    const header = new Label();
    header.text = "🏈 Prediction Contest";
    header.className = "h1";
    
    const info = new Label();
    info.text = "Win JANSANITY tokens for accurate predictions!";
    info.className = "info";
    
    rewardsLayout.addChild(janLogo);
    rewardsLayout.addChild(info);
    
    layout.addChild(header);
    layout.addChild(rewardsLayout);
    
    this.content = layout;
  }
}
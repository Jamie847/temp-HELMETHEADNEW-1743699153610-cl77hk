import { Page, TabView, TabViewItem } from '@nativescript/core';
import { ChatView } from './ChatView';
import { PredictionView } from './PredictionView';
import { LiveScoresView } from './LiveScoresView';
import { StatsView } from './StatsView';
import { PlayoffChallengeView } from './PlayoffChallengeView';

export class MainView extends Page {
  constructor() {
    super();
    this.createUI();
  }

  createUI() {
    // Add Helmet Head logo at the top
    const headerLayout = new StackLayout();
    headerLayout.className = "header";
    
    const logo = new Image();
    logo.src = "~/assets/helmet-head-logo.png";
    logo.className = "header-logo";
    headerLayout.addChild(logo);

    const tabView = new TabView();

    // Chat Tab
    const chatTab = new TabViewItem();
    chatTab.title = "💬 Chat";
    chatTab.view = new ChatView();

    // Predictions Tab
    const predictionsTab = new TabViewItem();
    predictionsTab.title = "🎯 Predict";
    predictionsTab.view = new PredictionView();

    // Live Scores Tab
    const scoresTab = new TabViewItem();
    scoresTab.title = "🏈 Live";
    scoresTab.view = new LiveScoresView();

    // Stats Tab
    const statsTab = new TabViewItem();
    statsTab.title = "📊 Stats";
    statsTab.view = new StatsView();
    
    // Add Playoff Challenge Tab
    const challengeTab = new TabViewItem();
    challengeTab.title = "🏆 Playoff";
    challengeTab.view = new PlayoffChallengeView();

    tabView.items = [chatTab, predictionsTab, scoresTab, statsTab, challengeTab];
    
    const mainLayout = new StackLayout();
    mainLayout.addChild(headerLayout);
    mainLayout.addChild(tabView);
    this.content = mainLayout;
  }
}
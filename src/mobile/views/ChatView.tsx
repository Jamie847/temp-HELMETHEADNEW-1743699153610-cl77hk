import { Page, StackLayout, TextField, Button, ListView, ObservableArray } from '@nativescript/core';
import { initializeAgent } from '../../agent';

export class ChatView extends Page {
  private messages: ObservableArray<any>;
  private agent: any;

  constructor() {
    super();
    this.messages = new ObservableArray([]);
    this.initializeAI();
    this.createUI();
  }

  async initializeAI() {
    this.agent = await initializeAgent();
  }

  createUI() {
    const layout = new StackLayout();

    // Chat messages list
    const listView = new ListView();
    listView.items = this.messages;
    listView.itemTemplate = '{text}';

    // Input field
    const input = new TextField();
    input.hint = "Ask about football...";

    // Send button
    const button = new Button();
    button.text = "Send";
    button.on('tap', async () => {
      const userMessage = input.text;
      if (!userMessage) return;

      // Add user message
      this.messages.push({ text: `You: ${userMessage}` });

      // Get AI response
      const response = await this.agent.generateResponse(userMessage);
      this.messages.push({ text: `Helmet Head: ${response}` });

      // Clear input
      input.text = "";
    });

    layout.addChild(listView);
    layout.addChild(input);
    layout.addChild(button);

    this.content = layout;
  }
}
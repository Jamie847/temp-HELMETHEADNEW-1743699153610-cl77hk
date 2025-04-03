import { Telegraf } from 'telegraf';
import { generateResponse } from '../../config/personality.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Handle start command
bot.command('start', ctx => {
  ctx.reply('Welcome to Helmet Head AI! Ask me anything about football!');
});

// Handle all messages
bot.on('text', async ctx => {
  const response = await generateResponse(openai, ctx.message.text);
  if (response) {
    ctx.reply(response);
  }
});

bot.launch();
import { Client, GatewayIntentBits } from 'discord.js';
import { generateResponse } from '../../config/personality.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check if message is in a football channel or mentions the bot
  if (message.channel.name.includes('football') || message.mentions.has(client.user)) {
    const response = await generateResponse(openai, message.content);
    if (response) {
      message.reply(response);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
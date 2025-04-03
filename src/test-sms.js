import dotenv from 'dotenv';
import { sendTweetNotification } from './notifications/sms.js';

dotenv.config();

async function testSMS() {
  try {
    console.log('Starting SMS test...');
    
    const mockTweet = {
      id: '123456789',
      text: '🏈 Test Tweet: The Helmet Head bot is now live with SMS notifications! #CFBPlayoff #JANSANITY'
    };
    
    await sendTweetNotification(mockTweet);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testSMS();
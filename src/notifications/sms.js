import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Twilio client only if credentials are available
let client = null;
const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize Twilio client:', error);
  }
}

export async function sendTweetNotification(tweet) {
  // Skip if Twilio is not configured
  if (!client) {
    console.log('SMS notifications disabled - Twilio not configured');
    return;
  }

  try {
    // Format phone numbers (remove all non-digit characters and ensure +1 prefix)
    const toNumber = process.env.YOUR_PHONE_NUMBER ? 
      `+1${process.env.YOUR_PHONE_NUMBER.replace(/\D/g, '')}` : null;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER ?
      `+1${process.env.TWILIO_PHONE_NUMBER.replace(/\D/g, '')}` : null;

    if (!toNumber || !fromNumber) {
      console.log('SMS notifications disabled - phone numbers not configured');
      return;
    }

    console.log(`Sending SMS from ${fromNumber} to ${toNumber}`);

    const message = await client.messages.create({
      body: `🏈 New Helmet Head Tweet:\n\n${tweet.text}\n\nhttps://twitter.com/HelmetHead/status/${tweet.id}`,
      to: toNumber,
      from: fromNumber
    });

    console.log('SMS sent successfully! Message SID:', message.sid);
  } catch (error) {
    console.warn('Error sending SMS:', error.message);
    if (error.code) {
      console.warn('Twilio Error Code:', error.code);
    }
  }
}
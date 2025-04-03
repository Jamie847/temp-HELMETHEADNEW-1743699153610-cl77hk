import dotenv from 'dotenv';
import { getJANBalance } from './config/solana.js';

dotenv.config();

async function checkBalance() {
  try {
    console.log('🔍 Checking Helmet Head treasury status...');
    
    // Check JAN balance
    const treasuryAddress = '68kz36pVXaMWVKxpnefbkTL5NN3UYZohr8g9stJh5N1W';
    console.log('Treasury address:', treasuryAddress);
    
    const balance = await getJANBalance(treasuryAddress);
    console.log(`\n💰 Current JAN Balance: ${balance} tokens`);
    
    return balance;
  } catch (error) {
    console.error('Error checking balance:', error);
    process.exit(1);
  }
}

// Run balance check
checkBalance();
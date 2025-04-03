import dotenv from 'dotenv';
import { sendJANTokens } from './config/solana.js';
import { secureTokenTransfer } from './config/token-security.js';
import { DistributionSecurity } from './config/distribution-security.js';

dotenv.config();

async function sendTokens() {
  try {
    console.log('🚀 Initiating JAN token transfer...');
    
    const fromAddress = '68kz36pVXaMWVKxpnefbkTL5NN3UYZohr8g9stJh5N1W';
    const toAddress = '6MH35vgSDABvPAwXG8WZjrMZARU41Tf56LgYj7CGfdfc';
    const amount = 1000;

    // Initialize distribution security
    const security = new DistributionSecurity();
    await security.enableDistribution();

    console.log(`From: ${fromAddress}`);
    console.log(`To: ${toAddress}`);
    console.log(`Amount: ${amount} JAN`);

    const result = await security.processRewardTransfer(
      toAddress,
      amount,
      'manual_reward'
    );

    if (result.success) {
      console.log('\n✅ Transfer successful!');
      console.log('Transaction signature:', result.signature);
      console.log('Timestamp:', result.timestamp);
    }
  } catch (error) {
    console.error('❌ Transfer failed:', error);
    process.exit(1);
  }
}

sendTokens();
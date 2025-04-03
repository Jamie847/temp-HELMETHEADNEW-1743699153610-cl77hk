// Wallet configuration for Helmet Head's treasury
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';

// Treasury wallet addresses
export const ETH_TREASURY_ADDRESS = '0x11C58Ca6b8b76882e7Be8E2764a26f102780c218';
export const SOLANA_TREASURY_ADDRESS = '6MH35vgSDABvPAwXG8WZjrMZARU41Tf56LgYj7CGfdfc';

// Initialize providers
const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);
const connection = new Connection(process.env.SOLANA_RPC_URL);

// Treasury balance checking for ETH
export async function checkETHTreasuryBalance() {
  try {
    const balance = await provider.getBalance(ETH_TREASURY_ADDRESS);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Error checking ETH treasury balance:', error);
    return 0;
  }
}

// Treasury balance checking for Solana
export async function checkSOLTreasuryBalance() {
  try {
    const balance = await connection.getBalance(new PublicKey(SOLANA_TREASURY_ADDRESS));
    return balance / 1e9; // Convert lamports to SOL
  } catch (error) {
    console.error('Error checking SOL treasury balance:', error);
    return 0;
  }
}

// PUMP token balance checking
export async function checkTreasuryPUMPBalance() {
  try {
    return await getPUMPBalance(SOLANA_TREASURY_ADDRESS);
  } catch (error) {
    console.error('Error checking PUMP balance:', error);
    return 0;
  }
}
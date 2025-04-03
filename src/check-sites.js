import dotenv from 'dotenv';
import { updateMonitoredSites } from './data/site-monitor.js';

dotenv.config();

async function checkSites() {
  try {
    console.log('🔍 Checking football blog sites...');
    
    const sites = await updateMonitoredSites();
    
    console.log('\nCurrently monitoring these domains:');
    sites.forEach((site, index) => {
      console.log(`${index + 1}. ${site}`);
    });
    
  } catch (error) {
    console.error('Error checking sites:', error);
    process.exit(1);
  }
}

// Run the check if called directly
if (process.argv[1].endsWith('check-sites.js')) {
  checkSites();
}

export { checkSites };
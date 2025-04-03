import dotenv from 'dotenv';
import { monitorSites } from './data/site-monitor.js';
import { monitorCFPWebsite } from './data/cfp-website.js';

dotenv.config();

async function checkMonitoringStatus() {
  console.log('Checking monitoring system status...');
  
  try {
    console.log('\nTesting news site monitoring...');
    const siteUpdates = await monitorSites();
    console.log(`Found ${siteUpdates.length} potential updates from news sites`);
    
    console.log('\nTesting CFP website monitoring...');
    const cfpChanges = await monitorCFPWebsite();
    console.log('CFP website check completed');
    
    return {
      siteUpdates,
      cfpChanges
    };
  } catch (error) {
    console.error('Error checking monitoring status:', error);
  }
}

checkMonitoringStatus();
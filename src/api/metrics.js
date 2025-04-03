// Add this endpoint to the existing metrics.js file
router.get('/wallet-addresses', async (req, res) => {
  try {
    const shareRewards = new ShareRewardsManager(client);
    const addresses = shareRewards.getWalletAddresses();
    
    // Export as CSV
    const csv = addresses.map(addr => 
      `${addr.userId},${addr.address},${addr.timestamp}`
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=wallet-addresses.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting addresses:', error);
    return res.status(500).json({ error: 'Failed to export addresses' });
  }
});
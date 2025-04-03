import { generateResponse } from '../config/personality.js';
import { verifyGameData, getVerifiedGames } from '../data/game-verification.js';
import { TokenDistributor } from '../rewards/token-distributor.js';

export function setupMobileAPI(app, twitterClient, openaiClient) {
  const tokenDistributor = new TokenDistributor();

  // Chat endpoint
  app.post('/api/mobile/chat', async (req, res) => {
    try {
      const { message } = req.body;
      const response = await generateResponse(openaiClient, message);
      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Live scores endpoint
  app.get('/api/mobile/scores', async (req, res) => {
    try {
      const games = await getVerifiedGames();
      res.json({ games });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Predictions endpoint
  app.post('/api/mobile/predictions', async (req, res) => {
    try {
      const { gameId, prediction, userAddress } = req.body;
      const game = await verifyGameData(gameId);
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Store prediction and setup reward tracking
      // Actual reward distribution will happen after game ends
      res.json({ success: true, message: 'Prediction recorded' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // JAN token balance endpoint
  app.get('/api/mobile/balance/:address', async (req, res) => {
    try {
      if (!tokenDistributor) {
        return res.status(503).json({ error: 'Token service unavailable' });
      }
      
      try {
        const balance = await tokenDistributor.checkUserJANBalance(req.params.address);
        res.json({ balance });
      } catch (balanceError) {
        console.error('Error fetching balance:', balanceError);
        res.status(500).json({ error: 'Failed to fetch token balance' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
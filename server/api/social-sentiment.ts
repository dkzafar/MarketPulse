import { Router } from 'express';
import { fetchNewsSentiment } from '../services/news';

const router = Router();

// GET /api/demo/social-sentiment/:symbol
router.get('/demo/social-sentiment/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Validate symbol parameter
    if (!symbol || symbol.length === 0) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    // Call the news sentiment service
    const sentimentData = await fetchNewsSentiment(symbol.toUpperCase());
    
    if (!sentimentData) {
      return res.status(404).json({ error: 'No sentiment data available for this symbol' });
    }

    res.json({
      symbol: symbol.toUpperCase(),
      sentiment: sentimentData,
      timestamp: new Date().toISOString(),
      service: 'news-sentiment'
    });

  } catch (error) {
    console.error(`Social sentiment error for ${req.params.symbol}:`, error);
    res.status(500).json({ 
      error: 'Social sentiment analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
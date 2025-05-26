import { Router } from 'express';
import { getCachedAssetData } from '../services/cache';
import { fetchNewsSentiment } from '../services/news';
import { computeIndicators } from '../services/ta';
import { aiSummarise } from '../services/ai';
import { verifySummary } from '../services/validation';

const router = Router();

router.get('/analysis/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`📊 Fetching analysis for ${symbol}`);
    
    const assetData = await getCachedAssetData(symbol);
    if (!assetData) {
      return res.status(404).json({ error: 'Unknown symbol or insufficient data' });
    }

    const [news, extraIndicators] = await Promise.all([
      fetchNewsSentiment(symbol),
      computeIndicators(assetData.ohlcv)
    ]);

    const payload = { ...assetData, extraIndicators, news };
    const aiSummary = await aiSummarise(payload);
    const verified = verifySummary(assetData, aiSummary);

    res.json({
      symbol,
      timestamp: new Date().toISOString(),
      assetData: {
        symbol: assetData.symbol,
        name: assetData.name,
        price: assetData.price,
        changePercent: assetData.changePercent,
        volume: assetData.volume,
        marketCap: assetData.marketCap
      },
      technicalIndicators: extraIndicators,
      news: news.slice(0, 5), // Top 5 news articles
      aiAnalysis: verified
    });
  } catch (error) {
    console.error('Analysis endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to generate analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
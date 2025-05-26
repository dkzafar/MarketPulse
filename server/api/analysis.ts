import { Router } from 'express';
import { fetchNewsSentiment } from '../services/news';
import { computeIndicators }   from '../services/ta';
import { aiSummarise }         from '../services/ai';
import { getCachedAssetData }  from '../services/cache';
import { verifySummary } from '../services/validation';

const router = Router();

router.get('/analysis/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const assetData = await getCachedAssetData(symbol);
  if (!assetData) {
    return res.status(404).json({ error: 'Unknown symbol' });
  }

  // Fetch news & compute TA in parallel
  const [news, extraIndicators] = await Promise.all([
    fetchNewsSentiment(symbol),
    computeIndicators(assetData.ohlcv)
  ]);

  const payload = { ...assetData, extraIndicators, news };

  // Call the free LLM
  const summary = await aiSummarise(payload);

  // 4a) Verify and annotate
  const verified = verifySummary(assetData, summary);

  // 4b) Return the augmented summary
  res.json(verified);
});

export default router;
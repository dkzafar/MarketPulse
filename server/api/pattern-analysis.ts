import { Router } from 'express';
import { detectCandlestickPatterns } from '../services/pattern-recognition';

const router = Router();

// GET /api/demo/pattern-analysis/:symbol
router.get('/demo/pattern-analysis/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Validate symbol parameter
    if (!symbol || symbol.length === 0) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    // Call the pattern recognition service
    // For demo purposes, we'll use mock OHLC data - in production this would come from your real market data
    const mockOHLC = [
      { open: 100, high: 105, low: 98, close: 103 },
      { open: 103, high: 108, low: 102, close: 106 },
      { open: 106, high: 110, low: 104, close: 109 }
    ];
    const patternAnalysis = detectCandlestickPatterns(mockOHLC);
    
    if (!patternAnalysis) {
      return res.status(404).json({ error: 'No pattern data available for this symbol' });
    }

    res.json({
      symbol: symbol.toUpperCase(),
      patternAnalysis,
      timestamp: new Date().toISOString(),
      service: 'pattern-recognition'
    });

  } catch (error) {
    console.error(`Pattern analysis error for ${req.params.symbol}:`, error);
    res.status(500).json({ 
      error: 'Pattern analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
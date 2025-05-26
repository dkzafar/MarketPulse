/**
 * Enhanced API Routes for Advanced Features
 * Professional endpoints for portfolio optimization, alerts, and social sentiment
 */

import { Router } from 'express';
import { optimizePortfolio, generateEfficientFrontier, optimizeRiskParity } from '../services/portfolio-optimization';
import { getComprehensiveSentiment, getTrendingSymbols } from '../services/social-sentiment';
import { analyzeAllPatterns } from '../services/pattern-recognition';
import { performRiskAnalysis } from '../services/risk';
import { runBacktest } from '../services/backtest';
import { alertManager, AlertTemplates, ScannerTemplates } from '../services/real-time-alerts';

const router = Router();

/**
 * Portfolio Optimization Endpoints
 */

// Modern Portfolio Theory optimization
router.post('/portfolio/optimize', async (req, res) => {
  try {
    const { assets, targetReturn } = req.body;
    
    if (!assets || !Array.isArray(assets)) {
      return res.status(400).json({ error: 'Valid assets array required' });
    }

    const optimizedPortfolio = optimizePortfolio(assets, targetReturn);
    const efficientFrontier = generateEfficientFrontier(assets);
    const riskParityPortfolio = optimizeRiskParity(assets);

    res.json({
      optimal: optimizedPortfolio,
      riskParity: riskParityPortfolio,
      efficientFrontier: efficientFrontier.portfolios,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Portfolio optimization error:', error);
    res.status(500).json({ error: 'Portfolio optimization failed' });
  }
});

// Efficient frontier calculation
router.post('/portfolio/efficient-frontier', async (req, res) => {
  try {
    const { assets, points = 50 } = req.body;
    
    const frontier = generateEfficientFrontier(assets, points);
    
    res.json({
      portfolios: frontier.portfolios,
      optimal: frontier.optimalPortfolio,
      minVariance: frontier.minVariancePortfolio,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Efficient frontier error:', error);
    res.status(500).json({ error: 'Efficient frontier calculation failed' });
  }
});

/**
 * Social Sentiment Analysis Endpoints
 */

// Get comprehensive social sentiment for a symbol
router.get('/sentiment/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const sentiment = await getComprehensiveSentiment(symbol.toUpperCase());
    
    res.json(sentiment);
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Sentiment analysis failed' });
  }
});

// Get trending symbols based on social mentions
router.get('/trending', async (req, res) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols || typeof symbols !== 'string') {
      return res.status(400).json({ error: 'Symbols parameter required' });
    }

    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
    const trending = await getTrendingSymbols(symbolList);
    
    res.json({
      trending,
      timestamp: new Date().toISOString(),
      totalSymbols: symbolList.length
    });
  } catch (error) {
    console.error('Trending analysis error:', error);
    res.status(500).json({ error: 'Trending analysis failed' });
  }
});

/**
 * Pattern Recognition Endpoints
 */

// Analyze chart patterns for a symbol
router.post('/patterns/analyze', async (req, res) => {
  try {
    const { ohlcData } = req.body;
    
    if (!ohlcData || !Array.isArray(ohlcData)) {
      return res.status(400).json({ error: 'Valid OHLC data array required' });
    }

    const patterns = analyzeAllPatterns(ohlcData);
    
    res.json({
      patterns,
      timestamp: new Date().toISOString(),
      dataPoints: ohlcData.length
    });
  } catch (error) {
    console.error('Pattern analysis error:', error);
    res.status(500).json({ error: 'Pattern analysis failed' });
  }
});

/**
 * Advanced Risk Analytics Endpoints
 */

// Comprehensive risk analysis
router.post('/risk/analyze', async (req, res) => {
  try {
    const { returns, currentPrice = 100 } = req.body;
    
    if (!returns || !Array.isArray(returns)) {
      return res.status(400).json({ error: 'Valid returns array required' });
    }

    const riskAnalysis = performRiskAnalysis(returns, currentPrice);
    
    res.json({
      risk: riskAnalysis,
      timestamp: new Date().toISOString(),
      dataPoints: returns.length
    });
  } catch (error) {
    console.error('Risk analysis error:', error);
    res.status(500).json({ error: 'Risk analysis failed' });
  }
});

/**
 * Backtesting Endpoints
 */

// Run strategy backtest
router.post('/backtest/run', async (req, res) => {
  try {
    const { ohlcData, signals, params } = req.body;
    
    if (!ohlcData || !signals || !params) {
      return res.status(400).json({ error: 'OHLC data, signals, and parameters required' });
    }

    const backtestResult = runBacktest(ohlcData, signals, params);
    
    res.json({
      backtest: backtestResult,
      timestamp: new Date().toISOString(),
      trades: backtestResult.trades.length
    });
  } catch (error) {
    console.error('Backtest error:', error);
    res.status(500).json({ error: 'Backtest execution failed' });
  }
});

/**
 * Real-Time Alerts Endpoints
 */

// Create price alert
router.post('/alerts/create', async (req, res) => {
  try {
    const alertData = req.body;
    
    if (!alertData.symbol || !alertData.alertType) {
      return res.status(400).json({ error: 'Symbol and alert type required' });
    }

    const alert = alertManager.createAlert(alertData);
    
    res.json({
      alert,
      message: 'Alert created successfully'
    });
  } catch (error) {
    console.error('Alert creation error:', error);
    res.status(500).json({ error: 'Alert creation failed' });
  }
});

// Get user alerts
router.get('/alerts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const alerts = alertManager.getUserAlerts(userId);
    const notifications = alertManager.getRecentNotifications(userId);
    
    res.json({
      alerts,
      notifications,
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => a.isActive).length
    });
  } catch (error) {
    console.error('Alert retrieval error:', error);
    res.status(500).json({ error: 'Alert retrieval failed' });
  }
});

// Create market scanner
router.post('/scanner/create', async (req, res) => {
  try {
    const scannerData = req.body;
    
    if (!scannerData.name || !scannerData.filters) {
      return res.status(400).json({ error: 'Scanner name and filters required' });
    }

    const scanner = alertManager.createScanner(scannerData);
    
    res.json({
      scanner,
      message: 'Scanner created successfully'
    });
  } catch (error) {
    console.error('Scanner creation error:', error);
    res.status(500).json({ error: 'Scanner creation failed' });
  }
});

// Run market scan
router.post('/scanner/:scannerId/run', async (req, res) => {
  try {
    const { scannerId } = req.params;
    const { marketData } = req.body;
    
    if (!marketData || !Array.isArray(marketData)) {
      return res.status(400).json({ error: 'Market data array required' });
    }

    const results = await alertManager.runMarketScan(scannerId, marketData);
    
    res.json({
      results,
      scannerId,
      timestamp: new Date().toISOString(),
      matchCount: results.length
    });
  } catch (error) {
    console.error('Market scan error:', error);
    res.status(500).json({ error: 'Market scan failed' });
  }
});

/**
 * Alert Templates Endpoints
 */

// Get alert templates
router.get('/alerts/templates', (req, res) => {
  res.json({
    templates: {
      breakout: 'Breakout Alert - Triggers when price breaks above resistance',
      stopLoss: 'Stop Loss Alert - Triggers when price falls below target',
      volumeSpike: 'Volume Spike Alert - Triggers on unusual volume activity'
    },
    scannerTemplates: {
      breakout: ScannerTemplates.breakoutScanner,
      value: ScannerTemplates.valueStocks,
      volume: ScannerTemplates.highVolume
    }
  });
});

// Create alert from template
router.post('/alerts/template/:template', async (req, res) => {
  try {
    const { template } = req.params;
    const { symbol, price, userId } = req.body;
    
    if (!symbol || !userId) {
      return res.status(400).json({ error: 'Symbol and user ID required' });
    }

    let alertTemplate;
    
    switch (template) {
      case 'breakout':
        alertTemplate = AlertTemplates.breakoutAlert(symbol, price);
        break;
      case 'stopLoss':
        alertTemplate = AlertTemplates.stopLossAlert(symbol, price);
        break;
      case 'volumeSpike':
        alertTemplate = AlertTemplates.volumeSpikeAlert(symbol);
        break;
      default:
        return res.status(400).json({ error: 'Invalid template' });
    }

    const alert = alertManager.createAlert({
      ...alertTemplate,
      userId
    });
    
    res.json({
      alert,
      template,
      message: `${template} alert created for ${symbol}`
    });
  } catch (error) {
    console.error('Template alert creation error:', error);
    res.status(500).json({ error: 'Template alert creation failed' });
  }
});

/**
 * Market Data Integration for Alerts
 */

// Update market data and trigger alerts
router.post('/alerts/update-market-data', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates array required' });
    }

    let triggeredAlerts = 0;
    
    for (const update of updates) {
      const { symbol, price, volume = 0 } = update;
      if (symbol && price) {
        alertManager.updateMarketData(symbol, price, volume);
        triggeredAlerts++;
      }
    }
    
    res.json({
      processed: updates.length,
      timestamp: new Date().toISOString(),
      message: `Market data updated for ${triggeredAlerts} symbols`
    });
  } catch (error) {
    console.error('Market data update error:', error);
    res.status(500).json({ error: 'Market data update failed' });
  }
});

export default router;
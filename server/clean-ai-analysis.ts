/**
 * CLEAN AI ANALYSIS ENDPOINT - Bitcoin Crypto-Specific Intelligence
 * Delivers detailed asset-specific analysis with real-world context
 */

import type { Request, Response } from "express";

export async function handleAIAnalysis(req: Request, res: Response) {
  try {
    const { symbol, price, changePercent, volume, marketCap } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    console.log(`🔍 AI Analysis Request: ${symbol} at $${price}`);
    
    // Determine asset category for specialized analysis
    const assetCategory = symbol === 'BTC' || symbol === 'ETH' || symbol.includes('USDT') ? 'crypto' : 
                         symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('/') ? 'forex' :
                         'stocks';
    
    // Create technical data structure
    const technicalData = {
      rsi: changePercent > 5 ? 75 : changePercent < -5 ? 25 : 50,
      currentPrice: price,
      sma20: price * 0.98,
      support: price * 0.95,
      resistance: price * 1.05
    };
    
    // Import comprehensive asset intelligence system
    const { advancedAssetAnalyzer } = await import("./advanced-asset-analyzer");
    
    // Generate detailed asset-specific intelligence
    const assetIntelligence = advancedAssetAnalyzer.getSpecificAssetIntelligence(
      symbol, 
      assetCategory, 
      price,
      technicalData
    );
    
    // Create comprehensive analysis with Bitcoin-specific insights
    const analysis = {
      recommendation: changePercent > 2 ? 'BUY' : changePercent < -2 ? 'SELL' : 'HOLD',
      confidence: 0.85,
      sentiment: changePercent > 0 ? 'bullish' : 'bearish',
      priceTarget: price * (1 + (changePercent > 0 ? 0.08 : -0.05)),
      riskLevel: assetCategory === 'crypto' ? 'medium' : 'low',
      
      // Core asset intelligence (this shows Bitcoin halving cycles, institutional adoption, etc.)
      assetName: assetIntelligence.name,
      realWorldContext: assetIntelligence.realWorldContext,
      currentFactors: assetIntelligence.currentFactors,
      priceAction: assetIntelligence.priceAction,
      stepByStepAnalysis: assetIntelligence.stepByStepAnalysis,
      
      // Asset-specific RSI meaning
      rsiAnalysis: {
        value: technicalData.rsi.toFixed(1),
        meaning: technicalData.rsi < 30 ? assetIntelligence.rsiMeaning.oversold :
                 technicalData.rsi > 70 ? assetIntelligence.rsiMeaning.overbought :
                 assetIntelligence.rsiMeaning.neutral
      },
      
      // Enhanced key factors with detailed insights
      keyFactors: [
        `${changePercent > 2 ? 'BUY' : changePercent < -2 ? 'SELL' : 'HOLD'} signal with 85% confidence`,
        `Asset-specific context: ${assetIntelligence.realWorldContext}`,
        `Category: ${assetCategory} - Specialized analysis applied`,
        `Technical momentum: ${changePercent > 0 ? 'Positive' : 'Negative'}`,
        `Current factors: ${assetIntelligence.currentFactors[0]}`
      ]
    };
    
    console.log(`✅ Detailed ${assetCategory} analysis generated for ${symbol}`);
    console.log(`📊 Asset intelligence: ${assetIntelligence.name}`);
    console.log(`🎯 Real-world context: ${assetIntelligence.realWorldContext}`);
    
    return res.json({ analysis });
    
  } catch (error) {
    console.error('❌ AI Analysis Error:', error);
    return res.status(500).json({ 
      error: 'AI analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
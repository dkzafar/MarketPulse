import { Router } from 'express';
import { aiSummarise } from '../services/ai';
import { fetchNewsSentiment } from '../services/news';

const router = Router();

interface NLQueryRequest {
  query: string;
  context: {
    watchlist?: string[];
    marketData?: any[];
    userId?: number;
  };
}

interface NLQueryResponse {
  answer: string;
  data: any;
  charts?: any[];
  recommendations?: any[];
  confidence: number;
  sources: string[];
  relatedQueries: string[];
}

// POST /api/nl-query
router.post('/nl-query', async (req, res) => {
  try {
    const { query, context }: NLQueryRequest = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Query is required and must be a non-empty string' 
      });
    }

    // Analyze query intent and extract relevant information
    const queryAnalysis = analyzeQueryIntent(query);
    
    // Fetch relevant authentic market data based on query
    const relevantData = await fetchRelevantMarketData(queryAnalysis, context);
    
    if (!relevantData || relevantData.length === 0) {
      return res.json({
        answer: "I couldn't find relevant market data for your query. Please try asking about specific stocks, crypto assets, or market categories that are available in our 632-asset universe.",
        data: {},
        confidence: 0.3,
        sources: [],
        relatedQueries: generateRelatedQueries(queryAnalysis.intent)
      });
    }

    // Generate AI-powered response using authentic data
    const aiResponse = await generateAIResponse(query, relevantData, queryAnalysis);
    
    // Extract actionable insights and recommendations
    const recommendations = generateRecommendations(relevantData, queryAnalysis);
    
    // Prepare charts data if applicable
    const chartsData = prepareChartsData(relevantData, queryAnalysis);

    const response: NLQueryResponse = {
      answer: aiResponse.answer,
      data: aiResponse.data,
      charts: chartsData,
      recommendations,
      confidence: aiResponse.confidence,
      sources: ['Live Market Data', 'AI Analysis', 'Technical Indicators'],
      relatedQueries: generateRelatedQueries(queryAnalysis.intent)
    };

    res.json(response);

  } catch (error: any) {
    console.error('Natural language query error:', error.message);
    res.status(500).json({ 
      error: 'Failed to process natural language query', 
      details: error.message 
    });
  }
});

/**
 * Analyze user query to understand intent and extract key information
 */
function analyzeQueryIntent(query: string) {
  const lowerQuery = query.toLowerCase();
  
  // Extract symbols mentioned in query
  const symbolPattern = /\b[A-Z]{1,5}\b/g;
  const possibleSymbols = query.match(symbolPattern) || [];
  
  // Determine query intent
  let intent = 'general';
  let category = 'all';
  let timeframe = 'current';
  let action = 'analyze';
  
  if (lowerQuery.includes('buy') || lowerQuery.includes('invest') || lowerQuery.includes('purchase')) {
    action = 'buy_recommendation';
  } else if (lowerQuery.includes('sell') || lowerQuery.includes('exit')) {
    action = 'sell_recommendation';
  } else if (lowerQuery.includes('risk') || lowerQuery.includes('danger') || lowerQuery.includes('volatility')) {
    intent = 'risk_analysis';
  } else if (lowerQuery.includes('perform') || lowerQuery.includes('best') || lowerQuery.includes('top') || lowerQuery.includes('gain')) {
    intent = 'performance';
  } else if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('versus')) {
    intent = 'comparison';
  } else if (lowerQuery.includes('trend') || lowerQuery.includes('pattern') || lowerQuery.includes('forecast')) {
    intent = 'trend_analysis';
  } else if (lowerQuery.includes('portfolio') || lowerQuery.includes('holding')) {
    intent = 'portfolio_analysis';
  }

  // Determine asset category
  if (lowerQuery.includes('crypto') || lowerQuery.includes('bitcoin') || lowerQuery.includes('btc')) {
    category = 'crypto';
  } else if (lowerQuery.includes('forex') || lowerQuery.includes('currency') || lowerQuery.includes('usd')) {
    category = 'forex';
  } else if (lowerQuery.includes('stock') || lowerQuery.includes('equity') || lowerQuery.includes('share')) {
    category = 'stock';
  } else if (lowerQuery.includes('commodity') || lowerQuery.includes('gold') || lowerQuery.includes('oil')) {
    category = 'commodity';
  }

  // Determine timeframe
  if (lowerQuery.includes('today') || lowerQuery.includes('now') || lowerQuery.includes('current')) {
    timeframe = 'today';
  } else if (lowerQuery.includes('week') || lowerQuery.includes('7 day')) {
    timeframe = 'week';
  } else if (lowerQuery.includes('month') || lowerQuery.includes('30 day')) {
    timeframe = 'month';
  }

  return {
    intent,
    category,
    timeframe,
    action,
    symbols: possibleSymbols,
    originalQuery: query
  };
}

/**
 * Fetch relevant market data based on query analysis
 */
async function fetchRelevantMarketData(queryAnalysis: any, context: any) {
  try {
    // Use authentic market data from your comprehensive system
    const response = await fetch('http://localhost:5000/api/market-data');
    const allMarketData = await response.json();
    
    if (!Array.isArray(allMarketData)) {
      return [];
    }

    let relevantData = allMarketData;

    // Filter by category if specified
    if (queryAnalysis.category !== 'all') {
      relevantData = relevantData.filter((asset: any) => {
        const category = (asset.category || '').toLowerCase();
        return category.includes(queryAnalysis.category);
      });
    }

    // Filter by specific symbols if mentioned
    if (queryAnalysis.symbols.length > 0) {
      const symbolsLower = queryAnalysis.symbols.map((s: string) => s.toLowerCase());
      relevantData = relevantData.filter((asset: any) => 
        symbolsLower.some(symbol => asset.symbol.toLowerCase().includes(symbol))
      );
    }

    // Apply intent-based filtering
    switch (queryAnalysis.intent) {
      case 'performance':
        // Sort by performance (change percent)
        relevantData = relevantData
          .filter((asset: any) => asset.changePercent != null)
          .sort((a: any, b: any) => (b.changePercent || 0) - (a.changePercent || 0))
          .slice(0, 10);
        break;
        
      case 'risk_analysis':
        // Focus on high volatility assets
        relevantData = relevantData
          .filter((asset: any) => Math.abs(asset.changePercent || 0) > 2)
          .slice(0, 10);
        break;
        
      case 'portfolio_analysis':
        // Use watchlist data if available
        if (context.watchlist && context.watchlist.length > 0) {
          relevantData = relevantData.filter((asset: any) => 
            context.watchlist.includes(asset.symbol)
          );
        }
        break;
        
      default:
        // Limit to top 20 assets for general queries
        relevantData = relevantData.slice(0, 20);
    }

    return relevantData;

  } catch (error) {
    console.error('Failed to fetch relevant market data:', error);
    return [];
  }
}

/**
 * Generate AI-powered response using authentic market data
 */
async function generateAIResponse(query: string, marketData: any[], queryAnalysis: any) {
  try {
    // Prepare context for AI analysis
    const dataContext = {
      query: query,
      intent: queryAnalysis.intent,
      assets: marketData.slice(0, 5).map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        price: asset.price,
        change: asset.changePercent,
        category: asset.category
      })),
      marketSummary: {
        totalAssets: marketData.length,
        avgChange: marketData.reduce((sum, asset) => sum + (asset.changePercent || 0), 0) / marketData.length,
        topGainer: marketData.reduce((max, asset) => 
          (asset.changePercent || 0) > (max.changePercent || 0) ? asset : max, marketData[0]),
        topLoser: marketData.reduce((min, asset) => 
          (asset.changePercent || 0) < (min.changePercent || 0) ? asset : min, marketData[0])
      }
    };

    // Use your enhanced AI service
    const aiResult = await aiSummarise(dataContext);
    
    if (aiResult.error) {
      return {
        answer: generateFallbackResponse(query, marketData, queryAnalysis),
        data: dataContext.marketSummary,
        confidence: 0.6
      };
    }

    return {
      answer: aiResult.analysis || generateFallbackResponse(query, marketData, queryAnalysis),
      data: dataContext.marketSummary,
      confidence: 0.85
    };

  } catch (error) {
    return {
      answer: generateFallbackResponse(query, marketData, queryAnalysis),
      data: { error: 'AI analysis unavailable' },
      confidence: 0.5
    };
  }
}

/**
 * Generate fallback response when AI is unavailable
 */
function generateFallbackResponse(query: string, marketData: any[], queryAnalysis: any): string {
  const topAssets = marketData.slice(0, 3);
  
  switch (queryAnalysis.intent) {
    case 'performance':
      if (topAssets.length > 0) {
        const best = topAssets[0];
        return `Based on current market data, ${best.symbol} is showing strong performance with a ${best.changePercent?.toFixed(2)}% change. I found ${marketData.length} relevant assets in your query category.`;
      }
      break;
      
    case 'risk_analysis':
      const highVolAssets = marketData.filter(asset => Math.abs(asset.changePercent || 0) > 5);
      return `Risk analysis shows ${highVolAssets.length} assets with high volatility (>5% change) in your portfolio context. Consider monitoring these positions closely.`;
      
    case 'comparison':
      if (topAssets.length >= 2) {
        return `Comparing your selected assets: ${topAssets[0].symbol} (${topAssets[0].changePercent?.toFixed(2)}%) vs ${topAssets[1].symbol} (${topAssets[1].changePercent?.toFixed(2)}%). Analysis based on current market performance.`;
      }
      break;
  }
  
  return `I found ${marketData.length} relevant assets matching your query. The average performance across these assets is ${(marketData.reduce((sum, asset) => sum + (asset.changePercent || 0), 0) / marketData.length).toFixed(2)}% based on current market data.`;
}

/**
 * Generate actionable recommendations based on data analysis
 */
function generateRecommendations(marketData: any[], queryAnalysis: any): any[] {
  const recommendations = [];
  
  // Performance-based recommendations
  const gainers = marketData
    .filter(asset => (asset.changePercent || 0) > 3)
    .slice(0, 3);
    
  const losers = marketData
    .filter(asset => (asset.changePercent || 0) < -3)
    .slice(0, 2);

  gainers.forEach(asset => {
    recommendations.push({
      symbol: asset.symbol,
      action: 'WATCH',
      reason: `Strong momentum with ${asset.changePercent?.toFixed(2)}% gain`,
      confidence: 0.7
    });
  });

  if (queryAnalysis.action === 'buy_recommendation') {
    losers.forEach(asset => {
      recommendations.push({
        symbol: asset.symbol,
        action: 'CONSIDER',
        reason: `Potential value opportunity after ${Math.abs(asset.changePercent || 0).toFixed(2)}% decline`,
        confidence: 0.6
      });
    });
  }

  return recommendations.slice(0, 5);
}

/**
 * Prepare chart data for visualization
 */
function prepareChartsData(marketData: any[], queryAnalysis: any): any[] {
  if (marketData.length === 0) return [];
  
  // Create performance distribution chart
  const performanceChart = {
    type: 'distribution',
    title: 'Performance Distribution',
    data: marketData.map(asset => ({
      symbol: asset.symbol,
      change: asset.changePercent || 0,
      price: asset.price
    })).slice(0, 10)
  };

  return [performanceChart];
}

/**
 * Generate related queries based on intent
 */
function generateRelatedQueries(intent: string): string[] {
  const relatedQueries: { [key: string]: string[] } = {
    performance: [
      "Show me the worst performing assets today",
      "What sectors are trending up?",
      "Compare top gainers vs losers"
    ],
    risk_analysis: [
      "What are the most volatile assets?",
      "Show me portfolio risk metrics",
      "Which assets have highest beta?"
    ],
    portfolio_analysis: [
      "How is my portfolio balanced?",
      "What's my total portfolio value?",
      "Show me dividend income potential"
    ],
    general: [
      "What's moving the market today?",
      "Show me crypto market overview",
      "Find stocks under $20"
    ]
  };

  return relatedQueries[intent] || relatedQueries.general;
}

export default router;
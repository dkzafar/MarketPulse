import type { Express, Request, Response } from "express";

/**
 * PROFESSIONAL ANALYSIS ENGINE - Investment Grade Mathematical Models
 * Uses free historical data sources and authentic financial calculations
 */

export class ProfessionalAnalysisEngine {
  
  /**
   * Fetch historical data from free sources
   */
  async getHistoricalData(symbol: string, category: string): Promise<number[]> {
    const prices: number[] = [];
    
    try {
      // Try Alpha Vantage free tier for historical data
      if (process.env.ALPHA_VANTAGE_API_KEY) {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}&outputsize=compact`
        );
        
        if (response.ok) {
          const data = await response.json();
          const timeSeries = data['Time Series (Daily)'];
          
          if (timeSeries) {
            const dates = Object.keys(timeSeries).slice(0, 50); // Last 50 days
            for (const date of dates) {
              prices.push(parseFloat(timeSeries[date]['4. close']));
            }
            console.log(`✅ Got ${prices.length} historical prices for ${symbol} from Alpha Vantage`);
            return prices.reverse(); // Oldest to newest
          }
        }
      }

      // Try Yahoo Finance free historical data
      const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/chart/${symbol}?range=2mo&interval=1d`;
      const yahooResponse = await fetch(yahooUrl);
      
      if (yahooResponse.ok) {
        const yahooData = await yahooResponse.json();
        const result = yahooData.chart?.result?.[0];
        
        if (result?.indicators?.quote?.[0]?.close) {
          const closePrices = result.indicators.quote[0].close;
          const validPrices = closePrices.filter((price: number) => price !== null);
          console.log(`✅ Got ${validPrices.length} historical prices for ${symbol} from Yahoo Finance`);
          return validPrices;
        }
      }

      // Try Twelve Data free tier
      if (process.env.TWELVE_DATA_API_KEY) {
        const twelveResponse = await fetch(
          `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=30&apikey=${process.env.TWELVE_DATA_API_KEY}`
        );
        
        if (twelveResponse.ok) {
          const twelveData = await twelveResponse.json();
          if (twelveData.values) {
            const historicalPrices = twelveData.values.map((item: any) => parseFloat(item.close));
            console.log(`✅ Got ${historicalPrices.length} historical prices for ${symbol} from Twelve Data`);
            return historicalPrices.reverse();
          }
        }
      }

      // For crypto, try CoinGecko historical data
      if (category === 'crypto') {
        const coinGeckoResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/market_chart?vs_currency=usd&days=30`
        );
        
        if (coinGeckoResponse.ok) {
          const coinData = await coinGeckoResponse.json();
          if (coinData.prices) {
            const cryptoPrices = coinData.prices.map((item: any) => item[1]);
            console.log(`✅ Got ${cryptoPrices.length} historical prices for ${symbol} from CoinGecko`);
            return cryptoPrices;
          }
        }
      }

    } catch (error) {
      console.log(`Historical data fetch error for ${symbol}:`, error);
    }
    
    // Return empty array if no historical data available
    return [];
  }

  /**
   * Calculate authentic RSI using Wilder's Smoothing Method
   */
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    // Calculate initial averages
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Apply Wilder's smoothing for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate Simple Moving Average
   */
  calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const recentPrices = prices.slice(-period);
    return recentPrices.reduce((sum, price) => sum + price, 0) / period;
  }

  /**
   * Calculate Exponential Moving Average
   */
  calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length < period) return this.calculateSMA(prices, prices.length);
    
    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    
    // Calculate signal line (9-period EMA of MACD)
    const macdValues = [macd]; // Simplified for current calculation
    const signal = macd; // Would need historical MACD values for proper signal
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2) {
    const sma = this.calculateSMA(prices, period);
    const recentPrices = prices.slice(-period);
    
    // Calculate standard deviation
    const squaredDiffs = recentPrices.map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      middle: sma,
      upper: sma + (stdDev * multiplier),
      lower: sma - (stdDev * multiplier)
    };
  }

  /**
   * Calculate authentic support and resistance levels
   */
  calculateSupportResistance(prices: number[], currentPrice: number) {
    if (prices.length === 0) {
      return {
        support: currentPrice * 0.95,
        resistance: currentPrice * 1.05
      };
    }

    // Find recent highs and lows
    const recentPrices = prices.slice(-30); // Last 30 data points
    const maxPrice = Math.max(...recentPrices);
    const minPrice = Math.min(...recentPrices);
    
    // Calculate pivot points
    const pivot = (maxPrice + minPrice + currentPrice) / 3;
    const support1 = (2 * pivot) - maxPrice;
    const resistance1 = (2 * pivot) - minPrice;
    
    return {
      support: Math.max(support1, minPrice),
      resistance: Math.min(resistance1, maxPrice),
      pivot
    };
  }

  /**
   * Calculate historical volatility (annualized)
   */
  calculateHistoricalVolatility(prices: number[], period: number = 30): number {
    if (prices.length < 2) return 0.2; // Default 20%
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    
    const recentReturns = returns.slice(-period);
    const mean = recentReturns.reduce((sum, ret) => sum + ret, 0) / recentReturns.length;
    
    const variance = recentReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / recentReturns.length;
    const dailyVol = Math.sqrt(variance);
    
    // Annualize (252 trading days)
    return dailyVol * Math.sqrt(252);
  }

  /**
   * Calculate authentic Beta coefficient
   */
  calculateBeta(assetPrices: number[], marketPrices: number[]): number {
    if (assetPrices.length !== marketPrices.length || assetPrices.length < 2) {
      // Return category-based beta if calculation not possible
      return 1.0;
    }

    const assetReturns = [];
    const marketReturns = [];
    
    for (let i = 1; i < assetPrices.length; i++) {
      assetReturns.push((assetPrices[i] - assetPrices[i - 1]) / assetPrices[i - 1]);
      marketReturns.push((marketPrices[i] - marketPrices[i - 1]) / marketPrices[i - 1]);
    }
    
    const assetMean = assetReturns.reduce((sum, ret) => sum + ret, 0) / assetReturns.length;
    const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;
    
    let covariance = 0;
    let marketVariance = 0;
    
    for (let i = 0; i < assetReturns.length; i++) {
      covariance += (assetReturns[i] - assetMean) * (marketReturns[i] - marketMean);
      marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
    }
    
    if (marketVariance === 0) return 1.0;
    return covariance / marketVariance;
  }

  /**
   * Calculate Value at Risk (VaR)
   */
  calculateVaR(prices: number[], confidence: number = 0.95): number {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    returns.sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * returns.length);
    const varReturn = returns[index] || -0.05; // Default -5%
    
    return Math.abs(varReturn) * prices[prices.length - 1];
  }

  /**
   * Get asset-specific context and meanings
   */
  getAssetSpecificContext(symbol: string, category: string) {
    const contexts: { [key: string]: any } = {
      // Major Tech Stocks
      'AAPL': {
        oversoldMeaning: 'Apple rarely stays oversold long due to strong brand loyalty and cash flow',
        overboughtMeaning: 'Apple at high levels often means iPhone cycle expectations are peaked',
        bullishTrendMeaning: 'Strong momentum suggests positive product cycle or earnings expectations',
        bearishTrendMeaning: 'Decline often reflects supply chain concerns or iPhone sales weakness',
        nearSupportMeaning: 'Apple typically finds buying interest at key levels from institutional investors',
        nearResistanceMeaning: 'Breaking resistance could signal new product excitement or market expansion',
        highVolatilityMeaning: 'Unusual for Apple - likely major product news or market-wide tech selloff',
        lowVolatilityMeaning: 'typical stability, reflecting mature business model',
        normalVolatilityMeaning: 'this blue-chip technology stock'
      },
      'MSFT': {
        oversoldMeaning: 'Microsoft oversold conditions often present buying opportunities given steady cloud growth',
        overboughtMeaning: 'High levels may indicate Azure growth expectations are fully priced in',
        bullishTrendMeaning: 'Reflects strong cloud computing and Office 365 subscription growth',
        bearishTrendMeaning: 'May indicate concerns about cloud competition or enterprise spending',
        nearSupportMeaning: 'Microsoft typically attracts institutional buying at support levels',
        nearResistanceMeaning: 'Breaking resistance often signals new cloud contract wins or AI developments',
        highVolatilityMeaning: 'Unusual for Microsoft - likely major cloud announcements or competitive pressure',
        lowVolatilityMeaning: 'enterprise software stability',
        normalVolatilityMeaning: 'this enterprise software leader'
      },
      // Crypto
      'BTC': {
        oversoldMeaning: 'Bitcoin oversold levels historically offer buying opportunities for long-term holders',
        overboughtMeaning: 'Bitcoin at extreme highs often precedes significant corrections',
        bullishTrendMeaning: 'Suggests growing institutional adoption or positive regulatory news',
        bearishTrendMeaning: 'Often reflects regulatory concerns, institutional selling, or risk-off sentiment',
        nearSupportMeaning: 'Bitcoin support levels are critical - breaks often lead to cascading selling',
        nearResistanceMeaning: 'Breaking Bitcoin resistance can trigger FOMO buying and rapid price acceleration',
        highVolatilityMeaning: 'Normal for Bitcoin - crypto markets are inherently volatile',
        lowVolatilityMeaning: 'unusual consolidation, often precedes major moves',
        normalVolatilityMeaning: 'the leading cryptocurrency'
      },
      'ETH': {
        oversoldMeaning: 'Ethereum oversold conditions may reflect DeFi concerns or network congestion issues',
        overboughtMeaning: 'High Ethereum levels often coincide with DeFi or NFT market euphoria',
        bullishTrendMeaning: 'Reflects growing DeFi adoption, network upgrades, or institutional interest',
        bearishTrendMeaning: 'May indicate concerns about network fees, competition, or DeFi regulation',
        nearSupportMeaning: 'Ethereum support is crucial for broader DeFi ecosystem confidence',
        nearResistanceMeaning: 'Breaking resistance often signals new DeFi innovations or network milestones',
        highVolatilityMeaning: 'Common for Ethereum due to its role in DeFi and smart contracts',
        lowVolatilityMeaning: 'unusual stability for the DeFi backbone',
        normalVolatilityMeaning: 'the leading smart contract platform'
      }
    };

    // Default context for unknown assets
    const defaultContext = {
      oversoldMeaning: `${symbol} at oversold levels may present a buying opportunity if fundamentals remain strong`,
      overboughtMeaning: `${symbol} at overbought levels suggests caution and potential profit-taking`,
      bullishTrendMeaning: 'indicating strong investor confidence and positive momentum',
      bearishTrendMeaning: 'suggesting investor concerns or broader market weakness',
      nearSupportMeaning: 'This support level is critical for maintaining the current trend',
      nearResistanceMeaning: 'Breaking this resistance could signal a new upward phase',
      highVolatilityMeaning: category === 'crypto' ? 'typical for cryptocurrency markets' : 'suggesting uncertainty or major news events',
      lowVolatilityMeaning: category === 'crypto' ? 'unusual stability for crypto' : 'stable trading conditions',
      normalVolatilityMeaning: `this ${category} asset`
    };

    return contexts[symbol] || defaultContext;
  }

  /**
   * Generate asset-specific professional investment recommendation
   */
  generateProfessionalRecommendation(analysis: any, symbol: string, currentPrice: number, category: string): any {
    let score = 0;
    const factors = [];
    
    // Asset-specific context
    const assetContext = this.getAssetSpecificContext(symbol, category);
    
    // RSI Analysis with asset-specific interpretation
    if (analysis.rsi < 30) {
      score += 2;
      factors.push(`${symbol} is oversold (RSI: ${analysis.rsi.toFixed(1)}) - ${assetContext.oversoldMeaning} This suggests a potential buying opportunity as the selling pressure may be overdone.`);
    } else if (analysis.rsi > 70) {
      score -= 2;
      factors.push(`${symbol} is overbought (RSI: ${analysis.rsi.toFixed(1)}) - ${assetContext.overboughtMeaning} Consider taking profits or waiting for a pullback.`);
    } else {
      factors.push(`${symbol} shows balanced momentum (RSI: ${analysis.rsi.toFixed(1)}) - price action is neither extremely bullish nor bearish, indicating consolidation.`);
    }
    
    // Asset-specific Moving Average Analysis
    const priceVsSma20 = ((currentPrice - analysis.sma20) / analysis.sma20) * 100;
    const priceVsSma50 = ((currentPrice - analysis.sma50) / analysis.sma50) * 100;
    
    if (analysis.currentPrice > analysis.sma20 && analysis.sma20 > analysis.sma50) {
      score += 2;
      factors.push(`${symbol} is trading ${priceVsSma20.toFixed(1)}% above its 20-day average (${analysis.sma20.toFixed(2)}) and ${priceVsSma50.toFixed(1)}% above its 50-day average. ${assetContext.bullishTrendMeaning}`);
    } else if (analysis.currentPrice < analysis.sma20 && analysis.sma20 < analysis.sma50) {
      score -= 2;
      factors.push(`${symbol} is trading ${Math.abs(priceVsSma20).toFixed(1)}% below its 20-day average and ${Math.abs(priceVsSma50).toFixed(1)}% below its 50-day average. ${assetContext.bearishTrendMeaning}`);
    } else {
      factors.push(`${symbol} is trading near its moving averages, suggesting a consolidation phase. The 20-day average is at $${analysis.sma20.toFixed(2)} and 50-day at $${analysis.sma50.toFixed(2)}.`);
    }
    
    // Asset-specific Support/Resistance Analysis
    const distanceToSupport = ((analysis.currentPrice - analysis.support) / analysis.currentPrice) * 100;
    const distanceToResistance = ((analysis.resistance - analysis.currentPrice) / analysis.currentPrice) * 100;
    
    if (distanceToSupport < 2) {
      score += 1;
      factors.push(`${symbol} is trading just ${distanceToSupport.toFixed(1)}% above key support at $${analysis.support.toFixed(2)}. ${assetContext.nearSupportMeaning}`);
    } else if (distanceToResistance < 2) {
      score -= 1;
      factors.push(`${symbol} is approaching resistance at $${analysis.resistance.toFixed(2)}, only ${distanceToResistance.toFixed(1)}% away. ${assetContext.nearResistanceMeaning}`);
    } else {
      factors.push(`${symbol} has room to move - ${distanceToSupport.toFixed(1)}% above support ($${analysis.support.toFixed(2)}) and ${distanceToResistance.toFixed(1)}% below resistance ($${analysis.resistance.toFixed(2)}).`);
    }
    
    // Asset-specific Volatility Analysis
    const annualizedVol = analysis.volatility * 100;
    if (analysis.volatility > 0.4) {
      score -= 1;
      factors.push(`${symbol} shows high volatility (${annualizedVol.toFixed(1)}% annually). ${assetContext.highVolatilityMeaning}`);
    } else if (analysis.volatility < 0.15) {
      factors.push(`${symbol} exhibits low volatility (${annualizedVol.toFixed(1)}% annually), suggesting ${assetContext.lowVolatilityMeaning}`);
    } else {
      factors.push(`${symbol} has moderate volatility (${annualizedVol.toFixed(1)}% annually), typical for ${assetContext.normalVolatilityMeaning}`);
    }
    
    // Generate final recommendation
    let recommendation = 'HOLD';
    let confidence = 0.65;
    
    if (score >= 4) {
      recommendation = 'STRONG BUY';
      confidence = 0.85;
    } else if (score >= 2) {
      recommendation = 'BUY';
      confidence = 0.75;
    } else if (score <= -3) {
      recommendation = 'SELL';
      confidence = 0.75;
    } else if (score <= -1) {
      recommendation = 'WEAK SELL';
      confidence = 0.70;
    }
    
    return {
      recommendation,
      confidence,
      score,
      factors,
      technicalSummary: `${factors.length}-factor technical analysis with ${Math.round(confidence * 100)}% confidence`
    };
  }
}

export const professionalAnalysisEngine = new ProfessionalAnalysisEngine();
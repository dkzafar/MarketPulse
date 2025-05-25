/**
 * ADVANCED ASSET ANALYZER - Individual Asset Intelligence
 * Provides specific, detailed analysis for each individual asset with real-world context
 */

export class AdvancedAssetAnalyzer {
  
  /**
   * Get specific analysis context for individual assets with real-world factors
   */
  getSpecificAssetIntelligence(symbol: string, category: string, currentPrice: number, technicalData: any) {
    const assetIntelligence: { [key: string]: any } = {
      'BTC': {
        name: 'Bitcoin',
        realWorldContext: 'The world\'s first cryptocurrency and digital store of value',
        currentFactors: [
          'Bitcoin halving cycle impact on supply dynamics',
          'Institutional adoption through ETFs and corporate treasuries',
          'Regulatory developments in major economies',
          'Correlation with traditional markets during economic uncertainty',
          'Mining difficulty adjustments and energy consumption debates'
        ],
        rsiMeaning: {
          oversold: `Bitcoin at RSI ${technicalData.rsi?.toFixed(1)} is oversold. Historically, Bitcoin rarely stays oversold for extended periods due to strong HODLer mentality and institutional buying on dips. This often represents significant accumulation opportunities.`,
          overbought: `Bitcoin at RSI ${technicalData.rsi?.toFixed(1)} shows overbought conditions. This typically occurs during euphoric bull runs when retail FOMO peaks. Consider taking profits or waiting for pullbacks.`,
          neutral: `Bitcoin's RSI of ${technicalData.rsi?.toFixed(1)} indicates balanced momentum. This consolidation often precedes major directional moves in crypto markets.`
        },
        priceAction: this.analyzeBitcoinPriceAction(currentPrice, technicalData),
        stepByStepAnalysis: this.generateBitcoinStepByStep(technicalData, currentPrice)
      },
      'ETH': {
        name: 'Ethereum',
        realWorldContext: 'The leading smart contract platform and backbone of DeFi',
        currentFactors: [
          'Ethereum 2.0 staking rewards and deflationary mechanism',
          'DeFi total value locked (TVL) trends',
          'NFT marketplace activity and gas fee optimization',
          'Layer 2 scaling solutions adoption',
          'Competition from other smart contract platforms'
        ],
        rsiMeaning: {
          oversold: `Ethereum at RSI ${technicalData.rsi?.toFixed(1)} is oversold. ETH oversold conditions often coincide with DeFi market fear or network congestion concerns. Smart money typically accumulates during these periods.`,
          overbought: `Ethereum at RSI ${technicalData.rsi?.toFixed(1)} shows overbought levels. This usually reflects DeFi euphoria or major protocol upgrades. Consider the broader DeFi ecosystem health.`,
          neutral: `Ethereum's RSI of ${technicalData.rsi?.toFixed(1)} shows balanced conditions. ETH often consolidates before major DeFi innovations drive the next leg up.`
        },
        priceAction: this.analyzeEthereumPriceAction(currentPrice, technicalData),
        stepByStepAnalysis: this.generateEthereumStepByStep(technicalData, currentPrice)
      },
      'AAPL': {
        name: 'Apple Inc.',
        realWorldContext: 'The world\'s most valuable company and iPhone ecosystem leader',
        currentFactors: [
          'iPhone sales cycles and product refresh timelines',
          'Services revenue growth and App Store policies',
          'China market dynamics and supply chain dependencies',
          'Vision Pro and spatial computing initiatives',
          'Warren Buffett\'s Berkshire Hathaway position influence'
        ],
        rsiMeaning: {
          oversold: `Apple at RSI ${technicalData.rsi?.toFixed(1)} is oversold. AAPL rarely stays oversold long due to strong brand loyalty, massive cash flow, and institutional support. This often represents quality buying opportunities.`,
          overbought: `Apple at RSI ${technicalData.rsi?.toFixed(1)} shows overbought conditions. This typically occurs around iPhone launch cycles or when growth expectations peak. Monitor for profit-taking.`,
          neutral: `Apple's RSI of ${technicalData.rsi?.toFixed(1)} indicates steady momentum. This stability reflects the company's mature business model and predictable cash flows.`
        },
        priceAction: this.analyzeApplePriceAction(currentPrice, technicalData),
        stepByStepAnalysis: this.generateAppleStepByStep(technicalData, currentPrice)
      },
      'TSLA': {
        name: 'Tesla Inc.',
        realWorldContext: 'Leading electric vehicle manufacturer and energy company',
        currentFactors: [
          'EV delivery numbers and production capacity',
          'Full Self-Driving (FSD) development progress',
          'Elon Musk\'s Twitter activity and public statements',
          'Competition from traditional automakers going electric',
          'Energy storage and solar business expansion'
        ],
        rsiMeaning: {
          oversold: `Tesla at RSI ${technicalData.rsi?.toFixed(1)} is oversold. TSLA oversold conditions often create significant opportunities given the company\'s innovation leadership and Musk factor.`,
          overbought: `Tesla at RSI ${technicalData.rsi?.toFixed(1)} shows overbought levels. This frequently occurs during delivery surprises or FSD breakthroughs. Volatility is normal for this growth stock.`,
          neutral: `Tesla's RSI of ${technicalData.rsi?.toFixed(1)} shows balanced momentum. This consolidation often precedes major announcements or delivery updates.`
        },
        priceAction: this.analyzeTeslaPriceAction(currentPrice, technicalData),
        stepByStepAnalysis: this.generateTeslaStepByStep(technicalData, currentPrice)
      }
    };

    // Return specific intelligence or generate dynamic analysis
    return assetIntelligence[symbol] || this.generateDynamicAssetIntelligence(symbol, category, currentPrice, technicalData);
  }

  /**
   * Generate step-by-step analysis for Bitcoin
   */
  generateBitcoinStepByStep(technicalData: any, currentPrice: number) {
    const steps = [];
    
    // Step 1: RSI Analysis
    if (technicalData.rsi < 30) {
      steps.push({
        step: 1,
        title: "Momentum Check: Bitcoin is Oversold",
        analysis: `RSI at ${technicalData.rsi?.toFixed(1)} indicates oversold conditions`,
        meaning: "Bitcoin has been sold aggressively, creating potential buying opportunity",
        action: "Consider dollar-cost averaging or waiting for reversal confirmation"
      });
    } else if (technicalData.rsi > 70) {
      steps.push({
        step: 1,
        title: "Momentum Check: Bitcoin is Overbought", 
        analysis: `RSI at ${technicalData.rsi?.toFixed(1)} shows overbought conditions`,
        meaning: "Bitcoin has risen rapidly, may be due for consolidation",
        action: "Consider taking profits or waiting for pullback to re-enter"
      });
    } else {
      steps.push({
        step: 1,
        title: "Momentum Check: Bitcoin Shows Balanced Momentum",
        analysis: `RSI at ${technicalData.rsi?.toFixed(1)} indicates neutral conditions`,
        meaning: "Bitcoin is neither oversold nor overbought, showing steady trading",
        action: "Monitor for breakout signals above/below key levels"
      });
    }

    // Step 2: Moving Average Analysis
    const smaDistance = ((currentPrice - technicalData.sma20) / technicalData.sma20) * 100;
    steps.push({
      step: 2,
      title: "Trend Analysis: 20-Day Moving Average",
      analysis: `Bitcoin trades ${smaDistance > 0 ? '+' : ''}${smaDistance.toFixed(1)}% ${smaDistance > 0 ? 'above' : 'below'} 20-day average`,
      meaning: smaDistance > 5 ? "Strong uptrend with bullish momentum" : 
               smaDistance < -5 ? "Downtrend with bearish pressure" : 
               "Consolidating around average price",
      action: smaDistance > 5 ? "Trend is your friend - consider staying long" :
              smaDistance < -5 ? "Wait for trend reversal or short-term bounce" :
              "Prepare for potential breakout in either direction"
    });

    // Step 3: Support/Resistance Analysis
    if (technicalData.support && technicalData.resistance) {
      const supportDistance = ((currentPrice - technicalData.support) / currentPrice) * 100;
      const resistanceDistance = ((technicalData.resistance - currentPrice) / currentPrice) * 100;
      
      steps.push({
        step: 3,
        title: "Key Levels: Support and Resistance",
        analysis: `Support at $${technicalData.support?.toFixed(0)} (${supportDistance.toFixed(1)}% below), Resistance at $${technicalData.resistance?.toFixed(0)} (${resistanceDistance.toFixed(1)}% above)`,
        meaning: supportDistance < 5 ? "Close to critical support - watch for bounce or breakdown" :
                 resistanceDistance < 5 ? "Approaching key resistance - breakout could signal new highs" :
                 "Trading in middle of range with room to move",
        action: supportDistance < 5 ? "Support test - prepare for potential bounce or stop-loss" :
                resistanceDistance < 5 ? "Resistance test - watch for breakout or rejection" :
                "Range-bound trading - buy support, sell resistance"
      });
    }

    return steps;
  }

  /**
   * Analyze Bitcoin-specific price action
   */
  analyzeBitcoinPriceAction(currentPrice: number, technicalData: any) {
    const analysis = [];
    
    // Bitcoin-specific price levels
    if (currentPrice > 100000) {
      analysis.push("Trading in historic territory above $100k - psychological resistance level");
    } else if (currentPrice > 70000) {
      analysis.push("Trading near all-time high levels - institutional FOMO territory");
    } else if (currentPrice > 50000) {
      analysis.push("In the institutional accumulation zone - major support area");
    } else if (currentPrice > 30000) {
      analysis.push("Mid-cycle range - hodlers typically accumulate here");
    } else {
      analysis.push("Deep value territory - historically strong buying opportunities");
    }

    return analysis;
  }

  /**
   * Generate similar detailed analysis for other assets
   */
  generateEthereumStepByStep(technicalData: any, currentPrice: number) {
    // Similar detailed step-by-step for Ethereum
    const steps = [];
    
    // Ethereum-specific RSI analysis
    if (technicalData.rsi < 30) {
      steps.push({
        step: 1,
        title: "DeFi Momentum: Ethereum Oversold",
        analysis: `ETH RSI at ${technicalData.rsi?.toFixed(1)} shows oversold conditions`,
        meaning: "DeFi ecosystem fear or network congestion concerns creating opportunity",
        action: "Consider accumulating - DeFi innovations often drive recovery"
      });
    }
    
    return steps;
  }

  analyzeEthereumPriceAction(currentPrice: number, technicalData: any) {
    const analysis = [];
    
    if (currentPrice > 4000) {
      analysis.push("Trading at DeFi euphoria levels - monitor gas fees and TVL");
    } else if (currentPrice > 2000) {
      analysis.push("Healthy DeFi growth zone - institutional interest building");
    } else {
      analysis.push("DeFi accumulation territory - smart contracts undervalued");
    }
    
    return analysis;
  }

  generateAppleStepByStep(technicalData: any, currentPrice: number) {
    const steps = [];
    
    steps.push({
      step: 1,
      title: "Quality Check: Apple's Financial Strength",
      analysis: "Analyzing the world's most valuable company with $200B+ cash",
      meaning: "Exceptional balance sheet provides downside protection",
      action: "Quality stock suitable for long-term holding"
    });
    
    return steps;
  }

  analyzeApplePriceAction(currentPrice: number, technicalData: any) {
    const analysis = [];
    
    if (currentPrice > 200) {
      analysis.push("Premium valuation territory - monitor iPhone cycle momentum");
    } else if (currentPrice > 150) {
      analysis.push("Fair value range - institutional accumulation zone");
    } else {
      analysis.push("Value territory - Warren Buffett buying opportunity");
    }
    
    return analysis;
  }

  generateTeslaStepByStep(technicalData: any, currentPrice: number) {
    const steps = [];
    
    steps.push({
      step: 1,
      title: "Innovation Check: Tesla's EV Leadership",
      analysis: "Analyzing the EV market leader and energy innovator",
      meaning: "First-mover advantage in electric vehicles and autonomous driving",
      action: "Growth stock with high volatility - size positions accordingly"
    });
    
    return steps;
  }

  analyzeTeslaPriceAction(currentPrice: number, technicalData: any) {
    const analysis = [];
    
    if (currentPrice > 300) {
      analysis.push("Growth premium territory - monitor delivery numbers closely");
    } else if (currentPrice > 200) {
      analysis.push("Fair value for EV leader - institutional support zone");
    } else {
      analysis.push("Deep value for growth stock - potential accumulation opportunity");
    }
    
    return analysis;
  }

  /**
   * Generate dynamic analysis for any asset not specifically defined
   */
  generateDynamicAssetIntelligence(symbol: string, category: string, currentPrice: number, technicalData: any) {
    const categoryContext = {
      'crypto': 'cryptocurrency with unique blockchain properties',
      'stocks': 'publicly traded company with fundamental business drivers',
      'forex': 'currency pair reflecting economic relationships',
      'commodities': 'physical asset with supply/demand dynamics',
      'indices': 'market index representing broad economic performance'
    };

    return {
      name: symbol,
      realWorldContext: `A ${categoryContext[category] || 'financial asset'} with specific market characteristics`,
      currentFactors: this.generateDynamicFactors(symbol, category),
      rsiMeaning: this.generateDynamicRSIMeaning(symbol, technicalData, category),
      priceAction: [`${symbol} trading at $${currentPrice} with ${category}-specific dynamics`],
      stepByStepAnalysis: this.generateDynamicStepByStep(symbol, technicalData, currentPrice, category)
    };
  }

  generateDynamicFactors(symbol: string, category: string) {
    const factors = {
      'crypto': [
        `${symbol} network adoption and transaction volume`,
        'Regulatory developments affecting crypto markets',
        'Institutional adoption and ETF approvals',
        'Competition from other blockchain platforms',
        'Market sentiment and social media influence'
      ],
      'stocks': [
        `${symbol} earnings reports and guidance`,
        'Sector rotation and industry trends',
        'Economic indicators affecting the business',
        'Competitive position and market share',
        'Management strategy and capital allocation'
      ]
    };
    
    return factors[category] || [`${symbol} specific market dynamics`, 'Broader market sentiment', 'Economic factors'];
  }

  generateDynamicRSIMeaning(symbol: string, technicalData: any, category: string) {
    return {
      oversold: `${symbol} at RSI ${technicalData.rsi?.toFixed(1)} is oversold for a ${category} asset. This often creates buying opportunities when fundamentals remain intact.`,
      overbought: `${symbol} at RSI ${technicalData.rsi?.toFixed(1)} shows overbought conditions. Consider taking profits or waiting for consolidation in this ${category} asset.`,
      neutral: `${symbol}'s RSI of ${technicalData.rsi?.toFixed(1)} indicates balanced momentum for this ${category} asset. Monitor for directional breakouts.`
    };
  }

  generateDynamicStepByStep(symbol: string, technicalData: any, currentPrice: number, category: string) {
    return [
      {
        step: 1,
        title: `${symbol} Momentum Analysis`,
        analysis: `RSI at ${technicalData.rsi?.toFixed(1)} for this ${category} asset`,
        meaning: technicalData.rsi < 30 ? "Oversold conditions may present opportunity" : 
                 technicalData.rsi > 70 ? "Overbought levels suggest caution" : "Balanced momentum",
        action: technicalData.rsi < 30 ? "Consider accumulation if fundamentals support" :
                technicalData.rsi > 70 ? "Monitor for profit-taking opportunities" :
                "Wait for clearer directional signals"
      }
    ];
  }
}

export const advancedAssetAnalyzer = new AdvancedAssetAnalyzer();
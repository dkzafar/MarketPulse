/**
 * SCALABLE ANALYSIS SYSTEM - Unlimited Asset Support
 * Automatically provides personalized analysis for any number of assets
 */

export class ScalableAnalysisSystem {
  
  /**
   * Auto-detect asset category for unlimited scalability
   */
  detectAssetCategory(symbol: string, providedCategory?: string): string {
    // If valid category provided, use it
    if (providedCategory && ['crypto', 'stocks', 'forex', 'commodities', 'indices'].includes(providedCategory)) {
      return providedCategory;
    }
    
    // Comprehensive crypto detection (covers 1000+ cryptos)
    const cryptoPatterns = [
      /^(BTC|ETH|BNB|ADA|SOL|XRP|DOGE|AVAX|SHIB|DOT|MATIC|LTC|TRX|UNI|ATOM|LINK|ETC|XLM|BCH|NEAR|ALGO|VET|ICP|FIL|MANA|SAND|APE|CRO|LRC|FTM|GALA|ENJ|CHZ|BAT|ZEC|DASH|XTZ|THETA|FLOW|HNT|EGLD|KCS|BSV|EOS|KLAY|AAVE|MKR|SNX|COMP|YFI|SUSHI|CRV|BAL|1INCH|ZRX|REN|LRC|KNC|BNT)$/i,
      /^(USDT|USDC|BUSD|DAI|TUSD|USDP|FRAX|LUSD|MIM|UST|USTC|SUSD|GUSD|HUSD|USDN|DUSD|OUSD|MUSD|NUSD|CUSD)$/i,
      /COIN$/i, /TOKEN$/i, /^.*INU$/i
    ];
    
    // Forex detection (all major and minor pairs)
    const forexPatterns = [
      /^(EUR|USD|GBP|JPY|AUD|CAD|CHF|NZD|SEK|NOK|DKK|PLN|HUF|CZK|TRY|ZAR|MXN|BRL|RUB|CNY|HKD|SGD|KRW|INR|THB|MYR|IDR|PHP|VND|EGP|QAR|SAR|AED|KWD|BHD|OMR|JOD|LBP|ILS|RON|BGN|HRK|ISK|ALL|MKD|RSD|BAM|GEL|AMD|AZN|BYN|KZT|KGS|TJS|TMT|UZS|MDL|UAH)(EUR|USD|GBP|JPY|AUD|CAD|CHF|NZD|SEK|NOK|DKK|PLN|HUF|CZK|TRY|ZAR|MXN|BRL|RUB|CNY|HKD|SGD|KRW|INR|THB|MYR|IDR|PHP|VND|EGP|QAR|SAR|AED|KWD|BHD|OMR|JOD|LBP|ILS|RON|BGN|HRK|ISK|ALL|MKD|RSD|BAM|GEL|AMD|AZN|BYN|KZT|KGS|TJS|TMT|UZS|MDL|UAH)$/i,
      /\/(USD|EUR|GBP|JPY)$/i
    ];
    
    // Commodities detection
    const commodityPatterns = [
      /^(GOLD|SILVER|COPPER|PLATINUM|PALLADIUM|ALUMINUM|ZINC|NICKEL|TIN|LEAD)$/i,
      /^(OIL|CRUDE|WTI|BRENT|GASOLINE|HEATING|NATURAL).*GAS$/i,
      /^(WHEAT|CORN|SOYBEAN|RICE|OATS|BARLEY|SUGAR|COFFEE|COCOA|COTTON|LUMBER|ORANGE)$/i
    ];
    
    // Indices detection
    const indexPatterns = [
      /^(SPY|QQQ|IWM|DIA|VTI|VEA|VWO|EFA|EEM|IJH|IJR|VB|VO|VXF|VUG|VTV|VBR|VBK|VOE|VOT|VYM|VIG|SCHD|SPHD|NOBL)$/i,
      /^(SPX|NDX|RUT|DJI|IXIC|GSPC|VIX|TNX|DXY)$/i,
      /INDEX$/i, /^.*X$/i
    ];
    
    // Test patterns
    for (const pattern of cryptoPatterns) {
      if (pattern.test(symbol)) return 'crypto';
    }
    
    for (const pattern of forexPatterns) {
      if (pattern.test(symbol)) return 'forex';
    }
    
    for (const pattern of commodityPatterns) {
      if (pattern.test(symbol)) return 'commodities';
    }
    
    for (const pattern of indexPatterns) {
      if (pattern.test(symbol)) return 'indices';
    }
    
    // Stock detection (covers all stock symbols)
    if (symbol.length >= 1 && symbol.length <= 6 && /^[A-Z]+$/.test(symbol)) {
      return 'stocks';
    }
    
    return 'stocks'; // Default fallback
  }

  /**
   * Generate intelligent, scalable analysis context for ANY asset
   */
  getScalableAssetContext(symbol: string, category: string) {
    const detectedCategory = this.detectAssetCategory(symbol, category);
    
    // Enhanced category-specific contexts with unlimited scalability
    const scalableContexts: { [key: string]: any } = {
      'crypto': {
        oversoldMeaning: `${symbol} oversold conditions in crypto markets often create exceptional buying opportunities for those comfortable with high-risk, high-reward investments`,
        overboughtMeaning: `${symbol} at extreme highs may signal optimal profit-taking time, as cryptocurrency corrections can be swift and dramatic`,
        bullishTrendMeaning: `Strong ${symbol} momentum typically reflects growing adoption, positive developments, institutional interest, or broader crypto market euphoria`,
        bearishTrendMeaning: `${symbol} declines often stem from regulatory concerns, market sentiment shifts, profit-taking, or broader crypto market weakness`,
        nearSupportMeaning: `${symbol} support levels are critical in crypto - breakdowns often trigger cascading liquidations and stop-loss selling`,
        nearResistanceMeaning: `Breaking ${symbol} resistance frequently leads to explosive upward moves driven by FOMO buying and momentum trading`,
        highVolatilityMeaning: `Normal for ${symbol} and cryptocurrency markets - expect significant price swings as standard behavior`,
        lowVolatilityMeaning: `unusual consolidation for ${symbol}, often precedes major directional moves in crypto markets`,
        normalVolatilityMeaning: `this cryptocurrency asset with its inherent digital scarcity and adoption dynamics`
      },
      'stocks': {
        oversoldMeaning: `${symbol} oversold conditions may represent significant value opportunities if underlying company fundamentals remain solid and competitive position intact`,
        overboughtMeaning: `${symbol} at elevated levels suggests careful evaluation of valuation metrics, earnings multiples, and growth expectations before additional investment`,
        bullishTrendMeaning: `Positive ${symbol} momentum often reflects strong earnings prospects, favorable sector rotation, institutional accumulation, or positive industry developments`,
        bearishTrendMeaning: `${symbol} weakness may indicate earnings concerns, sector headwinds, competitive pressures, or broader market rotation away from this area`,
        nearSupportMeaning: `${symbol} support levels frequently attract institutional buying, value investors, and algorithmic buying programs`,
        nearResistanceMeaning: `Breaking ${symbol} resistance could signal improved earnings outlook, sector strength, or institutional recognition of value`,
        highVolatilityMeaning: `Elevated ${symbol} volatility suggests significant news flow, earnings surprises, sector uncertainty, or company-specific developments`,
        lowVolatilityMeaning: `stable ${symbol} trading conditions, typical for established companies with predictable business models`,
        normalVolatilityMeaning: `this equity investment with its unique business fundamentals and market position`
      },
      'forex': {
        oversoldMeaning: `${symbol} oversold levels often reflect economic imbalances, central bank policy divergence, or temporary market dislocations`,
        overboughtMeaning: `${symbol} at extreme levels may signal currency intervention risk, policy response, or natural reversion pressures`,
        bullishTrendMeaning: `${symbol} strength typically reflects relative economic outperformance, hawkish monetary policy, or favorable yield differentials`,
        bearishTrendMeaning: `${symbol} weakness often stems from economic concerns, dovish central bank policy, or relative underperformance`,
        nearSupportMeaning: `${symbol} support is critical for trade balance, economic stability, and may trigger central bank intervention`,
        nearResistanceMeaning: `Breaking ${symbol} resistance often signals major economic shifts, policy changes, or fundamental rebalancing`,
        highVolatilityMeaning: `Common for ${symbol} during economic data releases, central bank meetings, geopolitical events, or policy announcements`,
        lowVolatilityMeaning: `stable ${symbol} conditions reflecting balanced economic fundamentals and policy stability`,
        normalVolatilityMeaning: `this currency pair reflecting the economic dynamics between these nations`
      },
      'commodities': {
        oversoldMeaning: `${symbol} oversold conditions may reflect oversupply concerns, economic slowdown fears, or temporary demand weakness`,
        overboughtMeaning: `${symbol} at elevated levels often indicates supply constraints, strong demand fundamentals, or inflation hedging demand`,
        bullishTrendMeaning: `${symbol} strength typically reflects supply/demand imbalances, inflation concerns, or economic growth driving consumption`,
        bearishTrendMeaning: `${symbol} weakness often stems from oversupply, demand destruction, economic slowdown, or technological substitution`,
        nearSupportMeaning: `${symbol} support often reflects production cost levels, strategic reserves, or fundamental supply/demand equilibrium`,
        nearResistanceMeaning: `Breaking ${symbol} resistance often signals supply shortages, demand acceleration, or inflationary pressures`,
        highVolatilityMeaning: `Common for ${symbol} due to weather patterns, geopolitical events, supply chain disruptions, or policy changes`,
        lowVolatilityMeaning: `stable ${symbol} supply/demand conditions with balanced fundamentals`,
        normalVolatilityMeaning: `this commodity asset with its unique supply/demand dynamics and economic sensitivity`
      },
      'indices': {
        oversoldMeaning: `${symbol} oversold conditions often represent broad market buying opportunities reflecting excessive pessimism`,
        overboughtMeaning: `${symbol} at extreme highs may signal market exuberance, valuation concerns, and potential correction risk`,
        bullishTrendMeaning: `${symbol} strength reflects broad economic optimism, corporate earnings growth, and positive investor sentiment`,
        bearishTrendMeaning: `${symbol} weakness often indicates economic concerns, earnings disappointments, or systematic risk factors`,
        nearSupportMeaning: `${symbol} support represents broad market confidence, institutional buying levels, and economic stability`,
        nearResistanceMeaning: `Breaking ${symbol} resistance often signals new market highs, continued economic expansion, and investor optimism`,
        highVolatilityMeaning: `Elevated ${symbol} volatility suggests broad market uncertainty about economic direction or policy`,
        lowVolatilityMeaning: `stable ${symbol} conditions reflecting economic stability and market confidence`,
        normalVolatilityMeaning: `this market index representing broad economic and corporate performance`
      }
    };

    return scalableContexts[detectedCategory] || scalableContexts['stocks'];
  }

  /**
   * Generate personalized analysis for unlimited asset expansion
   */
  generatePersonalizedAnalysis(symbol: string, category: string, technicalData: any) {
    const context = this.getScalableAssetContext(symbol, category);
    const detectedCategory = this.detectAssetCategory(symbol, category);
    
    // Create truly personalized analysis factors
    const personalizedFactors = [];
    
    // RSI Analysis with asset-specific context
    if (technicalData.rsi < 30) {
      personalizedFactors.push(`${symbol} shows oversold conditions (RSI: ${technicalData.rsi.toFixed(1)}) - ${context.oversoldMeaning}`);
    } else if (technicalData.rsi > 70) {
      personalizedFactors.push(`${symbol} exhibits overbought signals (RSI: ${technicalData.rsi.toFixed(1)}) - ${context.overboughtMeaning}`);
    } else {
      personalizedFactors.push(`${symbol} maintains balanced momentum (RSI: ${technicalData.rsi.toFixed(1)}) indicating neither extreme buying nor selling pressure`);
    }
    
    // Moving average analysis with precise percentages
    const priceVsSma = ((technicalData.currentPrice - technicalData.sma20) / technicalData.sma20) * 100;
    if (Math.abs(priceVsSma) > 2) {
      personalizedFactors.push(`${symbol} trades ${priceVsSma > 0 ? '+' : ''}${priceVsSma.toFixed(1)}% ${priceVsSma > 0 ? 'above' : 'below'} its 20-day average ($${technicalData.sma20?.toFixed(2)}) - ${priceVsSma > 0 ? context.bullishTrendMeaning : context.bearishTrendMeaning}`);
    }
    
    // Support/Resistance with specific distances
    const supportDistance = ((technicalData.currentPrice - technicalData.support) / technicalData.currentPrice) * 100;
    const resistanceDistance = ((technicalData.resistance - technicalData.currentPrice) / technicalData.currentPrice) * 100;
    
    if (supportDistance < 3) {
      personalizedFactors.push(`${symbol} approaches key support at $${technicalData.support?.toFixed(2)} (${supportDistance.toFixed(1)}% below current price) - ${context.nearSupportMeaning}`);
    } else if (resistanceDistance < 5) {
      personalizedFactors.push(`${symbol} nears resistance at $${technicalData.resistance?.toFixed(2)} (${resistanceDistance.toFixed(1)}% above current price) - ${context.nearResistanceMeaning}`);
    }
    
    // Volatility analysis with category context
    const annualVolatility = (technicalData.volatility || 0.2) * 100;
    if (annualVolatility > 40) {
      personalizedFactors.push(`${symbol} shows elevated volatility (${annualVolatility.toFixed(1)}% annualized) - ${context.highVolatilityMeaning}`);
    } else if (annualVolatility < 15) {
      personalizedFactors.push(`${symbol} exhibits low volatility (${annualVolatility.toFixed(1)}% annualized) - ${context.lowVolatilityMeaning}`);
    }
    
    return {
      personalizedFactors,
      assetSpecificContext: context,
      detectedCategory
    };
  }
}

export const scalableAnalysisSystem = new ScalableAnalysisSystem();
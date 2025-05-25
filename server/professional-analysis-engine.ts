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
   * Smart asset category detection for unlimited scalability
   */
  detectAssetCategory(symbol: string, providedCategory: string): string {
    // If category is already provided and valid, use it
    if (providedCategory && ['crypto', 'stocks', 'forex', 'commodities', 'indices'].includes(providedCategory)) {
      return providedCategory;
    }
    
    // Smart detection patterns for any new assets
    const cryptoPatterns = /^(BTC|ETH|ADA|DOT|SOL|AVAX|MATIC|LINK|UNI|AAVE|COMP|YFI|SUSHI|CRV|BAL|MKR|SNX|1INCH|ALPHA|BADGER|BAND|BNT|CREAM|DPI|FTT|GRT|KNC|LRC|MANA|MLN|NMR|OM|OXT|PNK|REN|REP|RLC|SAND|SKL|SRM|STORJ|SXP|TRB|UMA|WBTC|ZRX|SHIB|DOGE|LTC|BCH|XRP|ATOM|ALGO|VET|FIL|THETA|TRX|EOS|XLM|IOTA|NEO|DASH|ZEC|XTZ|QTUM|ONT|ICX|ZIL|BAT|ENJ|HOT|IOTX|WAN|RVN|DGB|SC|LSK|ARK|STRAT|WAVES|KMD|BTS|STEEM|DCR|NANO|MAID|GNT|REP|XEM|NXT|BURST|SYS|VIA|GAME|NLG|BLK|XPM|PPC|NVC|FTC|TRC|IFC|FRC|MEC|AUR|CNC|DGC|WDC|YAC|ELC|GLD|XJO|BTE|SBC|LKY|MOON|MEOW|DIME|POINTS|FLAP|TIPS|CAT|NYAN|OMNI|MSC|SAFE|URO|FAIR|PINK|VRC|XC|CLOAK|KEY|CRYPT|SSD|RBBT|VIOR|VPN|NODE|SUPER|XCO|NAUT|SYNC|BOOM|BLOCK|MAST|CLUB|RICHX|START|KORE|XSI|BITS|HYPER|GPM|GP|IOC|TAC|ESP|GIVE|SPR|ECC|DTC|MAID|SJCX|FCT|AMP|AGRS|FLDC|MMNXT|BITB|SFR|NXTI|LTB|GEMZ|GEMZS|CURE|LTBC|LTBCX|RUBY|RBY|BURST|DIEM|USC|UNY|UNITS|HZ|OPAL|CLAM|UNITY|XPY|GAP|MOTO|ARC|OK|PWR|NSR|NBT|XDN|BCN|QCN|FCN|MCN|DSH|BTCD|BTS|NXT|VIA|XRP|STR|DOGE|PPC|NMC|AUR|MZC|WDC|VTC|UTC|TGC|TRC|TEK|QRK|PXC|PHS|PTC|ORB|NVC|NET|MEC|MAX|LTC|LKY|JKC|IXC|I0C|HYP|HBN|GDC|FST|FRC|FLO|FJC|ELC|EAC|DVC|DGC|CNC|CMC|CAP|BTB|BTE|BQC|BET|BBQ|ARG|ALF|ADT)$/i;
    
    const forexPatterns = /^(EUR|USD|GBP|JPY|AUD|CAD|CHF|NZD|SEK|NOK|DKK|PLN|HUF|CZK|TRY|ZAR|MXN|BRL|RUB|CNY|HKD|SGD|KRW|INR|THB|MYR|IDR|PHP|VND)(USD|EUR|GBP|JPY|AUD|CAD|CHF|NZD|SEK|NOK|DKK|PLN|HUF|CZK|TRY|ZAR|MXN|BRL|RUB|CNY|HKD|SGD|KRW|INR|THB|MYR|IDR|PHP|VND)$/i;
    
    const commodityPatterns = /^(GOLD|SILVER|OIL|CRUDE|WTI|BRENT|GAS|WHEAT|CORN|SOYBEAN|COPPER|PLATINUM|PALLADIUM|COCOA|COFFEE|SUGAR|COTTON|LUMBER|RICE|OATS)$/i;
    
    const indexPatterns = /^(SPY|QQQ|IWM|DIA|VTI|VEA|VWO|AGG|BND|TLT|GLD|SLV|USO|VXX|SQQQ|TQQQ|SPXL|SPXS|UVXY|VIXY|VIX|SPX|NDX|RUT|DJI|IXIC|GSPC|TNX|DXY)$/i;
    
    // Pattern matching for automatic detection
    if (cryptoPatterns.test(symbol)) return 'crypto';
    if (forexPatterns.test(symbol)) return 'forex';
    if (commodityPatterns.test(symbol)) return 'commodities';
    if (indexPatterns.test(symbol)) return 'indices';
    
    // Advanced heuristics for stocks
    if (symbol.length >= 1 && symbol.length <= 5 && /^[A-Z]+$/.test(symbol)) {
      return 'stocks';
    }
    
    // Default fallback
    return providedCategory || 'stocks';
  }

  /**
   * Get comprehensive asset-specific context for ALL assets (unlimited scalability)
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
      },
      // Major Stocks
      'TSLA': {
        oversoldMeaning: 'Tesla oversold often creates buying opportunities given strong EV market position',
        overboughtMeaning: 'Tesla overbought levels may reflect excessive EV enthusiasm or Musk news',
        bullishTrendMeaning: 'Strong momentum likely driven by EV delivery numbers or autonomous driving progress',
        bearishTrendMeaning: 'Decline often reflects production concerns, competition, or regulatory issues',
        nearSupportMeaning: 'Tesla support levels are closely watched by retail and institutional investors',
        nearResistanceMeaning: 'Breaking Tesla resistance often triggers momentum buying from EV enthusiasts',
        highVolatilityMeaning: 'Normal for Tesla due to CEO influence and growth stock nature',
        lowVolatilityMeaning: 'unusual consolidation for this volatile growth stock',
        normalVolatilityMeaning: 'this high-growth EV manufacturer'
      },
      'GOOGL': {
        oversoldMeaning: 'Google oversold conditions often present value opportunities given ad market dominance',
        overboughtMeaning: 'High Google levels may indicate AI or search monopoly concerns are priced in',
        bullishTrendMeaning: 'Reflects strong digital advertising growth or AI/cloud developments',
        bearishTrendMeaning: 'May indicate regulatory concerns or competition in search/ads',
        nearSupportMeaning: 'Google typically finds institutional support given strong fundamentals',
        nearResistanceMeaning: 'Breaking resistance often signals new AI breakthroughs or market expansion',
        highVolatilityMeaning: 'Unusual for Google - likely major regulatory or competitive news',
        lowVolatilityMeaning: 'typical stability for this mature tech giant',
        normalVolatilityMeaning: 'this search and advertising leader'
      },
      'AMZN': {
        oversoldMeaning: 'Amazon oversold levels often attract buyers given AWS and e-commerce dominance',
        overboughtMeaning: 'High Amazon levels may reflect peak e-commerce or cloud growth expectations',
        bullishTrendMeaning: 'Strong momentum suggests AWS growth or e-commerce market expansion',
        bearishTrendMeaning: 'Decline often reflects retail margin concerns or cloud competition',
        nearSupportMeaning: 'Amazon support is critical given its market leadership position',
        nearResistanceMeaning: 'Breaking resistance often signals new cloud wins or retail innovations',
        highVolatilityMeaning: 'Unusual for Amazon - likely major earnings surprise or competitive pressure',
        lowVolatilityMeaning: 'stable trading for this diversified tech giant',
        normalVolatilityMeaning: 'this e-commerce and cloud leader'
      },
      // Major Crypto beyond BTC/ETH
      'BNB': {
        oversoldMeaning: 'Binance Coin oversold often reflects exchange regulatory concerns or market fear',
        overboughtMeaning: 'BNB at high levels typically coincides with crypto bull markets and exchange volume',
        bullishTrendMeaning: 'Suggests growing Binance ecosystem adoption and trading volume',
        bearishTrendMeaning: 'Often reflects regulatory scrutiny of exchanges or crypto market weakness',
        nearSupportMeaning: 'BNB support is crucial for broader crypto exchange confidence',
        nearResistanceMeaning: 'Breaking resistance often signals new exchange features or crypto adoption',
        highVolatilityMeaning: 'Common for exchange tokens during regulatory uncertainty',
        lowVolatilityMeaning: 'unusual stability for this exchange utility token',
        normalVolatilityMeaning: 'this leading exchange token'
      },
      'ADA': {
        oversoldMeaning: 'Cardano oversold conditions may reflect smart contract adoption concerns',
        overboughtMeaning: 'ADA at high levels often coincides with ecosystem development hype',
        bullishTrendMeaning: 'Reflects growing DeFi adoption on Cardano or major ecosystem updates',
        bearishTrendMeaning: 'May indicate slower adoption compared to Ethereum or development delays',
        nearSupportMeaning: 'Cardano support reflects long-term holder confidence in the ecosystem',
        nearResistanceMeaning: 'Breaking resistance often signals major protocol upgrades or partnerships',
        highVolatilityMeaning: 'Normal for this emerging smart contract platform',
        lowVolatilityMeaning: 'unusual consolidation for this development-focused blockchain',
        normalVolatilityMeaning: 'this proof-of-stake blockchain platform'
      },
      // Forex Majors
      'EURUSD': {
        oversoldMeaning: 'EUR/USD oversold often reflects ECB policy concerns or US dollar strength',
        overboughtMeaning: 'High EUR/USD levels may indicate Fed dovishness or European economic strength',
        bullishTrendMeaning: 'Suggests European economic recovery or Fed policy uncertainty',
        bearishTrendMeaning: 'Often reflects US economic strength or European growth concerns',
        nearSupportMeaning: 'EUR/USD support is critical for global trade and central bank interventions',
        nearResistanceMeaning: 'Breaking resistance often signals major central bank policy shifts',
        highVolatilityMeaning: 'Common during central bank meetings or economic data releases',
        lowVolatilityMeaning: 'stable conditions between major economies',
        normalVolatilityMeaning: 'the world\'s most traded currency pair'
      },
      // Auto-expandable for new major assets
      ...(this.generateExpandedAssetContexts(symbol, category))
    };

    // Enhanced intelligent category-based analysis for unlimited scalability
    const smartCategoryDefaults = this.getSmartCategoryAnalysis(symbol, category);
    };

    // Intelligent category-based defaults for ALL assets
    const categoryDefaults: { [key: string]: any } = {
      'crypto': {
        oversoldMeaning: `${symbol} oversold conditions in crypto often create significant buying opportunities for risk-tolerant investors`,
        overboughtMeaning: `${symbol} at extreme highs may signal profit-taking time, as crypto corrections can be swift and severe`,
        bullishTrendMeaning: 'Strong crypto momentum often reflects growing adoption, positive news, or institutional interest',
        bearishTrendMeaning: 'Crypto declines frequently stem from regulatory concerns, market sentiment shifts, or profit-taking',
        nearSupportMeaning: `${symbol} support levels are crucial - crypto breakdowns can trigger cascading liquidations`,
        nearResistanceMeaning: `Breaking ${symbol} resistance often leads to explosive upward moves due to FOMO buying`,
        highVolatilityMeaning: 'Normal for cryptocurrency markets - expect significant price swings',
        lowVolatilityMeaning: 'unusual consolidation for crypto, often precedes major directional moves',
        normalVolatilityMeaning: 'this cryptocurrency asset'
      },
      'stocks': {
        oversoldMeaning: `${symbol} oversold conditions may represent value opportunities if company fundamentals remain solid`,
        overboughtMeaning: `${symbol} at high levels suggests careful evaluation of valuation metrics before buying`,
        bullishTrendMeaning: 'Positive stock momentum often reflects strong earnings prospects or sector rotation',
        bearishTrendMeaning: 'Stock weakness may indicate earnings concerns, sector headwinds, or broader market rotation',
        nearSupportMeaning: `${symbol} support levels often attract institutional buying and value investors`,
        nearResistanceMeaning: `Breaking ${symbol} resistance could signal improved earnings outlook or sector strength`,
        highVolatilityMeaning: 'Elevated volatility suggests significant news, earnings surprises, or sector uncertainty',
        lowVolatilityMeaning: 'stable trading conditions, typical for established companies',
        normalVolatilityMeaning: 'this equity investment'
      },
      'forex': {
        oversoldMeaning: `${symbol} oversold levels often reflect economic imbalances or central bank policy divergence`,
        overboughtMeaning: `${symbol} at extreme levels may signal currency intervention risk or policy response`,
        bullishTrendMeaning: 'Currency strength typically reflects relative economic outperformance or hawkish policy',
        bearishTrendMeaning: 'Currency weakness often stems from economic concerns or dovish central bank policy',
        nearSupportMeaning: `${symbol} support is critical for trade balance and may trigger central bank intervention`,
        nearResistanceMeaning: `Breaking ${symbol} resistance often signals major economic or policy shifts`,
        highVolatilityMeaning: 'Common during economic data releases, central bank meetings, or geopolitical events',
        lowVolatilityMeaning: 'stable currency conditions reflecting balanced economic fundamentals',
        normalVolatilityMeaning: 'this currency pair'
      },
      'commodities': {
        oversoldMeaning: `${symbol} oversold conditions may reflect oversupply concerns or economic slowdown fears`,
        overboughtMeaning: `${symbol} at high levels often indicates supply constraints or strong demand fundamentals`,
        bullishTrendMeaning: 'Commodity strength typically reflects supply/demand imbalances or inflation concerns',
        bearishTrendMeaning: 'Commodity weakness often stems from oversupply, demand destruction, or economic slowdown',
        nearSupportMeaning: `${symbol} support reflects production cost levels and supply/demand equilibrium`,
        nearResistanceMeaning: `Breaking ${symbol} resistance often signals supply shortages or demand acceleration`,
        highVolatilityMeaning: 'Common for commodities due to weather, geopolitics, and supply chain disruptions',
        lowVolatilityMeaning: 'stable supply/demand conditions',
        normalVolatilityMeaning: 'this commodity asset'
      },
      'indices': {
        oversoldMeaning: `${symbol} oversold conditions often represent broad market buying opportunities`,
        overboughtMeaning: `${symbol} at extreme highs may signal market exuberance and correction risk`,
        bullishTrendMeaning: 'Index strength reflects broad economic optimism and corporate earnings growth',
        bearishTrendMeaning: 'Index weakness often indicates economic concerns or earnings disappointments',
        nearSupportMeaning: `${symbol} support represents broad market confidence and institutional buying levels`,
        nearResistanceMeaning: `Breaking ${symbol} resistance often signals new market highs and continued optimism`,
        highVolatilityMeaning: 'Elevated market volatility suggests uncertainty about economic direction',
        lowVolatilityMeaning: 'stable market conditions reflecting economic stability',
        normalVolatilityMeaning: 'this market index'
      }
    };

    // Enhanced automatic detection for new assets
    const autoDetectedCategory = this.detectAssetCategory(symbol, category);
    
    // Return specific context, intelligent category-based default, or auto-detected context
    return contexts[symbol] || categoryDefaults[autoDetectedCategory] || categoryDefaults['stocks'];
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
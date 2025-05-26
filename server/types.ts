export interface AssetOHLC {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AssetData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  ohlcv: AssetOHLC[];
}

export interface Signal {
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  date: string;
  confidence: number;
}

export interface NewsArticle {
  title: string;
  url: string;
  publishedAt: string;
  sentiment: number;
}

export interface TechnicalIndicators {
  sma50: number;
  sma200: number;
  rsi: number;
  bb: {
    upper: number;
    middle: number;
    lower: number;
    pb: number;
  };
}

export interface AISummary {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  riskProfile: string;
  entryPrice: number;
  exitPrice: number;
  tradeIdeas: string[];
  signals: Signal[];
}

export interface BacktestMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
}

export interface RiskMetrics {
  volatility30: number;
  volatility60: number;
  var95Param: number;
  var99Param: number;
  var95MonteCarlo: number;
  drawdownStats: {
    maxDrawdown: number;
    avgDrawdown: number;
    drawdownDays: number;
  };
}
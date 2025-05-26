/**
 * Professional Backtesting Engine
 * Validates trading strategies with authentic market data
 */

export interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingSignal {
  date: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
}

export interface BacktestParams {
  initialCapital: number;
  slippagePercent: number; // e.g., 0.1 for 0.1%
  commissionPerTrade: number; // fixed commission per trade
  maxPositionSize?: number; // optional position sizing limit
}

export interface BacktestResult {
  totalReturn: number; // percentage
  annualizedReturn: number; // percentage
  sharpeRatio: number;
  maxDrawdown: number; // percentage
  winRate: number; // percentage
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  equity: number[];
  trades: Trade[];
}

interface Trade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  profit: number;
  profitPercent: number;
  duration: number; // days
}

export function runBacktest(
  ohlcv: OHLCVData[],
  signals: TradingSignal[],
  params: BacktestParams
): BacktestResult {
  const {
    initialCapital,
    slippagePercent,
    commissionPerTrade,
    maxPositionSize = 1.0
  } = params;

  let capital = initialCapital;
  let position = 0; // shares held
  let equity = [initialCapital];
  const trades: Trade[] = [];
  let currentTrade: Partial<Trade> | null = null;

  // Sort data and signals by date
  const sortedOHLCV = [...ohlcv].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedSignals = [...signals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Create date-indexed OHLCV map for quick lookup
  const ohlcvMap = new Map<string, OHLCVData>();
  sortedOHLCV.forEach(candle => {
    ohlcvMap.set(candle.date, candle);
  });

  // Process each signal
  for (const signal of sortedSignals) {
    const signalDate = new Date(signal.date);
    
    // Find next trading day after signal
    const nextTradingDay = findNextTradingDay(sortedOHLCV, signalDate);
    if (!nextTradingDay) continue;

    const executionPrice = calculateExecutionPrice(nextTradingDay.open, signal.action, slippagePercent);

    if (signal.action === 'BUY' && position === 0) {
      // Enter long position
      const availableCapital = capital - commissionPerTrade;
      const maxShares = Math.floor(availableCapital / executionPrice);
      const positionShares = Math.min(maxShares, Math.floor(availableCapital * maxPositionSize / executionPrice));
      
      if (positionShares > 0) {
        position = positionShares;
        capital -= (positionShares * executionPrice + commissionPerTrade);
        
        currentTrade = {
          entryDate: nextTradingDay.date,
          entryPrice: executionPrice,
          quantity: positionShares
        };
      }
    } else if (signal.action === 'SELL' && position > 0 && currentTrade) {
      // Exit long position
      const proceeds = position * executionPrice - commissionPerTrade;
      capital += proceeds;
      
      const profit = proceeds - (currentTrade.quantity! * currentTrade.entryPrice! + commissionPerTrade);
      const profitPercent = (profit / (currentTrade.quantity! * currentTrade.entryPrice!)) * 100;
      const duration = Math.ceil((new Date(nextTradingDay.date).getTime() - new Date(currentTrade.entryDate!).getTime()) / (1000 * 60 * 60 * 24));

      const completedTrade: Trade = {
        entryDate: currentTrade.entryDate!,
        exitDate: nextTradingDay.date,
        entryPrice: currentTrade.entryPrice!,
        exitPrice: executionPrice,
        quantity: currentTrade.quantity!,
        profit,
        profitPercent,
        duration
      };

      trades.push(completedTrade);
      position = 0;
      currentTrade = null;
    }

    // Calculate current equity (capital + position value)
    const currentEquity = capital + (position * nextTradingDay.close);
    equity.push(currentEquity);
  }

  // Calculate performance metrics
  return calculatePerformanceMetrics(initialCapital, equity, trades);
}

function findNextTradingDay(ohlcv: OHLCVData[], signalDate: Date): OHLCVData | null {
  const nextDay = new Date(signalDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  for (const candle of ohlcv) {
    const candleDate = new Date(candle.date);
    if (candleDate >= nextDay) {
      return candle;
    }
  }
  return null;
}

function calculateExecutionPrice(price: number, action: 'BUY' | 'SELL', slippagePercent: number): number {
  const slippage = price * (slippagePercent / 100);
  return action === 'BUY' ? price + slippage : price - slippage;
}

function calculatePerformanceMetrics(initialCapital: number, equity: number[], trades: Trade[]): BacktestResult {
  const finalEquity = equity[equity.length - 1];
  const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;
  
  // Calculate annualized return (assuming daily equity updates)
  const days = equity.length - 1;
  const years = days / 365.25;
  const annualizedReturn = years > 0 ? (Math.pow(finalEquity / initialCapital, 1 / years) - 1) * 100 : 0;

  // Calculate Sharpe ratio
  const returns = equity.slice(1).map((value, i) => (value - equity[i]) / equity[i]);
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const returnStd = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length);
  const sharpeRatio = returnStd > 0 ? (avgReturn / returnStd) * Math.sqrt(252) : 0; // Annualized

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = equity[0];
  for (const value of equity) {
    if (value > peak) peak = value;
    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Calculate trade statistics
  const winningTrades = trades.filter(trade => trade.profit > 0);
  const losingTrades = trades.filter(trade => trade.profit < 0);
  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
  
  const averageWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, trade) => sum + trade.profit, 0) / winningTrades.length 
    : 0;
  
  const averageLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit, 0) / losingTrades.length)
    : 0;
  
  const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;

  return {
    totalReturn,
    annualizedReturn,
    sharpeRatio,
    maxDrawdown,
    winRate,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    averageWin,
    averageLoss,
    profitFactor,
    equity,
    trades
  };
}

// Example usage and test data
export const sampleBTCData: OHLCVData[] = [
  { date: '2024-01-01', open: 42000, high: 43000, low: 41500, close: 42500, volume: 1000000 },
  { date: '2024-01-02', open: 42500, high: 44000, low: 42000, close: 43200, volume: 1200000 },
  { date: '2024-01-03', open: 43200, high: 43800, low: 42800, close: 43500, volume: 950000 },
  { date: '2024-01-04', open: 43500, high: 45000, low: 43000, close: 44800, volume: 1300000 },
  { date: '2024-01-05', open: 44800, high: 45500, low: 44200, close: 45000, volume: 1100000 },
  { date: '2024-01-08', open: 45000, high: 46000, low: 44500, close: 45800, volume: 1400000 },
  { date: '2024-01-09', open: 45800, high: 47000, low: 45200, close: 46500, volume: 1600000 },
  { date: '2024-01-10', open: 46500, high: 46800, low: 45800, close: 46200, volume: 1000000 },
];

export const sampleSignals: TradingSignal[] = [
  { date: '2024-01-01', symbol: 'BTC', action: 'BUY', price: 42000 },
  { date: '2024-01-05', symbol: 'BTC', action: 'SELL', price: 45000 },
  { date: '2024-01-08', symbol: 'BTC', action: 'BUY', price: 45800 },
  { date: '2024-01-10', symbol: 'BTC', action: 'SELL', price: 46200 },
];

// Jest test example
export function testBacktestEngine() {
  const params: BacktestParams = {
    initialCapital: 10000,
    slippagePercent: 0.1,
    commissionPerTrade: 10,
    maxPositionSize: 0.95
  };

  const result = runBacktest(sampleBTCData, sampleSignals, params);
  
  console.log('Backtest Results:');
  console.log(`Total Return: ${result.totalReturn.toFixed(2)}%`);
  console.log(`Annualized Return: ${result.annualizedReturn.toFixed(2)}%`);
  console.log(`Sharpe Ratio: ${result.sharpeRatio.toFixed(2)}`);
  console.log(`Max Drawdown: ${result.maxDrawdown.toFixed(2)}%`);
  console.log(`Win Rate: ${result.winRate.toFixed(2)}%`);
  console.log(`Total Trades: ${result.totalTrades}`);
  console.log(`Profit Factor: ${result.profitFactor.toFixed(2)}`);
  
  return result;
}
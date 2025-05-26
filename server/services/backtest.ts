import { AssetOHLC, Signal, BacktestMetrics } from '../types';

export function runBacktest(
  ohlcv: AssetOHLC[], 
  signals: Signal[], 
  params: { slippagePct: number; commissionPct: number }
): BacktestMetrics {
  
  if (ohlcv.length < 2 || signals.length === 0) {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      totalTrades: 0
    };
  }

  let portfolio = 10000; // Starting with $10,000
  let position = 0; // Number of shares held
  let cash = portfolio;
  let trades: { entry: number; exit: number; return: number }[] = [];
  let portfolioValues: number[] = [];
  let inPosition = false;
  let entryPrice = 0;

  // Create price map for quick lookup
  const priceMap = new Map<string, AssetOHLC>();
  ohlcv.forEach(candle => {
    priceMap.set(candle.date, candle);
  });

  // Process each signal
  for (const signal of signals) {
    const signalDate = signal.date.split('T')[0]; // Get date part only
    const candle = priceMap.get(signalDate);
    
    if (!candle) continue;

    const executePrice = candle.open * (1 + (Math.random() - 0.5) * params.slippagePct / 100);
    
    if (signal.action === 'BUY' && !inPosition && cash > 0) {
      // Enter long position
      const commission = cash * params.commissionPct / 100;
      const investAmount = cash - commission;
      position = investAmount / executePrice;
      cash = 0;
      entryPrice = executePrice;
      inPosition = true;
      
    } else if (signal.action === 'SELL' && inPosition) {
      // Exit position
      const sellValue = position * executePrice;
      const commission = sellValue * params.commissionPct / 100;
      cash = sellValue - commission;
      
      const tradeReturn = (cash - 10000) / 10000;
      trades.push({
        entry: entryPrice,
        exit: executePrice,
        return: tradeReturn
      });
      
      position = 0;
      inPosition = false;
    }
    
    // Calculate current portfolio value
    const currentValue = cash + (position * candle.close);
    portfolioValues.push(currentValue);
  }

  // If still in position at end, close it
  if (inPosition && ohlcv.length > 0) {
    const lastPrice = ohlcv[ohlcv.length - 1].close;
    const sellValue = position * lastPrice;
    const commission = sellValue * params.commissionPct / 100;
    cash = sellValue - commission;
    
    const tradeReturn = (cash - 10000) / 10000;
    trades.push({
      entry: entryPrice,
      exit: lastPrice,
      return: tradeReturn
    });
  }

  // Calculate metrics
  const finalValue = cash + (position * (ohlcv[ohlcv.length - 1]?.close || 0));
  const totalReturn = (finalValue - portfolio) / portfolio;
  
  // Annualized return calculation
  const dayCount = ohlcv.length;
  const years = dayCount / 252; // Assuming 252 trading days per year
  const annualizedReturn = years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0;
  
  // Sharpe ratio calculation
  const returns = portfolioValues.map((value, i) => 
    i > 0 ? (value - portfolioValues[i - 1]) / portfolioValues[i - 1] : 0
  ).slice(1);
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const returnStd = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = returnStd > 0 ? (avgReturn * Math.sqrt(252)) / (returnStd * Math.sqrt(252)) : 0;
  
  // Max drawdown calculation
  let peak = portfolio;
  let maxDrawdown = 0;
  
  portfolioValues.forEach(value => {
    if (value > peak) peak = value;
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });
  
  // Win rate calculation
  const winningTrades = trades.filter(trade => trade.return > 0).length;
  const winRate = trades.length > 0 ? winningTrades / trades.length : 0;

  return {
    totalReturn: totalReturn * 100, // Convert to percentage
    annualizedReturn: annualizedReturn * 100,
    sharpeRatio,
    maxDrawdown: maxDrawdown * 100,
    winRate: winRate * 100,
    totalTrades: trades.length
  };
}
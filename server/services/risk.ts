import { RiskMetrics } from '../types';

export function calcVolatility(returns: number[], windowDays: number): number {
  if (returns.length < windowDays) {
    return 0;
  }

  const recentReturns = returns.slice(-windowDays);
  const mean = recentReturns.reduce((sum, r) => sum + r, 0) / recentReturns.length;
  
  const variance = recentReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / recentReturns.length;
  
  // Annualize volatility (assuming 252 trading days per year)
  return Math.sqrt(variance * 252) * 100;
}

export function calcVaRParametric(returns: number[], confidence: number): number {
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Z-score for given confidence level
  const zScore = confidence === 0.95 ? 1.645 : confidence === 0.99 ? 2.326 : 1.96;
  
  // VaR = mean - (z-score * standard deviation)
  return -(mean - zScore * stdDev) * 100;
}

export function calcVaRMonteCarlo(
  latestPrice: number,
  returns: number[],
  days: number,
  simulations: number,
  confidence: number
): number {
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  const simulatedReturns: number[] = [];
  
  // Run Monte Carlo simulations
  for (let i = 0; i < simulations; i++) {
    let price = latestPrice;
    
    // Simulate price path for specified days
    for (let day = 0; day < days; day++) {
      // Generate random return using normal distribution (Box-Muller transform)
      const u1 = Math.random();
      const u2 = Math.random();
      const normalRandom = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      const dailyReturn = mean + stdDev * normalRandom;
      price *= (1 + dailyReturn);
    }
    
    const totalReturn = (price - latestPrice) / latestPrice;
    simulatedReturns.push(totalReturn);
  }
  
  // Sort returns and find VaR at specified confidence level
  simulatedReturns.sort((a, b) => a - b);
  const varIndex = Math.floor((1 - confidence) * simulations);
  
  return -simulatedReturns[varIndex] * 100;
}

export function calcDrawdownMetrics(returns: number[]): {
  maxDrawdown: number;
  avgDrawdown: number;
  drawdownDays: number;
} {
  if (returns.length === 0) {
    return { maxDrawdown: 0, avgDrawdown: 0, drawdownDays: 0 };
  }
  
  let peak = 1;
  let maxDrawdown = 0;
  let drawdowns: number[] = [];
  let currentDrawdownDays = 0;
  let totalDrawdownDays = 0;
  let inDrawdown = false;
  
  // Calculate cumulative returns
  const cumulativeReturns = [1];
  for (let i = 0; i < returns.length; i++) {
    cumulativeReturns.push(cumulativeReturns[i] * (1 + returns[i]));
  }
  
  for (let i = 1; i < cumulativeReturns.length; i++) {
    const value = cumulativeReturns[i];
    
    if (value > peak) {
      peak = value;
      if (inDrawdown) {
        totalDrawdownDays += currentDrawdownDays;
        currentDrawdownDays = 0;
        inDrawdown = false;
      }
    } else {
      const drawdown = (peak - value) / peak;
      drawdowns.push(drawdown);
      
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
      
      if (!inDrawdown) {
        inDrawdown = true;
        currentDrawdownDays = 1;
      } else {
        currentDrawdownDays++;
      }
    }
  }
  
  // Add final drawdown period if still in drawdown
  if (inDrawdown) {
    totalDrawdownDays += currentDrawdownDays;
  }
  
  const avgDrawdown = drawdowns.length > 0 
    ? drawdowns.reduce((sum, dd) => sum + dd, 0) / drawdowns.length 
    : 0;
  
  return {
    maxDrawdown: maxDrawdown * 100,
    avgDrawdown: avgDrawdown * 100,
    drawdownDays: totalDrawdownDays
  };
}
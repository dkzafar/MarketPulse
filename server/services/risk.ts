/**
 * Advanced Risk Metrics Module
 * Professional risk modeling for institutional-grade analysis
 */

export interface VolatilityMetrics {
  vol30: number;
  vol60: number;
  vol90: number;
}

export interface VaRResult {
  var95: number;
  var99: number;
  expectedShortfall95: number;
  expectedShortfall99: number;
}

export interface DrawdownMetrics {
  maxDrawdown: number;
  maxDrawdownDuration: number;
  ulcerIndex: number;
  calmarRatio: number;
  drawdownCurve: number[];
  recoveryTime: number;
}

/**
 * Calculate rolling historical volatility (annualized)
 * Formula: σ_annual = σ_daily * √252
 * @param returns Array of daily returns (as decimals, e.g., 0.05 for 5%)
 * @param windowDays Rolling window size in days
 * @returns Annualized volatility
 */
export function calcVolatility(returns: number[], windowDays: number): number {
  if (returns.length < windowDays) {
    throw new Error(`Insufficient data: need ${windowDays} returns, got ${returns.length}`);
  }

  const recentReturns = returns.slice(-windowDays);
  
  // Calculate sample standard deviation
  const mean = recentReturns.reduce((sum, ret) => sum + ret, 0) / recentReturns.length;
  const variance = recentReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (recentReturns.length - 1);
  const dailyVol = Math.sqrt(variance);
  
  // Annualize (252 trading days per year)
  return dailyVol * Math.sqrt(252);
}

/**
 * Calculate multiple rolling volatilities for comprehensive risk assessment
 */
export function calcRollingVolatilities(returns: number[]): VolatilityMetrics {
  return {
    vol30: calcVolatility(returns, 30),
    vol60: calcVolatility(returns, 60),
    vol90: calcVolatility(returns, 90)
  };
}

/**
 * Calculate parametric Value-at-Risk using normal distribution assumption
 * Formula: VaR = μ + σ * Z_α (where Z_α is the normal quantile)
 * @param returns Array of daily returns
 * @param confidence Confidence level (0.95 for 95%, 0.99 for 99%)
 * @returns VaR as a positive number (loss amount)
 */
export function calcVaRParametric(returns: number[], confidence: number): number {
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  
  // Normal distribution quantiles for common confidence levels
  const zScores: { [key: number]: number } = {
    0.90: -1.282,
    0.95: -1.645,
    0.99: -2.326
  };
  
  const zScore = zScores[confidence] || -1.645;
  
  // VaR = mean + z-score * standard deviation (negative z-score for losses)
  const valueAtRisk = -(mean + zScore * stdDev);
  
  return Math.max(0, valueAtRisk); // Return positive loss amount
}

/**
 * Calculate comprehensive VaR metrics including Expected Shortfall (Conditional VaR)
 */
export function calcComprehensiveVaR(returns: number[]): VaRResult {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const n = sortedReturns.length;
  
  // Calculate VaR at different confidence levels
  const var95Index = Math.floor(n * 0.05);
  const var99Index = Math.floor(n * 0.01);
  
  const var95 = -sortedReturns[var95Index];
  const var99 = -sortedReturns[var99Index];
  
  // Expected Shortfall (average of losses beyond VaR)
  const expectedShortfall95 = var95Index > 0 
    ? -sortedReturns.slice(0, var95Index).reduce((sum, ret) => sum + ret, 0) / var95Index
    : var95;
    
  const expectedShortfall99 = var99Index > 0
    ? -sortedReturns.slice(0, var99Index).reduce((sum, ret) => sum + ret, 0) / var99Index
    : var99;
  
  return {
    var95,
    var99,
    expectedShortfall95,
    expectedShortfall99
  };
}

/**
 * Monte Carlo VaR simulation using historical volatility
 * Simulates future price paths and calculates VaR from distribution
 * @param latestPrice Current asset price
 * @param returns Historical returns for volatility estimation
 * @param days Forecast horizon in days
 * @param sims Number of Monte Carlo simulations
 * @param confidence Confidence level
 */
export function calcVaRMonteCarlo(
  latestPrice: number,
  returns: number[],
  days: number = 1,
  sims: number = 10000,
  confidence: number = 0.95
): number {
  const volatility = calcVolatility(returns, Math.min(returns.length, 252));
  const dailyVol = volatility / Math.sqrt(252);
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  
  const finalPrices: number[] = [];
  
  // Run Monte Carlo simulations
  for (let i = 0; i < sims; i++) {
    let price = latestPrice;
    
    // Simulate price path for 'days' periods
    for (let day = 0; day < days; day++) {
      // Generate random normal variable using Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Apply geometric Brownian motion: S_t+1 = S_t * exp((μ - σ²/2)dt + σ√dt * Z)
      const drift = mean - (dailyVol * dailyVol) / 2;
      const diffusion = dailyVol * z;
      price = price * Math.exp(drift + diffusion);
    }
    
    finalPrices.push(price);
  }
  
  // Sort prices and find VaR
  finalPrices.sort((a, b) => a - b);
  const varIndex = Math.floor(sims * (1 - confidence));
  const varPrice = finalPrices[varIndex];
  
  // Return loss amount (positive number)
  return Math.max(0, latestPrice - varPrice);
}

/**
 * Calculate comprehensive drawdown metrics
 * Drawdown = (Peak - Trough) / Peak
 * Ulcer Index = √(Σ(DD²)/n) - measures drawdown pain
 */
export function calcDrawdownMetrics(returns: number[]): DrawdownMetrics {
  let cumulativeReturn = 1.0;
  let peak = 1.0;
  let maxDrawdown = 0;
  let maxDrawdownDuration = 0;
  let currentDrawdownDuration = 0;
  let recoveryTime = 0;
  let inDrawdown = false;
  
  const drawdownCurve: number[] = [];
  const ddSquaredSum = [];
  
  for (let i = 0; i < returns.length; i++) {
    // Update cumulative return
    cumulativeReturn *= (1 + returns[i]);
    
    // Update peak
    if (cumulativeReturn > peak) {
      peak = cumulativeReturn;
      if (inDrawdown) {
        recoveryTime = currentDrawdownDuration;
        inDrawdown = false;
      }
      currentDrawdownDuration = 0;
    } else {
      currentDrawdownDuration++;
      inDrawdown = true;
    }
    
    // Calculate current drawdown
    const currentDrawdown = (peak - cumulativeReturn) / peak;
    drawdownCurve.push(currentDrawdown);
    ddSquaredSum.push(currentDrawdown * currentDrawdown);
    
    // Update maximum drawdown
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }
    
    // Update maximum drawdown duration
    if (currentDrawdownDuration > maxDrawdownDuration) {
      maxDrawdownDuration = currentDrawdownDuration;
    }
  }
  
  // Calculate Ulcer Index (RMS of drawdowns)
  const ulcerIndex = Math.sqrt(ddSquaredSum.reduce((sum, dd) => sum + dd, 0) / ddSquaredSum.length);
  
  // Calculate Calmar Ratio (annualized return / max drawdown)
  const totalReturn = cumulativeReturn - 1;
  const annualizedReturn = Math.pow(cumulativeReturn, 252 / returns.length) - 1;
  const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;
  
  return {
    maxDrawdown,
    maxDrawdownDuration,
    ulcerIndex,
    calmarRatio,
    drawdownCurve,
    recoveryTime
  };
}

/**
 * Comprehensive risk analysis combining all metrics
 */
export function performRiskAnalysis(returns: number[], currentPrice: number = 100): {
  volatility: VolatilityMetrics;
  var: VaRResult;
  monteCarlo: { var95: number; var99: number };
  drawdown: DrawdownMetrics;
} {
  return {
    volatility: calcRollingVolatilities(returns),
    var: calcComprehensiveVaR(returns),
    monteCarlo: {
      var95: calcVaRMonteCarlo(currentPrice, returns, 1, 10000, 0.95),
      var99: calcVaRMonteCarlo(currentPrice, returns, 1, 10000, 0.99)
    },
    drawdown: calcDrawdownMetrics(returns)
  };
}

// Example usage with synthetic returns
export function demonstrateRiskMetrics() {
  // Generate synthetic daily returns (normal distribution with some volatility clustering)
  const returns: number[] = [];
  let volatility = 0.02; // Base volatility
  
  for (let i = 0; i < 252; i++) { // One year of data
    // Simulate volatility clustering
    volatility = 0.95 * volatility + 0.05 * 0.02 + 0.01 * (Math.random() - 0.5);
    
    // Generate return with Box-Muller
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    const return_i = 0.0008 + volatility * z; // Slight positive drift
    returns.push(return_i);
  }
  
  console.log('Risk Analysis Example:');
  
  const volatilityMetrics = calcRollingVolatilities(returns);
  console.log('Volatility Metrics:', {
    '30-day': `${(volatilityMetrics.vol30 * 100).toFixed(2)}%`,
    '60-day': `${(volatilityMetrics.vol60 * 100).toFixed(2)}%`,
    '90-day': `${(volatilityMetrics.vol90 * 100).toFixed(2)}%`
  });
  
  const varMetrics = calcComprehensiveVaR(returns);
  console.log('VaR Metrics:', {
    'VaR 95%': `${(varMetrics.var95 * 100).toFixed(2)}%`,
    'VaR 99%': `${(varMetrics.var99 * 100).toFixed(2)}%`,
    'ES 95%': `${(varMetrics.expectedShortfall95 * 100).toFixed(2)}%`
  });
  
  const mcVar95 = calcVaRMonteCarlo(100, returns, 1, 10000, 0.95);
  console.log('Monte Carlo VaR 95%:', `$${mcVar95.toFixed(2)}`);
  
  const drawdownMetrics = calcDrawdownMetrics(returns);
  console.log('Drawdown Metrics:', {
    'Max Drawdown': `${(drawdownMetrics.maxDrawdown * 100).toFixed(2)}%`,
    'Ulcer Index': drawdownMetrics.ulcerIndex.toFixed(4),
    'Calmar Ratio': drawdownMetrics.calmarRatio.toFixed(2)
  });
  
  return { returns, volatilityMetrics, varMetrics, drawdownMetrics };
}
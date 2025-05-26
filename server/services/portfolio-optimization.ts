/**
 * Modern Portfolio Theory Implementation
 * Professional portfolio optimization using Markowitz methodology
 */

export interface Asset {
  symbol: string;
  expectedReturn: number;
  historicalReturns: number[];
}

export interface OptimizationResult {
  weights: number[];
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  symbols: string[];
}

export interface EfficientFrontier {
  portfolios: OptimizationResult[];
  optimalPortfolio: OptimizationResult;
  minVariancePortfolio: OptimizationResult;
}

/**
 * Calculate covariance matrix for asset returns
 */
export function calculateCovarianceMatrix(assets: Asset[]): number[][] {
  const n = assets.length;
  const covariance: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const returns1 = assets[i].historicalReturns;
      const returns2 = assets[j].historicalReturns;
      
      const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
      const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;
      
      let covar = 0;
      const minLength = Math.min(returns1.length, returns2.length);
      
      for (let k = 0; k < minLength; k++) {
        covar += (returns1[k] - mean1) * (returns2[k] - mean2);
      }
      
      covariance[i][j] = covar / (minLength - 1);
    }
  }
  
  return covariance;
}

/**
 * Calculate portfolio metrics given weights and assets
 */
export function calculatePortfolioMetrics(weights: number[], assets: Asset[], covMatrix: number[][]): {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
} {
  // Expected return = sum of (weight * expected return)
  const expectedReturn = weights.reduce((sum, weight, i) => sum + weight * assets[i].expectedReturn, 0);
  
  // Portfolio variance = weights^T * covariance * weights
  let variance = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      variance += weights[i] * weights[j] * covMatrix[i][j];
    }
  }
  
  const volatility = Math.sqrt(variance);
  const riskFreeRate = 0.02; // 2% risk-free rate assumption
  const sharpeRatio = volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;
  
  return { expectedReturn, volatility, sharpeRatio };
}

/**
 * Find optimal portfolio weights using quadratic optimization
 * Maximizes Sharpe ratio subject to weight constraints
 */
export function optimizePortfolio(assets: Asset[], targetReturn?: number): OptimizationResult {
  const n = assets.length;
  const covMatrix = calculateCovarianceMatrix(assets);
  
  // Use Monte Carlo approach for optimization (simple but effective)
  let bestPortfolio: OptimizationResult | null = null;
  let bestSharpe = -Infinity;
  
  const iterations = 10000;
  
  for (let iter = 0; iter < iterations; iter++) {
    // Generate random weights that sum to 1
    const weights = generateRandomWeights(n);
    
    const metrics = calculatePortfolioMetrics(weights, assets, covMatrix);
    
    // Skip if target return is specified and not met
    if (targetReturn && Math.abs(metrics.expectedReturn - targetReturn) > 0.01) {
      continue;
    }
    
    if (metrics.sharpeRatio > bestSharpe) {
      bestSharpe = metrics.sharpeRatio;
      bestPortfolio = {
        weights: [...weights],
        expectedReturn: metrics.expectedReturn,
        volatility: metrics.volatility,
        sharpeRatio: metrics.sharpeRatio,
        symbols: assets.map(a => a.symbol)
      };
    }
  }
  
  return bestPortfolio || {
    weights: Array(n).fill(1/n),
    expectedReturn: 0,
    volatility: 0,
    sharpeRatio: 0,
    symbols: assets.map(a => a.symbol)
  };
}

/**
 * Generate efficient frontier
 */
export function generateEfficientFrontier(assets: Asset[], points: number = 50): EfficientFrontier {
  const portfolios: OptimizationResult[] = [];
  
  // Find min and max expected returns
  const minReturn = Math.min(...assets.map(a => a.expectedReturn));
  const maxReturn = Math.max(...assets.map(a => a.expectedReturn));
  
  // Generate portfolios along the efficient frontier
  for (let i = 0; i < points; i++) {
    const targetReturn = minReturn + (maxReturn - minReturn) * (i / (points - 1));
    const portfolio = optimizePortfolio(assets, targetReturn);
    portfolios.push(portfolio);
  }
  
  // Find optimal portfolio (max Sharpe ratio)
  const optimalPortfolio = portfolios.reduce((best, current) => 
    current.sharpeRatio > best.sharpeRatio ? current : best
  );
  
  // Find minimum variance portfolio
  const minVariancePortfolio = portfolios.reduce((best, current) => 
    current.volatility < best.volatility ? current : best
  );
  
  return {
    portfolios: portfolios.sort((a, b) => a.volatility - b.volatility),
    optimalPortfolio,
    minVariancePortfolio
  };
}

/**
 * Generate random weights that sum to 1 (Dirichlet distribution)
 */
function generateRandomWeights(n: number): number[] {
  const random = Array(n).fill(0).map(() => -Math.log(Math.random()));
  const sum = random.reduce((a, b) => a + b, 0);
  return random.map(r => r / sum);
}

/**
 * Calculate portfolio correlation matrix
 */
export function calculateCorrelationMatrix(assets: Asset[]): number[][] {
  const n = assets.length;
  const correlation: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        correlation[i][j] = 1;
        continue;
      }
      
      const returns1 = assets[i].historicalReturns;
      const returns2 = assets[j].historicalReturns;
      
      const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
      const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;
      
      let numerator = 0;
      let sum1Sq = 0;
      let sum2Sq = 0;
      
      const minLength = Math.min(returns1.length, returns2.length);
      
      for (let k = 0; k < minLength; k++) {
        const diff1 = returns1[k] - mean1;
        const diff2 = returns2[k] - mean2;
        numerator += diff1 * diff2;
        sum1Sq += diff1 * diff1;
        sum2Sq += diff2 * diff2;
      }
      
      const denominator = Math.sqrt(sum1Sq * sum2Sq);
      correlation[i][j] = denominator > 0 ? numerator / denominator : 0;
    }
  }
  
  return correlation;
}

/**
 * Risk parity portfolio optimization
 * Each asset contributes equally to portfolio risk
 */
export function optimizeRiskParity(assets: Asset[]): OptimizationResult {
  const n = assets.length;
  const covMatrix = calculateCovarianceMatrix(assets);
  
  // Start with equal weights
  let weights = Array(n).fill(1/n);
  const tolerance = 1e-6;
  const maxIterations = 1000;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const riskContributions = calculateRiskContributions(weights, covMatrix);
    const targetRisk = 1 / n; // Equal risk contribution
    
    let converged = true;
    const newWeights = [...weights];
    
    for (let i = 0; i < n; i++) {
      const adjustment = (targetRisk - riskContributions[i]) * 0.1;
      newWeights[i] = Math.max(0.001, weights[i] + adjustment);
      
      if (Math.abs(adjustment) > tolerance) {
        converged = false;
      }
    }
    
    // Normalize weights
    const sum = newWeights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < n; i++) {
      newWeights[i] /= sum;
    }
    
    weights = newWeights;
    
    if (converged) break;
  }
  
  const metrics = calculatePortfolioMetrics(weights, assets, covMatrix);
  
  return {
    weights,
    expectedReturn: metrics.expectedReturn,
    volatility: metrics.volatility,
    sharpeRatio: metrics.sharpeRatio,
    symbols: assets.map(a => a.symbol)
  };
}

/**
 * Calculate risk contributions for each asset
 */
function calculateRiskContributions(weights: number[], covMatrix: number[][]): number[] {
  const n = weights.length;
  const riskContributions = Array(n).fill(0);
  
  // Portfolio variance
  let portfolioVariance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      portfolioVariance += weights[i] * weights[j] * covMatrix[i][j];
    }
  }
  
  // Marginal risk contribution for each asset
  for (let i = 0; i < n; i++) {
    let marginalRisk = 0;
    for (let j = 0; j < n; j++) {
      marginalRisk += weights[j] * covMatrix[i][j];
    }
    
    riskContributions[i] = portfolioVariance > 0 ? (weights[i] * marginalRisk) / portfolioVariance : 0;
  }
  
  return riskContributions;
}

// Example usage
export function demonstratePortfolioOptimization() {
  const sampleAssets: Asset[] = [
    {
      symbol: 'AAPL',
      expectedReturn: 0.12,
      historicalReturns: Array(252).fill(0).map(() => (Math.random() - 0.5) * 0.04 + 0.0005)
    },
    {
      symbol: 'GOOGL',
      expectedReturn: 0.15,
      historicalReturns: Array(252).fill(0).map(() => (Math.random() - 0.5) * 0.05 + 0.0007)
    },
    {
      symbol: 'MSFT',
      expectedReturn: 0.11,
      historicalReturns: Array(252).fill(0).map(() => (Math.random() - 0.5) * 0.035 + 0.0004)
    },
    {
      symbol: 'TSLA',
      expectedReturn: 0.20,
      historicalReturns: Array(252).fill(0).map(() => (Math.random() - 0.5) * 0.08 + 0.001)
    }
  ];
  
  const optimalPortfolio = optimizePortfolio(sampleAssets);
  const efficientFrontier = generateEfficientFrontier(sampleAssets);
  const riskParityPortfolio = optimizeRiskParity(sampleAssets);
  
  console.log('Portfolio Optimization Results:');
  console.log('Optimal Portfolio:', optimalPortfolio);
  console.log('Risk Parity Portfolio:', riskParityPortfolio);
  console.log('Efficient Frontier Points:', efficientFrontier.portfolios.length);
  
  return { optimalPortfolio, efficientFrontier, riskParityPortfolio };
}
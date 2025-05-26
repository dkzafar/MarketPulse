/**
 * Advanced Chart Pattern Recognition
 * Identifies common trading patterns in price data
 */

export interface PatternResult {
  pattern: string;
  confidence: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  timeframe: string;
  description: string;
}

export interface CandlestickPattern {
  name: string;
  type: 'reversal' | 'continuation';
  direction: 'bullish' | 'bearish';
  reliability: number;
}

export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp?: string;
}

/**
 * Detect candlestick patterns
 */
export function detectCandlestickPatterns(candles: OHLC[]): PatternResult[] {
  const patterns: PatternResult[] = [];
  
  if (candles.length < 3) return patterns;
  
  for (let i = 2; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];
    
    // Doji pattern
    const dojiPattern = detectDoji(current);
    if (dojiPattern) {
      patterns.push({
        pattern: 'Doji',
        confidence: dojiPattern.confidence,
        direction: 'neutral',
        timeframe: 'current',
        description: 'Indecision pattern - potential reversal signal'
      });
    }
    
    // Hammer pattern
    const hammerPattern = detectHammer(current);
    if (hammerPattern) {
      patterns.push({
        pattern: 'Hammer',
        confidence: hammerPattern.confidence,
        direction: 'bullish',
        timeframe: 'current',
        description: 'Bullish reversal pattern with long lower shadow'
      });
    }
    
    // Shooting star
    const shootingStarPattern = detectShootingStar(current);
    if (shootingStarPattern) {
      patterns.push({
        pattern: 'Shooting Star',
        confidence: shootingStarPattern.confidence,
        direction: 'bearish',
        timeframe: 'current',
        description: 'Bearish reversal pattern with long upper shadow'
      });
    }
    
    // Engulfing patterns
    const engulfingPattern = detectEngulfing(prev, current);
    if (engulfingPattern) {
      patterns.push({
        pattern: `${engulfingPattern.direction} Engulfing`,
        confidence: engulfingPattern.confidence,
        direction: engulfingPattern.direction,
        timeframe: '2-candle',
        description: `${engulfingPattern.direction === 'bullish' ? 'Bullish' : 'Bearish'} reversal pattern`
      });
    }
    
    // Morning/Evening Star (3-candle patterns)
    if (i >= 2) {
      const starPattern = detectStarPattern(prev2, prev, current);
      if (starPattern) {
        patterns.push({
          pattern: starPattern.name,
          confidence: starPattern.confidence,
          direction: starPattern.direction,
          timeframe: '3-candle',
          description: starPattern.description
        });
      }
    }
  }
  
  return patterns;
}

/**
 * Detect support and resistance levels
 */
export function detectSupportResistance(candles: OHLC[], periods: number = 20): {
  support: number[];
  resistance: number[];
  pivotPoints: { price: number; type: 'support' | 'resistance'; strength: number }[];
} {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  const pivotPoints: { price: number; type: 'support' | 'resistance'; strength: number }[] = [];
  
  // Find local maxima (resistance) and minima (support)
  for (let i = periods; i < candles.length - periods; i++) {
    const currentHigh = highs[i];
    const currentLow = lows[i];
    
    // Check for resistance (local maximum)
    let isResistance = true;
    for (let j = i - periods; j <= i + periods; j++) {
      if (j !== i && highs[j] >= currentHigh) {
        isResistance = false;
        break;
      }
    }
    
    if (isResistance) {
      const strength = calculatePivotStrength(highs, i, periods);
      pivotPoints.push({
        price: currentHigh,
        type: 'resistance',
        strength
      });
    }
    
    // Check for support (local minimum)
    let isSupport = true;
    for (let j = i - periods; j <= i + periods; j++) {
      if (j !== i && lows[j] <= currentLow) {
        isSupport = false;
        break;
      }
    }
    
    if (isSupport) {
      const strength = calculatePivotStrength(lows, i, periods, false);
      pivotPoints.push({
        price: currentLow,
        type: 'support',
        strength
      });
    }
  }
  
  // Group similar levels
  const support = groupSimilarLevels(pivotPoints.filter(p => p.type === 'support').map(p => p.price));
  const resistance = groupSimilarLevels(pivotPoints.filter(p => p.type === 'resistance').map(p => p.price));
  
  return { support, resistance, pivotPoints };
}

/**
 * Detect trend channels
 */
export function detectTrendChannels(candles: OHLC[]): PatternResult[] {
  const patterns: PatternResult[] = [];
  
  if (candles.length < 20) return patterns;
  
  // Calculate trend lines
  const highs = candles.map((c, i) => ({ price: c.high, index: i }));
  const lows = candles.map((c, i) => ({ price: c.low, index: i }));
  
  // Find ascending triangle
  const ascendingTriangle = detectAscendingTriangle(highs, lows);
  if (ascendingTriangle) {
    patterns.push({
      pattern: 'Ascending Triangle',
      confidence: ascendingTriangle.confidence,
      direction: 'bullish',
      timeframe: 'medium-term',
      description: 'Bullish continuation pattern with horizontal resistance and rising support'
    });
  }
  
  // Find descending triangle
  const descendingTriangle = detectDescendingTriangle(highs, lows);
  if (descendingTriangle) {
    patterns.push({
      pattern: 'Descending Triangle',
      confidence: descendingTriangle.confidence,
      direction: 'bearish',
      timeframe: 'medium-term',
      description: 'Bearish continuation pattern with horizontal support and falling resistance'
    });
  }
  
  return patterns;
}

/**
 * Detect head and shoulders pattern
 */
export function detectHeadAndShoulders(candles: OHLC[]): PatternResult | null {
  if (candles.length < 50) return null;
  
  const highs = candles.map(c => c.high);
  const peaks = findPeaks(highs, 10);
  
  if (peaks.length < 3) return null;
  
  // Check for head and shoulders pattern in recent peaks
  for (let i = 0; i < peaks.length - 2; i++) {
    const leftShoulder = peaks[i];
    const head = peaks[i + 1];
    const rightShoulder = peaks[i + 2];
    
    // Head should be higher than both shoulders
    if (head.price > leftShoulder.price && head.price > rightShoulder.price) {
      // Shoulders should be roughly equal
      const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price;
      
      if (shoulderDiff < 0.05) { // Within 5%
        const confidence = calculateHeadShouldersConfidence(leftShoulder, head, rightShoulder);
        
        return {
          pattern: 'Head and Shoulders',
          confidence,
          direction: 'bearish',
          timeframe: 'long-term',
          description: 'Major bearish reversal pattern indicating potential trend change'
        };
      }
    }
  }
  
  return null;
}

/**
 * Detect double top/bottom patterns
 */
export function detectDoubleTopBottom(candles: OHLC[]): PatternResult[] {
  const patterns: PatternResult[] = [];
  
  if (candles.length < 30) return patterns;
  
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  // Double top
  const peaks = findPeaks(highs, 10);
  for (let i = 0; i < peaks.length - 1; i++) {
    const peak1 = peaks[i];
    const peak2 = peaks[i + 1];
    
    const priceDiff = Math.abs(peak1.price - peak2.price) / peak1.price;
    if (priceDiff < 0.03) { // Within 3%
      patterns.push({
        pattern: 'Double Top',
        confidence: 0.7,
        direction: 'bearish',
        timeframe: 'medium-term',
        description: 'Bearish reversal pattern with two peaks at similar levels'
      });
    }
  }
  
  // Double bottom
  const troughs = findTroughs(lows, 10);
  for (let i = 0; i < troughs.length - 1; i++) {
    const trough1 = troughs[i];
    const trough2 = troughs[i + 1];
    
    const priceDiff = Math.abs(trough1.price - trough2.price) / trough1.price;
    if (priceDiff < 0.03) { // Within 3%
      patterns.push({
        pattern: 'Double Bottom',
        confidence: 0.7,
        direction: 'bullish',
        timeframe: 'medium-term',
        description: 'Bullish reversal pattern with two troughs at similar levels'
      });
    }
  }
  
  return patterns;
}

// Helper functions
function detectDoji(candle: OHLC): { confidence: number } | null {
  const bodySize = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;
  
  if (range === 0) return null;
  
  const bodyRatio = bodySize / range;
  
  if (bodyRatio < 0.1) {
    return { confidence: 0.8 };
  }
  
  return null;
}

function detectHammer(candle: OHLC): { confidence: number } | null {
  const bodySize = Math.abs(candle.close - candle.open);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const range = candle.high - candle.low;
  
  if (range === 0) return null;
  
  if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5) {
    return { confidence: 0.75 };
  }
  
  return null;
}

function detectShootingStar(candle: OHLC): { confidence: number } | null {
  const bodySize = Math.abs(candle.close - candle.open);
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  
  if (upperShadow > bodySize * 2 && lowerShadow < bodySize * 0.5) {
    return { confidence: 0.75 };
  }
  
  return null;
}

function detectEngulfing(prev: OHLC, current: OHLC): { direction: 'bullish' | 'bearish'; confidence: number } | null {
  const prevBody = Math.abs(prev.close - prev.open);
  const currentBody = Math.abs(current.close - current.open);
  
  // Bullish engulfing
  if (prev.close < prev.open && current.close > current.open && 
      current.open < prev.close && current.close > prev.open) {
    return { direction: 'bullish', confidence: 0.8 };
  }
  
  // Bearish engulfing
  if (prev.close > prev.open && current.close < current.open && 
      current.open > prev.close && current.close < prev.open) {
    return { direction: 'bearish', confidence: 0.8 };
  }
  
  return null;
}

function detectStarPattern(first: OHLC, middle: OHLC, last: OHLC): { 
  name: string; 
  direction: 'bullish' | 'bearish'; 
  confidence: number; 
  description: string 
} | null {
  const middleBody = Math.abs(middle.close - middle.open);
  const firstBody = Math.abs(first.close - first.open);
  const lastBody = Math.abs(last.close - last.open);
  
  // Morning star (bullish)
  if (first.close < first.open && last.close > last.open && 
      middleBody < firstBody * 0.5 && middleBody < lastBody * 0.5) {
    return {
      name: 'Morning Star',
      direction: 'bullish',
      confidence: 0.85,
      description: 'Strong bullish reversal pattern'
    };
  }
  
  // Evening star (bearish)
  if (first.close > first.open && last.close < last.open && 
      middleBody < firstBody * 0.5 && middleBody < lastBody * 0.5) {
    return {
      name: 'Evening Star',
      direction: 'bearish',
      confidence: 0.85,
      description: 'Strong bearish reversal pattern'
    };
  }
  
  return null;
}

function calculatePivotStrength(prices: number[], index: number, periods: number, isHigh: boolean = true): number {
  let strength = 0;
  const currentPrice = prices[index];
  
  for (let i = Math.max(0, index - periods); i <= Math.min(prices.length - 1, index + periods); i++) {
    if (i !== index) {
      if (isHigh && prices[i] < currentPrice) strength++;
      if (!isHigh && prices[i] > currentPrice) strength++;
    }
  }
  
  return strength / (periods * 2);
}

function groupSimilarLevels(levels: number[], tolerance: number = 0.02): number[] {
  const grouped: number[] = [];
  const sorted = [...levels].sort((a, b) => a - b);
  
  for (const level of sorted) {
    const existing = grouped.find(g => Math.abs(g - level) / g < tolerance);
    if (!existing) {
      grouped.push(level);
    }
  }
  
  return grouped;
}

function findPeaks(data: number[], minDistance: number): { price: number; index: number }[] {
  const peaks: { price: number; index: number }[] = [];
  
  for (let i = minDistance; i < data.length - minDistance; i++) {
    let isPeak = true;
    
    for (let j = i - minDistance; j <= i + minDistance; j++) {
      if (j !== i && data[j] >= data[i]) {
        isPeak = false;
        break;
      }
    }
    
    if (isPeak) {
      peaks.push({ price: data[i], index: i });
    }
  }
  
  return peaks;
}

function findTroughs(data: number[], minDistance: number): { price: number; index: number }[] {
  const troughs: { price: number; index: number }[] = [];
  
  for (let i = minDistance; i < data.length - minDistance; i++) {
    let isTrough = true;
    
    for (let j = i - minDistance; j <= i + minDistance; j++) {
      if (j !== i && data[j] <= data[i]) {
        isTrough = false;
        break;
      }
    }
    
    if (isTrough) {
      troughs.push({ price: data[i], index: i });
    }
  }
  
  return troughs;
}

function detectAscendingTriangle(highs: { price: number; index: number }[], lows: { price: number; index: number }[]): { confidence: number } | null {
  // Implementation for ascending triangle detection
  return null; // Simplified for now
}

function detectDescendingTriangle(highs: { price: number; index: number }[], lows: { price: number; index: number }[]): { confidence: number } | null {
  // Implementation for descending triangle detection
  return null; // Simplified for now
}

function calculateHeadShouldersConfidence(left: any, head: any, right: any): number {
  // Calculate confidence based on pattern quality
  return 0.8; // Simplified for now
}

/**
 * Comprehensive pattern analysis
 */
export function analyzeAllPatterns(candles: OHLC[]): {
  candlestick: PatternResult[];
  chart: PatternResult[];
  supportResistance: ReturnType<typeof detectSupportResistance>;
} {
  return {
    candlestick: detectCandlestickPatterns(candles),
    chart: [
      ...detectTrendChannels(candles),
      ...detectDoubleTopBottom(candles),
      ...(detectHeadAndShoulders(candles) ? [detectHeadAndShoulders(candles)!] : [])
    ],
    supportResistance: detectSupportResistance(candles)
  };
}
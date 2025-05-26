import { SMA, BollingerBands, RSI } from 'technicalindicators';
import { TechnicalIndicators } from '../types';

export function computeIndicators(ohlcv: { close: number }[]): TechnicalIndicators {
  const closes = ohlcv.map(c => c.close);
  
  if (closes.length < 200) {
    throw new Error('Insufficient data for technical analysis (need at least 200 periods)');
  }

  // Calculate Simple Moving Averages
  const sma50Values = SMA.calculate({ period: 50, values: closes });
  const sma200Values = SMA.calculate({ period: 200, values: closes });
  
  // Calculate RSI
  const rsiValues = RSI.calculate({ period: 14, values: closes });
  
  // Calculate Bollinger Bands
  const bbValues = BollingerBands.calculate({ 
    period: 20, 
    values: closes, 
    stdDev: 2 
  });

  // Get latest values
  const sma50 = sma50Values[sma50Values.length - 1] || 0;
  const sma200 = sma200Values[sma200Values.length - 1] || 0;
  const rsi = rsiValues[rsiValues.length - 1] || 50;
  const bb = bbValues[bbValues.length - 1] || { upper: 0, middle: 0, lower: 0, pb: 0 };

  return {
    sma50,
    sma200,
    rsi,
    bb: {
      upper: bb.upper,
      middle: bb.middle,
      lower: bb.lower,
      pb: bb.pb
    }
  };
}

// Additional technical analysis functions
export function calculateTrend(sma50: number, sma200: number): 'bullish' | 'bearish' | 'neutral' {
  if (sma50 > sma200 * 1.02) return 'bullish';
  if (sma50 < sma200 * 0.98) return 'bearish';
  return 'neutral';
}

export function getRSISignal(rsi: number): 'overbought' | 'oversold' | 'neutral' {
  if (rsi > 70) return 'overbought';
  if (rsi < 30) return 'oversold';
  return 'neutral';
}

export function getBollingerSignal(price: number, bb: { upper: number; lower: number; middle: number }): 'squeeze' | 'breakout_upper' | 'breakout_lower' | 'neutral' {
  const bandWidth = (bb.upper - bb.lower) / bb.middle;
  
  if (bandWidth < 0.1) return 'squeeze';
  if (price > bb.upper) return 'breakout_upper';
  if (price < bb.lower) return 'breakout_lower';
  return 'neutral';
}
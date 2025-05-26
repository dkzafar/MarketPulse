import { SMA, BollingerBands, RSI } from 'technicalindicators';

export function computeIndicators(ohlcv: { close: number }[]) {
  const closes = ohlcv.map(c => c.close);
  const sma50 = SMA.calculate({ period: 50, values: closes });
  const sma200 = SMA.calculate({ period: 200, values: closes }).slice(-1)[0];
  const rsi = RSI.calculate({ period: 14, values: closes }).slice(-1)[0];
  const bb = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 });
  
  return { 
    sma50: sma50[sma50.length - 1], 
    sma200, 
    rsi, 
    bb: bb[bb.length - 1] 
  };
}
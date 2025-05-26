import { SMA, BollingerBands } from 'technicalindicators';

export function computeIndicators(ohlcv: { close: number }[]) {
  const closes = ohlcv.map(c => c.close);
  const sma50 = SMA.calculate({ period: 50, values: closes });
  const bb    = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 });
  return {
    sma50: sma50[sma50.length - 1],
    bb:    bb[bb.length - 1],
  };
}
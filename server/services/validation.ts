import { AssetData, AISummary } from '../types';  // adjust these imports to match your types

/** Validates and (if necessary) overrides the AI's summary */
export function verifySummary(assetData: AssetData, summary: AISummary): AISummary & { validation: any } {
  const { ohlcv, assetClass } = assetData;
  const closes = ohlcv.map(c => c.close);
  const latest = closes[closes.length - 1];

  // 1) Recommendation vs. SMA trend
  const sma50 = summary.extraIndicators.sma50;
  const sma200 = summary.extraIndicators.sma200 || null;  // if you compute 200-day as well
  let recCheck = true;
  if (summary.signal === 'BUY' && latest < sma50) recCheck = false;
  if (summary.signal === 'SELL' && latest > sma50) recCheck = false;
  if (summary.signal === 'HOLD' && (latest > sma50 && latest > sma200)) recCheck = false;

  // 2) RSI consistency
  const rsi = summary.indicators.RSI;
  let rsiCheck = true;
  if (rsi < 30 && summary.signal !== 'BUY') rsiCheck = false;
  if (rsi > 70 && summary.signal !== 'SELL') rsiCheck = false;

  // 3) Volatility vs. risk label
  const returns = closes.slice(-30).map((v,i,a) => i>0? (v - a[i-1])/a[i-1] : 0).slice(1);
  const vol30 = Math.sqrt(returns.map(r => r*r).reduce((a,b)=>a+b)/returns.length) * Math.sqrt(252);
  const riskCheck = (vol30 > 0.6 && summary.risk === 'HIGH') ||
                    (vol30 <= 0.6 && summary.risk !== 'HIGH');

  // 4) Price target sanity: within ±20% of current
  const tgt = summary.priceTarget;
  const tgtCheck = tgt > latest * 0.8 && tgt < latest * 1.2;

  // Collect all flags
  const validation = {
    recommendationValid: recCheck,
    rsiValid:           rsiCheck,
    riskValid:          riskCheck,
    targetValid:        tgtCheck
  };

  // Optionally override the AI's signal if recommendationValid == false
  // e.g. summary.signal = latest > sma50 ? 'BUY' : 'SELL';

  return { ...summary, validation };
}
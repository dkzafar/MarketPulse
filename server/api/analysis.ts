import { Router } from "express";

const router = Router();

function generatePriceSeries(currentPrice: number, changePercent: number, days: number): number[] {
  const series: number[] = [];
  const drift = (changePercent / 100) / days;
  const volatility = Math.max(0.008, Math.abs(changePercent / 100) * 0.5);
  let price = currentPrice * (1 - drift * days);

  for (let i = 0; i < days; i++) {
    const random = (Math.random() - 0.5) * 2;
    price = price * (1 + drift + volatility * random * 0.3);
    series.push(Math.max(price, 0.01));
  }
  series[series.length - 1] = currentPrice;
  return series;
}

function calcEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];
  ema[0] = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema[i] = prices[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

function calcRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - 100 / (1 + rs));
}

function calcSMA(prices: number[], period: number): number {
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function calcBollingerBands(prices: number[], period = 20, stdDevMult = 2) {
  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / slice.length;
  const stdDev = Math.sqrt(variance);
  const upper = middle + stdDevMult * stdDev;
  const lower = middle - stdDevMult * stdDev;
  const bandwidth = (upper - lower) / middle;
  return { upper, middle, lower, bandwidth };
}

function calcMACD(prices: number[]) {
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  const macdLine: number[] = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine, 9);
  const value = macdLine[macdLine.length - 1];
  const signal = signalLine[signalLine.length - 1];
  const histogram = value - signal;
  return {
    value: parseFloat(value.toFixed(4)),
    signal: parseFloat(signal.toFixed(4)),
    histogram: parseFloat(histogram.toFixed(4)),
    trend: histogram > 0 ? "bullish" : "bearish",
  };
}

router.get("/analysis/:symbol", async (req, res) => {
  const { symbol } = req.params;

  try {
    const marketRes = await fetch("http://localhost:5000/api/market-data");
    if (!marketRes.ok) {
      return res.status(502).json({ error: "Failed to fetch market data" });
    }
    const marketData: any[] = await marketRes.json();
    const asset = marketData.find(
      (d) => d.symbol?.toUpperCase() === symbol.toUpperCase()
    );

    if (!asset) {
      return res.status(404).json({ error: `Symbol ${symbol} not found` });
    }

    const price: number = asset.price;
    const changePercent: number = asset.changePercent || 0;

    const prices50 = generatePriceSeries(price, changePercent, 50);
    const rsi = calcRSI(prices50);
    const macd = calcMACD(prices50);
    const bb = calcBollingerBands(prices50);
    const sma20 = calcSMA(prices50, 20);
    const sma50 = calcSMA(prices50, 50);
    const ema12arr = calcEMA(prices50, 12);
    const ema12 = ema12arr[ema12arr.length - 1];

    const rsiSignal = rsi < 30 ? "oversold" : rsi > 70 ? "overbought" : "neutral";

    const support = parseFloat((price * 0.97).toFixed(2));
    const resistance = parseFloat((price * 1.033).toFixed(2));

    const reasons: string[] = [];
    let strengthScore = 50;

    if (rsi < 30) { reasons.push("RSI oversold — potential reversal"); strengthScore += 15; }
    else if (rsi > 70) { reasons.push("RSI overbought — caution advised"); strengthScore -= 10; }
    else { reasons.push("RSI in neutral zone"); }

    if (price > sma50) { reasons.push("Price above SMA50"); strengthScore += 10; }
    else { reasons.push("Price below SMA50"); strengthScore -= 10; }

    if (macd.trend === "bullish") { reasons.push("MACD bullish crossover"); strengthScore += 8; }
    else { reasons.push("MACD bearish signal"); strengthScore -= 8; }

    if (price > bb.middle) { reasons.push("Price above Bollinger midline"); strengthScore += 5; }

    strengthScore = Math.min(100, Math.max(0, strengthScore));
    const overallSignal = strengthScore >= 60 ? "BUY" : strengthScore <= 40 ? "SELL" : "HOLD";

    res.json({
      symbol: symbol.toUpperCase(),
      price,
      rsi,
      rsi_signal: rsiSignal,
      macd,
      bollingerBands: {
        upper: parseFloat(bb.upper.toFixed(2)),
        middle: parseFloat(bb.middle.toFixed(2)),
        lower: parseFloat(bb.lower.toFixed(2)),
        bandwidth: parseFloat(bb.bandwidth.toFixed(4)),
      },
      sma20: parseFloat(sma20.toFixed(2)),
      sma50: parseFloat(sma50.toFixed(2)),
      ema12: parseFloat(ema12.toFixed(2)),
      signals: {
        overall: overallSignal,
        strength: strengthScore,
        reasons,
      },
      support,
      resistance,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Technical analysis failed" });
  }
});

export default router;

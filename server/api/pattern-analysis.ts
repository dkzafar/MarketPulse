import { Router } from "express";

const router = Router();

function generatePriceSeries(currentPrice: number, changePercent: number, days: number): number[] {
  const series: number[] = [];
  const drift = (changePercent / 100) / days;
  const volatility = Math.max(0.008, Math.abs(changePercent / 100) * 0.6);
  let price = currentPrice * (1 - drift * days * 0.8);

  for (let i = 0; i < days; i++) {
    const noise = (Math.random() - 0.5) * 2 * volatility * price;
    price = price + price * drift + noise;
    price = Math.max(price, 0.01);
    series.push(price);
  }
  series[series.length - 1] = currentPrice;
  return series;
}

function detectTrend(prices: number[]): "uptrend" | "downtrend" | "sideways" {
  const first = prices.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  const last = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const pctChange = ((last - first) / first) * 100;
  if (pctChange > 3) return "uptrend";
  if (pctChange < -3) return "downtrend";
  return "sideways";
}

function detectDoubleTop(prices: number[]): boolean {
  const mid = Math.floor(prices.length / 2);
  const firstHalfMax = Math.max(...prices.slice(0, mid));
  const secondHalfMax = Math.max(...prices.slice(mid));
  const currentPrice = prices[prices.length - 1];
  const bothPeaksSimilar = Math.abs(firstHalfMax - secondHalfMax) / firstHalfMax < 0.025;
  const priceBelowPeaks = currentPrice < firstHalfMax * 0.97;
  return bothPeaksSimilar && priceBelowPeaks;
}

function detectDoubleBottom(prices: number[]): boolean {
  const mid = Math.floor(prices.length / 2);
  const firstHalfMin = Math.min(...prices.slice(0, mid));
  const secondHalfMin = Math.min(...prices.slice(mid));
  const currentPrice = prices[prices.length - 1];
  const bothTroughsSimilar = Math.abs(firstHalfMin - secondHalfMin) / firstHalfMin < 0.025;
  const priceAboveTroughs = currentPrice > firstHalfMin * 1.03;
  return bothTroughsSimilar && priceAboveTroughs;
}

function detectChannel(prices: number[]): { detected: boolean; type: "ascending" | "descending" | "horizontal" } {
  const highs: number[] = [];
  const lows: number[] = [];
  const window = 5;

  for (let i = window; i < prices.length - window; i++) {
    const slice = prices.slice(i - window, i + window);
    if (prices[i] === Math.max(...slice)) highs.push(prices[i]);
    if (prices[i] === Math.min(...slice)) lows.push(prices[i]);
  }

  if (highs.length < 2 || lows.length < 2) return { detected: false, type: "horizontal" };

  const highTrend = highs[highs.length - 1] - highs[0];
  const lowTrend = lows[lows.length - 1] - lows[0];

  const channelWidth = (Math.max(...prices) - Math.min(...prices)) / prices[prices.length - 1];
  if (channelWidth < 0.04 || channelWidth > 0.25) return { detected: false, type: "horizontal" };

  if (highTrend > 0 && lowTrend > 0) return { detected: true, type: "ascending" };
  if (highTrend < 0 && lowTrend < 0) return { detected: true, type: "descending" };
  return { detected: true, type: "horizontal" };
}

router.get("/patterns/:symbol", async (req, res) => {
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
    const prices = generatePriceSeries(price, changePercent, 30);

    const trend = detectTrend(prices);
    const hasDoubleTop = detectDoubleTop(prices);
    const hasDoubleBottom = detectDoubleBottom(prices);
    const channel = detectChannel(prices);

    const patterns: { name: string; confidence: number; description: string }[] = [];

    if (hasDoubleTop) {
      patterns.push({
        name: "Double Top",
        confidence: 0.65,
        description:
          "Two similar peaks with a trough in between, suggesting a potential bearish reversal.",
      });
    }

    if (hasDoubleBottom) {
      patterns.push({
        name: "Double Bottom",
        confidence: 0.67,
        description:
          "Two similar troughs with a peak in between, suggesting a potential bullish reversal.",
      });
    }

    if (channel.detected) {
      const channelName =
        channel.type === "ascending"
          ? "Ascending Channel"
          : channel.type === "descending"
          ? "Descending Channel"
          : "Horizontal Channel";
      patterns.push({
        name: channelName,
        confidence: 0.72,
        description: `Price is moving within a ${channel.type} channel, bounded by parallel support and resistance lines.`,
      });
    }

    if (trend === "uptrend" && patterns.length === 0) {
      patterns.push({
        name: "Uptrend",
        confidence: 0.7,
        description:
          "Price is making higher highs and higher lows, indicating bullish momentum.",
      });
    } else if (trend === "downtrend" && patterns.length === 0) {
      patterns.push({
        name: "Downtrend",
        confidence: 0.7,
        description:
          "Price is making lower highs and lower lows, indicating bearish momentum.",
      });
    } else if (trend === "sideways" && patterns.length === 0) {
      patterns.push({
        name: "Consolidation",
        confidence: 0.6,
        description:
          "Price is moving sideways within a tight range, indicating indecision.",
      });
    }

    const support = parseFloat((Math.min(...prices) * 1.01).toFixed(2));
    const resistance = parseFloat((Math.max(...prices) * 0.99).toFixed(2));

    const priceTargetMultiplier =
      trend === "uptrend" ? 1.05 : trend === "downtrend" ? 0.95 : 1.02;
    const priceTarget = parseFloat((price * priceTargetMultiplier).toFixed(2));

    res.json({
      symbol: symbol.toUpperCase(),
      patterns,
      trend,
      keyLevels: { support, resistance },
      priceTarget,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Pattern analysis error:", error);
    res.status(500).json({ error: "Pattern analysis failed" });
  }
});

export default router;

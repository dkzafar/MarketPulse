import { Router } from "express";

const router = Router();

function isMarketOpen(): boolean {
  const now = new Date();
  const etOffset = -5 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const etMinutes = ((utcMinutes + etOffset) % (24 * 60) + 24 * 60) % (24 * 60);
  const dayOfWeek = new Date(
    now.getTime() + etOffset * 60 * 1000
  ).getUTCDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  const marketOpen = 9 * 60 + 30;
  const marketClose = 16 * 60;
  return etMinutes >= marketOpen && etMinutes < marketClose;
}

function smallChange(base: number, maxPct = 0.015): number {
  const pct = (Math.random() - 0.5) * 2 * maxPct;
  return parseFloat((base * (1 + pct)).toFixed(2));
}

function smallChangePct(maxPct = 1.5): number {
  return parseFloat(((Math.random() - 0.5) * 2 * maxPct).toFixed(2));
}

router.get("/demo/summary", (_req, res) => {
  const marketOpen = isMarketOpen();

  const spxBase = 5280.4;
  const dowBase = 39142.2;
  const nasdaqBase = 16523.8;

  const spxChange = smallChangePct();
  const dowChange = smallChangePct();
  const nasdaqChange = smallChangePct();

  const totalChange = spxChange + dowChange + nasdaqChange;
  const sentiment =
    totalChange > 1.2 ? "bullish" : totalChange < -1.2 ? "bearish" : "neutral";

  const movers = [
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      price: smallChange(875.4),
      changePercent: smallChangePct(3),
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc.",
      price: smallChange(245.1),
      changePercent: smallChangePct(3),
    },
    {
      symbol: "META",
      name: "Meta Platforms Inc.",
      price: smallChange(512.7),
      changePercent: smallChangePct(3),
    },
  ];

  res.json({
    marketStatus: {
      isOpen: marketOpen,
      session: marketOpen ? "regular" : "closed",
      nextOpen: marketOpen ? null : "Monday 09:30 ET",
    },
    indices: {
      sp500: {
        value: smallChange(spxBase),
        changePercent: spxChange,
        change: parseFloat(((spxBase * spxChange) / 100).toFixed(2)),
      },
      dow: {
        value: smallChange(dowBase),
        changePercent: dowChange,
        change: parseFloat(((dowBase * dowChange) / 100).toFixed(2)),
      },
      nasdaq: {
        value: smallChange(nasdaqBase),
        changePercent: nasdaqChange,
        change: parseFloat(((nasdaqBase * nasdaqChange) / 100).toFixed(2)),
      },
    },
    sentiment,
    topMovers: movers,
    timestamp: new Date().toISOString(),
  });
});

export default router;

import { Router } from "express";

const router = Router();

function computeSentimentFromChange(changePercent: number): {
  sentiment: "bullish" | "bearish" | "neutral";
  score: number;
  buzz: number;
  newsCount: number;
  socialMentions: number;
  weeklyScoreChange: number;
} {
  const normalized = Math.max(-10, Math.min(10, changePercent));
  const rawScore = 0.5 + normalized * 0.04;
  const score = parseFloat(Math.max(0, Math.min(1, rawScore)).toFixed(2));

  const sentiment =
    score > 0.6 ? "bullish" : score < 0.4 ? "bearish" : "neutral";
  const buzz = parseFloat((0.4 + Math.random() * 0.5).toFixed(2));
  const newsCount = Math.floor(5 + Math.random() * 20);
  const socialMentions = Math.floor(1000 + Math.random() * 8000);
  const weeklyScoreChange = parseFloat(((Math.random() - 0.4) * 0.3).toFixed(2));

  return { sentiment, score, buzz, newsCount, socialMentions, weeklyScoreChange };
}

router.get("/sentiment/:symbol", async (req, res) => {
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

    const changePercent: number = asset?.changePercent ?? 0;

    const finnhubKey = process.env.FINNHUB_API_KEY;

    if (finnhubKey) {
      try {
        const finnhubRes = await fetch(
          `https://finnhub.io/api/v1/news-sentiment?symbol=${symbol.toUpperCase()}&token=${finnhubKey}`
        );
        if (finnhubRes.ok) {
          const data = await finnhubRes.json();
          if (data && typeof data.companyNewsScore === "number") {
            const score = parseFloat(
              Math.max(0, Math.min(1, data.companyNewsScore)).toFixed(2)
            );
            const sentiment =
              score > 0.6 ? "bullish" : score < 0.4 ? "bearish" : "neutral";
            return res.json({
              symbol: symbol.toUpperCase(),
              sentiment,
              score,
              buzz: parseFloat((data.buzz?.articlesInLastWeek / 50 || 0.5).toFixed(2)),
              newsCount: data.buzz?.articlesInLastWeek ?? 0,
              socialMentions: Math.floor(1000 + Math.random() * 8000),
              weeklyScoreChange: parseFloat(
                ((data.companyNewsScore - 0.5) * 0.4).toFixed(2)
              ),
              source: "finnhub",
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.log("Finnhub sentiment fetch failed, falling back to computed");
      }
    }

    const computed = computeSentimentFromChange(changePercent);

    res.json({
      symbol: symbol.toUpperCase(),
      ...computed,
      source: "computed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Sentiment error:", error);
    res.status(500).json({ error: "Sentiment analysis failed" });
  }
});

export default router;

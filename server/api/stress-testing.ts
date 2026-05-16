import { Router } from "express";

const router = Router();

type AssetCategory = "tech" | "growth" | "value" | "financial" | "crypto" | "forex" | "commodity" | "gold" | "other";

const TECH_SYMBOLS = new Set([
  "AAPL", "MSFT", "GOOGL", "GOOG", "META", "NVDA", "AMD", "INTC", "CRM", "ADBE",
  "ORCL", "NFLX", "CSCO", "AVGO", "TXN", "QCOM", "NOW", "INTU", "MU", "AMAT",
  "SNOW", "PLTR", "CRWD", "NET", "DDOG", "OKTA", "DOCU", "ZM", "TEAM", "TWLO",
]);

const FINANCIAL_SYMBOLS = new Set([
  "JPM", "BAC", "WFC", "GS", "MS", "C", "AXP", "BLK", "SCHW", "USB",
  "PNC", "COF", "CB", "MMC", "ICE", "SPGI", "MCO", "V", "MA",
]);

const HEALTHCARE_SYMBOLS = new Set([
  "JNJ", "PFE", "UNH", "ABBV", "MRK", "TMO", "ABT", "DHR", "BMY", "AMGN",
  "GILD", "BIIB", "REGN", "VRTX", "ISRG", "MDT", "CVS", "ANTM", "CI", "HUM",
]);

const CRYPTO_SUFFIXES = ["-USD", "BTC", "ETH", "BNB", "SOL", "ADA", "XRP", "DOT", "AVAX", "MATIC", "DOGE", "LINK"];
const FOREX_PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD", "EUR/USD", "GBP/USD"];
const COMMODITY_SYMBOLS = new Set(["OIL", "CL", "NG", "CORN", "WHEAT", "SOYB", "COPPER", "XOM", "CVX", "COP", "SLB"]);
const GOLD_SYMBOLS = new Set(["GOLD", "GLD", "IAU", "XAUUSD", "NEM", "RGLD", "WPM"]);

function classifySymbol(symbol: string): AssetCategory {
  const upper = symbol.toUpperCase();
  if (GOLD_SYMBOLS.has(upper)) return "gold";
  if (COMMODITY_SYMBOLS.has(upper)) return "commodity";
  if (CRYPTO_SUFFIXES.some((s) => upper.includes(s))) return "crypto";
  if (FOREX_PAIRS.includes(upper)) return "forex";
  if (FINANCIAL_SYMBOLS.has(upper)) return "financial";
  if (TECH_SYMBOLS.has(upper)) return "tech";
  if (HEALTHCARE_SYMBOLS.has(upper)) return "value";
  return "other";
}

interface Position {
  symbol: string;
  quantity: number;
  currentPrice: number;
}

interface ScenarioShock {
  tech: number;
  growth: number;
  value: number;
  financial: number;
  crypto: number;
  forex: number;
  commodity: number;
  gold: number;
  other: number;
}

interface Scenario {
  name: string;
  description: string;
  shocks: ScenarioShock;
}

const SCENARIOS: Scenario[] = [
  {
    name: "2008 Financial Crisis",
    description: "Severe global credit crunch and banking system collapse leading to a prolonged bear market.",
    shocks: {
      tech: -0.50,
      growth: -0.50,
      value: -0.45,
      financial: -0.65,
      crypto: -0.30,
      forex: -0.10,
      commodity: -0.35,
      gold: 0.15,
      other: -0.50,
    },
  },
  {
    name: "COVID Crash (March 2020)",
    description: "Rapid pandemic-driven market selloff causing extreme volatility across all asset classes.",
    shocks: {
      tech: -0.30,
      growth: -0.35,
      value: -0.40,
      financial: -0.45,
      crypto: -0.45,
      forex: -0.05,
      commodity: -0.40,
      gold: 0.05,
      other: -0.35,
    },
  },
  {
    name: "Rate Hike Shock",
    description: "Aggressive central bank rate hikes crush growth valuations while financials benefit modestly.",
    shocks: {
      tech: -0.25,
      growth: -0.20,
      value: -0.10,
      financial: 0.05,
      crypto: -0.15,
      forex: 0.03,
      commodity: 0.08,
      gold: -0.05,
      other: -0.12,
    },
  },
  {
    name: "Tech Sector Selloff",
    description: "Sector rotation out of technology as valuations compress and regulatory pressure mounts.",
    shocks: {
      tech: -0.40,
      growth: -0.35,
      value: -0.05,
      financial: -0.05,
      crypto: -0.30,
      forex: -0.02,
      commodity: 0.02,
      gold: 0.05,
      other: -0.10,
    },
  },
  {
    name: "Stagflation",
    description: "Simultaneous high inflation and economic stagnation eroding real equity returns while hard assets rally.",
    shocks: {
      tech: -0.28,
      growth: -0.25,
      value: -0.20,
      financial: -0.15,
      crypto: -0.30,
      forex: -0.05,
      commodity: 0.20,
      gold: 0.10,
      other: -0.25,
    },
  },
];

router.post("/stress-test", (req, res) => {
  const { positions } = req.body as { positions: Position[] };

  if (!Array.isArray(positions) || positions.length === 0) {
    return res.status(400).json({ error: "positions must be a non-empty array" });
  }

  for (const p of positions) {
    if (typeof p.symbol !== "string" || typeof p.quantity !== "number" || typeof p.currentPrice !== "number") {
      return res.status(400).json({ error: "Each position must have symbol (string), quantity (number), and currentPrice (number)" });
    }
  }

  const baseValue = positions.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0);

  const scenarioResults = SCENARIOS.map((scenario) => {
    const positionImpacts = positions.map((p) => {
      const category = classifySymbol(p.symbol);
      const shockRate = scenario.shocks[category];
      const positionValue = p.quantity * p.currentPrice;
      const stressedPositionValue = positionValue * (1 + shockRate);
      return {
        symbol: p.symbol,
        category,
        impact: parseFloat((shockRate * 100).toFixed(1)),
        originalValue: parseFloat(positionValue.toFixed(2)),
        stressedValue: parseFloat(stressedPositionValue.toFixed(2)),
      };
    });

    const stressedValue = positionImpacts.reduce((sum, p) => sum + p.stressedValue, 0);
    const impactValue = stressedValue - baseValue;
    const impactPercent = baseValue > 0 ? (impactValue / baseValue) * 100 : 0;

    return {
      name: scenario.name,
      description: scenario.description,
      impactPercent: parseFloat(impactPercent.toFixed(1)),
      impactValue: parseFloat(impactValue.toFixed(2)),
      stressedValue: parseFloat(stressedValue.toFixed(2)),
      positionImpacts,
    };
  });

  const worstScenario = scenarioResults.reduce((worst, s) =>
    s.impactValue < worst.impactValue ? s : worst
  );

  const recommendations: string[] = [];

  const categories = positions.map((p) => classifySymbol(p.symbol));
  const uniqueCategories = new Set(categories);

  if (uniqueCategories.size <= 2) {
    recommendations.push("Diversify across multiple asset classes to reduce concentration risk.");
  }
  if (categories.filter((c) => c === "tech").length > positions.length * 0.5) {
    recommendations.push("Reduce tech concentration — consider rotating into value and defensive sectors.");
  }
  if (!categories.includes("gold") && !categories.includes("commodity")) {
    recommendations.push("Add inflation hedges such as gold or commodities to protect against stagflation.");
  }
  if (!categories.includes("financial")) {
    recommendations.push("Financial sector allocation can provide a buffer during rate-hike environments.");
  }
  if (Math.abs(worstScenario.impactPercent) > 40) {
    recommendations.push("Portfolio is highly vulnerable in tail-risk scenarios — consider protective puts or defensive rebalancing.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Portfolio shows reasonable diversification. Continue monitoring sector concentration.");
  }

  res.json({
    baseValue: parseFloat(baseValue.toFixed(2)),
    scenarios: scenarioResults,
    worstCase: {
      scenario: worstScenario.name,
      loss: worstScenario.impactValue,
      lossPercent: worstScenario.impactPercent,
    },
    recommendations,
    timestamp: new Date().toISOString(),
  });
});

export default router;

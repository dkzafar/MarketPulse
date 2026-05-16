import { Router } from "express";

const router = Router();

const SECTOR_MAP: Record<string, string> = {
  AAPL: "tech", MSFT: "tech", GOOGL: "tech", GOOG: "tech", NVDA: "tech",
  AMD: "tech", INTC: "tech", CRM: "tech", ADBE: "tech", ORCL: "tech",
  META: "tech", NFLX: "tech", CSCO: "tech", AVGO: "tech", TXN: "tech",
  QCOM: "tech", NOW: "tech", INTU: "tech", MU: "tech", AMAT: "tech",
  TSLA: "tech", SNOW: "tech", PLTR: "tech", CRWD: "tech", NET: "tech",
  DDOG: "tech", OKTA: "tech", DOCU: "tech", ZM: "tech", TEAM: "tech",
  JPM: "finance", BAC: "finance", WFC: "finance", GS: "finance", MS: "finance",
  C: "finance", AXP: "finance", BLK: "finance", SCHW: "finance", USB: "finance",
  PNC: "finance", COF: "finance", CB: "finance", MMC: "finance", ICE: "finance",
  SPGI: "finance", MCO: "finance", V: "finance", MA: "finance",
  JNJ: "healthcare", PFE: "healthcare", UNH: "healthcare", ABBV: "healthcare",
  MRK: "healthcare", TMO: "healthcare", ABT: "healthcare", DHR: "healthcare",
  BMY: "healthcare", AMGN: "healthcare", GILD: "healthcare", BIIB: "healthcare",
  REGN: "healthcare", VRTX: "healthcare", ISRG: "healthcare", MDT: "healthcare",
  CVS: "healthcare", ANTM: "healthcare", CI: "healthcare", HUM: "healthcare",
  XOM: "energy", CVX: "energy", COP: "energy", SLB: "energy", EOG: "energy",
  OXY: "energy", MPC: "energy", PSX: "energy", VLO: "energy", KMI: "energy",
  WMT: "consumer", PG: "consumer", KO: "consumer", PEP: "consumer", COST: "consumer",
  HD: "consumer", MCD: "consumer", SBUX: "consumer", NKE: "consumer", TGT: "consumer",
  DIS: "consumer", LOW: "consumer", TJX: "consumer", CL: "consumer", EL: "consumer",
};

async function fetchMarketData(): Promise<any[]> {
  const res = await fetch("http://localhost:5000/api/market-data");
  if (!res.ok) throw new Error("Failed to fetch market data");
  return res.json();
}

router.get("/enhanced/movers", async (req, res) => {
  const type = (req.query.type as string) || "gainers";

  try {
    const data = await fetchMarketData();

    let sorted: any[];
    if (type === "losers") {
      sorted = [...data].sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0));
    } else if (type === "volume") {
      sorted = [...data].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
    } else {
      sorted = [...data].sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0));
    }

    res.json(sorted.slice(0, 20));
  } catch (error) {
    console.error("Movers error:", error);
    res.status(500).json({ error: "Failed to fetch movers" });
  }
});

router.get("/enhanced/screener", async (req, res) => {
  const {
    category,
    minChange,
    maxChange,
    minPrice,
    maxPrice,
    limit = "50",
  } = req.query as Record<string, string>;

  try {
    let data = await fetchMarketData();

    if (category) {
      data = data.filter((d) => d.category?.toLowerCase() === category.toLowerCase());
    }
    if (minChange !== undefined) {
      data = data.filter((d) => (d.changePercent ?? 0) >= parseFloat(minChange));
    }
    if (maxChange !== undefined) {
      data = data.filter((d) => (d.changePercent ?? 0) <= parseFloat(maxChange));
    }
    if (minPrice !== undefined) {
      data = data.filter((d) => (d.price ?? 0) >= parseFloat(minPrice));
    }
    if (maxPrice !== undefined) {
      data = data.filter((d) => (d.price ?? 0) <= parseFloat(maxPrice));
    }

    res.json(data.slice(0, parseInt(limit, 10)));
  } catch (error) {
    console.error("Screener error:", error);
    res.status(500).json({ error: "Screener failed" });
  }
});

router.get("/enhanced/sectors", async (req, res) => {
  try {
    const data = await fetchMarketData();

    const sectorMap: Record<string, { symbols: string[]; totalChange: number; count: number }> = {
      tech: { symbols: [], totalChange: 0, count: 0 },
      finance: { symbols: [], totalChange: 0, count: 0 },
      healthcare: { symbols: [], totalChange: 0, count: 0 },
      energy: { symbols: [], totalChange: 0, count: 0 },
      consumer: { symbols: [], totalChange: 0, count: 0 },
    };

    for (const asset of data) {
      const sector = SECTOR_MAP[asset.symbol?.toUpperCase()];
      if (sector && sectorMap[sector]) {
        sectorMap[sector].symbols.push(asset.symbol);
        sectorMap[sector].totalChange += asset.changePercent ?? 0;
        sectorMap[sector].count++;
      }
    }

    const sectors = Object.entries(sectorMap).map(([name, info]) => ({
      sector: name,
      symbolCount: info.count,
      avgChangePercent:
        info.count > 0
          ? parseFloat((info.totalChange / info.count).toFixed(2))
          : 0,
      performance:
        info.count > 0 && info.totalChange / info.count > 0.5
          ? "outperforming"
          : info.count > 0 && info.totalChange / info.count < -0.5
          ? "underperforming"
          : "neutral",
      symbols: info.symbols.slice(0, 10),
    }));

    res.json(sectors);
  } catch (error) {
    console.error("Sectors error:", error);
    res.status(500).json({ error: "Sector analysis failed" });
  }
});

export default router;

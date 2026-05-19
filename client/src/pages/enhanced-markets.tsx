import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  TrendingUp, TrendingDown, Search, Brain, RefreshCw,
  Plus, Heart, Zap, BarChart3, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import ContentRow from "@/components/content-row";
import NetflixStockCard from "@/components/netflix-stock-card";
import QuickTradeDialog from "@/components/quick-trade-dialog";

interface EnhancedAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  category: string;
  pe?: number;
  volatility?: number;
  sentiment?: "bullish" | "bearish" | "neutral";
  signal?: "BUY" | "SELL" | "HOLD" | "WATCH";
  aiAnalysis?: {
    analysis: {
      recommendation: string;
      confidence: number;
      targetPrice: number;
      reasoning: string;
    };
  };
}

function getSector(symbol: string): string {
  const tech    = ["AAPL","GOOGL","MSFT","NVDA","META","AMZN","TSLA","NFLX","AMD","INTC","CRM","ADBE","ORCL"];
  const finance = ["JPM","BAC","WFC","GS","MS","C","AXP","BLK","SCHW"];
  const health  = ["JNJ","PFE","UNH","ABT","TMO","MRK","ABBV","BMY"];
  if (tech.includes(symbol))    return "Technology";
  if (finance.includes(symbol)) return "Financial";
  if (health.includes(symbol))  return "Healthcare";
  return "Other";
}

function getSignal(changePercent: number, volume: number): "BUY" | "SELL" | "HOLD" | "WATCH" {
  if (changePercent > 5  && volume > 1_000_000) return "BUY";
  if (changePercent < -5 && volume > 1_000_000) return "SELL";
  if (Math.abs(changePercent) > 2)              return "WATCH";
  return "HOLD";
}

function fmtMktCap(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return n ? `$${n}` : "—";
}

export default function EnhancedMarketsPage() {
  const [searchQuery, setSearchQuery]         = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAsset, setSelectedAsset]     = useState<EnhancedAsset | null>(null);
  const [tradeSymbol, setTradeSymbol]         = useState<string | null>(null);
  const [watchlist, setWatchlist]             = useState<string[]>([]);

  const { data: rawMarketData = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/market-data"],
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const aiAnalysisMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const res = await fetch("/api/ai-market-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      return res.json();
    },
    onSuccess: (data) => {
      setSelectedAsset(prev => prev ? { ...prev, aiAnalysis: data } : null);
    },
  });

  const allAssets: EnhancedAsset[] = useMemo(() =>
    (rawMarketData as any[]).map((asset: any): EnhancedAsset => ({
      symbol:        asset.symbol,
      name:          asset.name || asset.symbol,
      price:         asset.price || 0,
      change:        asset.change || 0,
      changePercent: asset.changePercent || 0,
      volume:        asset.volume || 0,
      marketCap:     asset.marketCap || 0,
      sector:        getSector(asset.symbol),
      category:      asset.category || "stocks",
      pe:            asset.category !== "crypto" && asset.pe ? asset.pe : undefined,
      volatility:    Math.abs(asset.changePercent) || 0,
      sentiment:     asset.changePercent > 2 ? "bullish" : asset.changePercent < -2 ? "bearish" : "neutral",
      signal:        getSignal(asset.changePercent, asset.volume),
    })),
    [rawMarketData],
  );

  const filteredAssets = useMemo(() => {
    let res = allAssets;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(a => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
    }
    if (selectedCategory !== "all") {
      res = res.filter(a => a.category === selectedCategory);
    }
    return res;
  }, [allAssets, searchQuery, selectedCategory]);

  // Rows
  const trending  = useMemo(() => [...filteredAssets].sort((a, b) => b.volume - a.volume).slice(0, 20),          [filteredAssets]);
  const gainers   = useMemo(() => [...filteredAssets].sort((a, b) => b.changePercent - a.changePercent).slice(0, 20), [filteredAssets]);
  const losers    = useMemo(() => [...filteredAssets].sort((a, b) => a.changePercent - b.changePercent).slice(0, 20), [filteredAssets]);
  const aiSignals = useMemo(() => filteredAssets.filter(a => a.signal === "BUY").slice(0, 20),                   [filteredAssets]);
  const crypto    = useMemo(() => filteredAssets.filter(a => a.category === "crypto").slice(0, 20),              [filteredAssets]);
  const techRow   = useMemo(() => filteredAssets.filter(a => a.sector === "Technology").slice(0, 20),            [filteredAssets]);
  const finRow    = useMemo(() => filteredAssets.filter(a => a.sector === "Financial").slice(0, 20),             [filteredAssets]);
  const healthRow = useMemo(() => filteredAssets.filter(a => a.sector === "Healthcare").slice(0, 20),            [filteredAssets]);

  // Market stats
  const total      = allAssets.length;
  const nGainers   = allAssets.filter(a => a.changePercent > 0).length;
  const nLosers    = allAssets.filter(a => a.changePercent < 0).length;
  const avgChange  = total > 0 ? allAssets.reduce((s, a) => s + a.changePercent, 0) / total : 0;
  const bullish    = avgChange >= 0;

  const toggleWatchlist = (symbol: string) =>
    setWatchlist(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);

  const openAnalysis = (asset: EnhancedAsset) => {
    setSelectedAsset(asset);
    if (!asset.aiAnalysis) aiAnalysisMutation.mutate(asset.symbol);
  };

  const handleAnalyzeBySymbol = (symbol: string) => {
    const asset = allAssets.find(a => a.symbol === symbol);
    if (asset) openAnalysis(asset);
  };

  const showRows = !searchQuery && selectedCategory === "all";

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden border-b border-border"
        style={{ background: "linear-gradient(135deg, #020817 0%, #0f172a 50%, #0c1a0c 100%)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(34,197,94,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,rgba(59,130,246,0.08),transparent_50%)]" />

        <div className="relative px-6 py-8 lg:px-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-medium uppercase tracking-wide">Live Markets</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Market Explorer</h1>
              <p className="text-white/40 text-sm mt-1">{total.toLocaleString()} assets tracked in real-time</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white"
              onClick={() => refetch()}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Market sentiment strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Advancing",  value: nGainers,             icon: <TrendingUp className="h-4 w-4" />,  color: "text-green-400 bg-green-500/10 border-green-500/20" },
              { label: "Declining",  value: nLosers,              icon: <TrendingDown className="h-4 w-4" />,color: "text-red-400 bg-red-500/10 border-red-500/20" },
              { label: "Avg Change", value: `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`, icon: <Activity className="h-4 w-4" />, color: bullish ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-red-400 bg-red-500/10 border-red-500/20" },
              { label: "AI Picks",   value: aiSignals.length,     icon: <Brain className="h-4 w-4" />,       color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
            ].map(s => (
              <div key={s.label} className={cn("rounded-xl border p-3 backdrop-blur-sm", s.color)}>
                <div className="flex items-center gap-2 text-xs mb-1 opacity-70">{s.icon}{s.label}</div>
                <div className="text-lg font-bold text-white">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search stocks, crypto, ETFs…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "stocks", "crypto", "forex", "etf"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {cat === "all" ? "All Markets" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* CONTENT */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="px-6 py-8 lg:px-10"
      >
        {searchQuery || selectedCategory !== "all" ? (
          /* Search results grid */
          <div>
            <p className="text-sm text-muted-foreground mb-4">{filteredAssets.length} results</p>
            <div className="flex flex-wrap gap-4">
              {filteredAssets.map(a => (
                <NetflixStockCard
                  key={a.symbol}
                  asset={a}
                  onBuy={setTradeSymbol}
                  onAnalyze={() => openAnalysis(a)}
                />
              ))}
              {filteredAssets.length === 0 && !isLoading && (
                <div className="w-full text-center py-16 text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No assets found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Netflix rows */
          <>
            <ContentRow title="Most Active" icon="🔥" loading={isLoading}>
              {trending.map(a => <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} onAnalyze={() => openAnalysis(a)} />)}
            </ContentRow>

            <ContentRow title="Top Gainers" icon="🚀" loading={isLoading}>
              {gainers.map(a => <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} onAnalyze={() => openAnalysis(a)} />)}
            </ContentRow>

            {aiSignals.length > 0 && (
              <ContentRow title="AI Buy Signals" icon="🤖">
                {aiSignals.map(a => <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} onAnalyze={() => openAnalysis(a)} />)}
              </ContentRow>
            )}

            <ContentRow title="Biggest Drops" icon="📉" loading={isLoading}>
              {losers.map(a => <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} onAnalyze={() => openAnalysis(a)} />)}
            </ContentRow>

            {crypto.length > 0 && (
              <ContentRow title="Crypto" icon="💰">
                {crypto.map(a => <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} onAnalyze={() => openAnalysis(a)} />)}
              </ContentRow>
            )}

            {techRow.length > 0 && (
              <ContentRow title="Technology" icon="💻">
                {techRow.map(a => <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} onAnalyze={() => openAnalysis(a)} />)}
              </ContentRow>
            )}

            {finRow.length > 0 && (
              <ContentRow title="Financial" icon="🏦">
                {finRow.map(a => <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} onAnalyze={() => openAnalysis(a)} />)}
              </ContentRow>
            )}

            {healthRow.length > 0 && (
              <ContentRow title="Healthcare" icon="⚕️">
                {healthRow.map(a => <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} onAnalyze={() => openAnalysis(a)} />)}
              </ContentRow>
            )}
          </>
        )}
      </motion.div>

      {/* AI Analysis Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="font-bold">AI Analysis</div>
                <div className="text-sm font-normal text-muted-foreground">{selectedAsset?.symbol} · {selectedAsset?.name}</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-4">
              {/* Price & change */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted/20 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Price</div>
                  <div className="font-bold">${selectedAsset.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Change</div>
                  <div className={cn("font-bold", selectedAsset.changePercent >= 0 ? "text-green-500" : "text-red-500")}>
                    {selectedAsset.changePercent >= 0 ? "+" : ""}{selectedAsset.changePercent.toFixed(2)}%
                  </div>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Signal</div>
                  <Badge variant={selectedAsset.signal === "BUY" ? "default" : selectedAsset.signal === "SELL" ? "destructive" : "secondary"}>
                    {selectedAsset.signal}
                  </Badge>
                </div>
              </div>

              {/* AI results */}
              {aiAnalysisMutation.isPending && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mr-3" />
                  Analyzing with AI…
                </div>
              )}

              {selectedAsset.aiAnalysis && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">Recommendation</div>
                      <div className="font-bold text-primary text-sm">{selectedAsset.aiAnalysis.analysis.recommendation || "—"}</div>
                    </div>
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                      <div className="font-bold text-green-400">{selectedAsset.aiAnalysis.analysis.confidence || 0}%</div>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">Target</div>
                      <div className="font-bold text-blue-400">${selectedAsset.aiAnalysis.analysis.targetPrice?.toFixed(2) || selectedAsset.price.toFixed(2)}</div>
                    </div>
                  </div>

                  {selectedAsset.aiAnalysis.analysis.reasoning && (
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedAsset.aiAnalysis.analysis.reasoning}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => { setSelectedAsset(null); setTradeSymbol(selectedAsset.symbol); }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buy {selectedAsset.symbol}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => toggleWatchlist(selectedAsset.symbol)}
                >
                  <Heart className={cn("h-4 w-4 mr-2", watchlist.includes(selectedAsset.symbol) && "fill-red-500 text-red-500")} />
                  {watchlist.includes(selectedAsset.symbol) ? "Watchlisted" : "Add Watchlist"}
                </Button>
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => aiAnalysisMutation.mutate(selectedAsset.symbol)}
                  disabled={aiAnalysisMutation.isPending}
                >
                  <RefreshCw className={cn("h-4 w-4", aiAnalysisMutation.isPending && "animate-spin")} />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {tradeSymbol && (
        <QuickTradeDialog symbol={tradeSymbol} onClose={() => setTradeSymbol(null)} />
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Wallet } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useWatchlist } from "@/hooks/use-watchlist";
import { cn } from "@/lib/utils";
import ContentRow from "@/components/content-row";
import NetflixStockCard from "@/components/netflix-stock-card";
import QuickTradeDialog from "@/components/quick-trade-dialog";

interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  change?: number;
  volume?: number;
  marketCap?: number;
  category?: string;
  signal?: string;
  pe?: number;
}

interface PortfolioPosition {
  id: number;
  symbol: string;
  quantity: string;
  averagePrice: string;
  totalCost: string;
  currentValue: string | null;
  unrealizedPnL: string | null;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function HeroStat({ label, value, sub, icon, accent }: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; accent: "green" | "red" | "blue" | "purple";
}) {
  const colors: Record<string, string> = {
    green:  "text-green-400 bg-green-500/10 border-green-500/20",
    red:    "text-red-400 bg-red-500/10 border-red-500/20",
    blue:   "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };
  return (
    <div className={cn("rounded-xl border p-4 backdrop-blur-sm", colors[accent])}>
      <div className="flex items-center gap-2 mb-2 text-xs font-medium opacity-80">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs mt-1 opacity-70">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { watchlist } = useWatchlist();
  const [tradeSymbol, setTradeSymbol] = useState<string | null>(null);

  const { data: positions = [] } = useQuery<PortfolioPosition[]>({
    queryKey: ["/api/portfolio/positions"],
    queryFn: async () => {
      const r = await fetch("/api/portfolio/positions", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
    refetchInterval: 60000,
  });

  const { data: marketRaw = [], isLoading } = useQuery<MarketAsset[]>({
    queryKey: ["/api/market-data"],
    queryFn: async () => {
      const r = await fetch("/api/market-data");
      return r.ok ? r.json() : [];
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const assets: MarketAsset[] = useMemo(() =>
    Array.isArray(marketRaw)
      ? marketRaw.filter((a): a is MarketAsset => !!a.symbol && typeof a.price === "number")
      : [],
    [marketRaw],
  );

  // Portfolio stats
  const totalCost   = positions.reduce((s, p) => s + parseFloat(p.totalCost), 0);
  const totalValue  = positions.reduce((s, p) => s + (p.currentValue ? parseFloat(p.currentValue) : parseFloat(p.totalCost)), 0);
  const totalPnL    = positions.reduce((s, p) => s + (p.unrealizedPnL ? parseFloat(p.unrealizedPnL) : 0), 0);
  const totalReturn = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const cashBalance = user?.cashBalance ?? 0;
  const accountValue = totalValue + cashBalance;

  // Market rows
  const topGainers   = useMemo(() => [...assets].sort((a, b) => b.changePercent - a.changePercent).slice(0, 20), [assets]);
  const topLosers    = useMemo(() => [...assets].sort((a, b) => a.changePercent - b.changePercent).slice(0, 20), [assets]);
  const cryptoAssets = useMemo(() => assets.filter(a => a.category === "crypto").slice(0, 20), [assets]);
  const aiPicks      = useMemo(() => assets.filter(a => a.signal === "BUY").slice(0, 20), [assets]);
  const stockAssets  = useMemo(() => assets.filter(a => a.category === "stocks").slice(0, 20), [assets]);
  const watchlistRow = useMemo(() => {
    const syms = watchlist?.symbols ?? [];
    return assets.filter(a => syms.includes(a.symbol));
  }, [assets, watchlist]);

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden border-b border-border"
        style={{ background: "linear-gradient(135deg, #020817 0%, #0f172a 40%, #1e1b4b 70%, #0f172a 100%)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(139,92,246,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(59,130,246,0.1),transparent_50%)]" />

        <div className="relative px-6 py-8 lg:px-10 lg:py-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium tracking-wide uppercase">Markets Live</span>
          </div>

          <h1 className="text-2xl lg:text-4xl font-bold text-white mb-1">
            Good {getGreeting()}, {user?.username ?? "Trader"}
          </h1>
          <p className="text-white/40 text-sm mb-8">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <HeroStat
              label="Account Value"
              value={`$${accountValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<DollarSign className="h-4 w-4" />}
              accent="blue"
            />
            <HeroStat
              label="Holdings"
              value={`$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<BarChart3 className="h-4 w-4" />}
              accent="purple"
            />
            <HeroStat
              label="Unrealized P&L"
              value={`${totalPnL >= 0 ? "+" : ""}$${Math.abs(totalPnL).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub={`${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}% return`}
              icon={totalPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              accent={totalPnL >= 0 ? "green" : "red"}
            />
            <HeroStat
              label="Cash Available"
              value={`$${cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<Wallet className="h-4 w-4" />}
              accent="green"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { href: "/portfolio", label: "View Portfolio" },
              { href: "/markets",   label: "Browse Markets" },
              { href: "/ai-chat",   label: "Ask AI" },
            ].map(l => (
              <Link key={l.href} href={l.href}>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors cursor-pointer">
                  {l.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CONTENT ROWS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="px-6 py-8 lg:px-10"
      >
        {watchlistRow.length > 0 && (
          <ContentRow title="Your Watchlist" icon="⭐">
            {watchlistRow.map(a => (
              <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} />
            ))}
          </ContentRow>
        )}

        <ContentRow title="Top Gainers Today" icon="🚀" loading={isLoading}>
          {topGainers.map(a => (
            <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} />
          ))}
        </ContentRow>

        {aiPicks.length > 0 && (
          <ContentRow title="AI Buy Signals" icon="🤖">
            {aiPicks.map(a => (
              <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} />
            ))}
          </ContentRow>
        )}

        <ContentRow title="Biggest Drops" icon="📉" loading={isLoading}>
          {topLosers.map(a => (
            <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} />
          ))}
        </ContentRow>

        {cryptoAssets.length > 0 && (
          <ContentRow title="Crypto" icon="💰">
            {cryptoAssets.map(a => (
              <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} />
            ))}
          </ContentRow>
        )}

        {stockAssets.length > 0 && (
          <ContentRow title="Stocks" icon="🏛️" loading={isLoading}>
            {stockAssets.map(a => (
              <NetflixStockCard key={a.symbol} asset={a} onBuy={setTradeSymbol} />
            ))}
          </ContentRow>
        )}
      </motion.div>

      {tradeSymbol && (
        <QuickTradeDialog symbol={tradeSymbol} onClose={() => setTradeSymbol(null)} />
      )}
    </div>
  );
}

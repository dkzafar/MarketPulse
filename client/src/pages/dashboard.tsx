import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import SummaryCards from "@/components/summary-cards";
import PriceChart from "@/components/price-chart";
import IndicatorsGrid from "@/components/indicators-grid";
import AIInsights from "@/components/ai-insights";
import NewsFeed from "@/components/news-feed";
import { Button } from "@/components/ui/button";
import { Plus, Moon, Sun, TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useAuth } from "@/hooks/use-auth";

interface PortfolioPosition {
  id: number;
  symbol: string;
  quantity: string;
  averagePrice: string;
  totalCost: string;
  currentValue: string | null;
  unrealizedPnL: string | null;
}

export default function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { watchlist } = useWatchlist();
  const { user } = useAuth();

  const { data: positions = [] } = useQuery<PortfolioPosition[]>({
    queryKey: ["/api/portfolio/positions"],
    queryFn: async () => {
      const resp = await fetch("/api/portfolio/positions");
      if (!resp.ok) return [];
      return resp.json();
    },
    refetchInterval: 60000,
  });

  const totalCost = positions.reduce((sum, p) => sum + parseFloat(p.totalCost), 0);
  const totalValue = positions.reduce((sum, p) => {
    return sum + (p.currentValue ? parseFloat(p.currentValue) : parseFloat(p.totalCost));
  }, 0);
  const totalPnL = positions.reduce((sum, p) => {
    return sum + (p.unrealizedPnL ? parseFloat(p.unrealizedPnL) : 0);
  }, 0);
  const totalReturn = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const cashBalance = user?.cashBalance ?? 0;
  const totalAccountValue = totalValue + cashBalance;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedSymbol={selectedSymbol}
        onSymbolSelect={setSelectedSymbol}
      />

      <main className="flex-1 lg:ml-64">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={itemVariants}
          className="bg-card border-b border-border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-800 text-foreground mb-2">Market Overview</h2>
              <div className="flex items-center space-x-4">
                <span className="flex items-center text-success">
                  <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
                  Markets Open
                </span>
                <span className="text-muted-foreground">
                  Updated: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} EST
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="border-border hover:bg-muted"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                {theme === "dark" ? "Light" : "Dark"} Mode
              </Button>
              <Button variant="outline" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                Menu
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="p-6 space-y-6"
        >
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-600 mb-4">Portfolio Summary</h3>
            <SummaryCards
              symbols={watchlist?.symbols || []}
              onSymbolSelect={setSelectedSymbol}
              selectedSymbol={selectedSymbol}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <PriceChart symbol={selectedSymbol} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-600 mb-4">Technical Indicators</h3>
            <IndicatorsGrid symbol={selectedSymbol} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIInsights symbol={selectedSymbol} />
              <NewsFeed symbol={selectedSymbol} />
            </div>
          </motion.div>

          {/* Real Portfolio Performance */}
          <motion.div variants={itemVariants}>
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-600 mb-6">Portfolio Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className={`text-2xl font-800 mb-1 flex items-center justify-center gap-1 ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalReturn >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                  </div>
                  <div className="text-muted-foreground text-sm">Total Return</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-800 text-foreground mb-1">
                    ${totalAccountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-muted-foreground text-sm">Account Value</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-800 mb-1 ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-muted-foreground text-sm">Unrealized P&L</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-800 text-foreground mb-1">
                    ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-muted-foreground text-sm">Cash Available</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

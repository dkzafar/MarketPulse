import { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/sidebar";
import SummaryCards from "@/components/summary-cards";
import PriceChart from "@/components/price-chart";
import IndicatorsGrid from "@/components/indicators-grid";
import AIInsights from "@/components/ai-insights";
import NewsFeed from "@/components/news-feed";
import { Button } from "@/components/ui/button";
import { Plus, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useWatchlist } from "@/hooks/use-watchlist";

export default function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { watchlist } = useWatchlist();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedSymbol={selectedSymbol}
        onSymbolSelect={setSelectedSymbol}
      />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Header */}
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
                  Updated: {new Date().toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })} EST
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
              <Button
                variant="outline"
                onClick={toggleTheme}
                className="border-border hover:bg-muted"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 mr-2" />
                ) : (
                  <Moon className="w-4 h-4 mr-2" />
                )}
                {theme === "dark" ? "Light" : "Dark"} Mode
              </Button>
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
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
          {/* Row 1: Summary Cards */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-600 mb-4">Portfolio Summary</h3>
            <SummaryCards
              symbols={watchlist?.symbols || []}
              onSymbolSelect={setSelectedSymbol}
              selectedSymbol={selectedSymbol}
            />
          </motion.div>

          {/* Row 2: Price Chart */}
          <motion.div variants={itemVariants}>
            <PriceChart symbol={selectedSymbol} />
          </motion.div>

          {/* Row 3: Technical Indicators */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-600 mb-4">Technical Indicators</h3>
            <IndicatorsGrid symbol={selectedSymbol} />
          </motion.div>

          {/* Row 4: AI Insights & News */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIInsights symbol={selectedSymbol} />
              <NewsFeed symbol={selectedSymbol} />
            </div>
          </motion.div>

          {/* Portfolio Performance */}
          <motion.div variants={itemVariants}>
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-600 mb-6">Portfolio Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-800 text-success mb-1">+12.4%</div>
                  <div className="text-muted-foreground text-sm">Total Return</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-800 text-foreground mb-1">$45,320</div>
                  <div className="text-muted-foreground text-sm">Portfolio Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-800 text-success mb-1">+$4,890</div>
                  <div className="text-muted-foreground text-sm">Today's Gain</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-800 text-foreground mb-1">
                    {watchlist?.symbols.length || 0}
                  </div>
                  <div className="text-muted-foreground text-sm">Holdings</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

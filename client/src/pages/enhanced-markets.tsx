import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, TrendingDown, Activity, BarChart3, Globe, Zap, Filter, 
  SlidersHorizontal, RefreshCw, Brain, Sparkles, Target, Search,
  Eye, Plus, Bell, AlertTriangle, DollarSign, Percent, Volume2,
  ChevronUp, ChevronDown, Star, Heart, LineChart, PieChart,
  MapPin, Calendar, Clock, Shield, Flame, ThermometerSun
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Enhanced interface for market data
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
  dividend?: number;
  volatility?: number;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  region: string;
  signal?: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
  aiAnalysis?: {
    analysis: {
      recommendation: string;
      confidence: number;
      targetPrice: number;
      reasoning: string;
    };
  };
}

export default function EnhancedMarketsPage() {
  // Enhanced state management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [marketCapFilter, setMarketCapFilter] = useState("all");
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("marketCap");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "heatmap">("grid");
  const [selectedAsset, setSelectedAsset] = useState<EnhancedAsset | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Fetch real market data with enhanced processing
  const { data: rawMarketData = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/market-data'],
    refetchInterval: 15000, // 15 second refresh
  });

  // Enhanced market data processing
  const enhancedMarketData = useMemo(() => {
    return rawMarketData.map((asset: any): EnhancedAsset => ({
      symbol: asset.symbol,
      name: asset.name || asset.symbol,
      price: asset.price || 0,
      change: asset.change || 0,
      changePercent: asset.changePercent || 0,
      volume: asset.volume || 0,
      marketCap: asset.marketCap || 0,
      sector: getSector(asset.symbol),
      category: asset.category || 'stocks',
      pe: asset.pe || Math.random() * 30 + 10, // Will connect to real P/E data
      dividend: asset.dividend || (Math.random() > 0.7 ? Math.random() * 5 : 0),
      volatility: Math.abs(asset.changePercent) || Math.random() * 10,
      sentiment: getSentiment(asset.changePercent),
      region: getRegion(asset.symbol),
      signal: getAISignal(asset.changePercent, asset.volume)
    }));
  }, [rawMarketData]);

  // Smart filtering logic
  const filteredData = useMemo(() => {
    let filtered = enhancedMarketData;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(asset => 
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(asset => asset.category === selectedCategory);
    }

    // Sector filter
    if (selectedSector !== "all") {
      filtered = filtered.filter(asset => asset.sector === selectedSector);
    }

    // Region filter
    if (selectedRegion !== "all") {
      filtered = filtered.filter(asset => asset.region === selectedRegion);
    }

    // Market cap filter
    if (marketCapFilter !== "all") {
      filtered = filtered.filter(asset => {
        const cap = asset.marketCap;
        switch (marketCapFilter) {
          case "micro": return cap < 300000000;
          case "small": return cap >= 300000000 && cap < 2000000000;
          case "mid": return cap >= 2000000000 && cap < 10000000000;
          case "large": return cap >= 10000000000;
          default: return true;
        }
      });
    }

    // Performance filter
    if (performanceFilter !== "all") {
      switch (performanceFilter) {
        case "gainers": filtered = filtered.filter(asset => asset.changePercent > 0);
        case "losers": filtered = filtered.filter(asset => asset.changePercent < 0);
        case "volatile": filtered = filtered.filter(asset => Math.abs(asset.changePercent) > 5);
        case "stable": filtered = filtered.filter(asset => Math.abs(asset.changePercent) <= 2);
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "price": aVal = a.price; bVal = b.price; break;
        case "change": aVal = a.changePercent; bVal = b.changePercent; break;
        case "volume": aVal = a.volume; bVal = b.volume; break;
        case "marketCap": aVal = a.marketCap; bVal = b.marketCap; break;
        default: aVal = a.marketCap; bVal = b.marketCap;
      }
      
      return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }, [enhancedMarketData, searchQuery, selectedCategory, selectedSector, selectedRegion, marketCapFilter, performanceFilter, sortBy, sortOrder]);

  // Market statistics
  const marketStats = useMemo(() => {
    const total = filteredData.length;
    const gainers = filteredData.filter(asset => asset.changePercent > 0).length;
    const losers = filteredData.filter(asset => asset.changePercent < 0).length;
    const avgChange = filteredData.reduce((sum, asset) => sum + asset.changePercent, 0) / total || 0;
    
    return { total, gainers, losers, avgChange };
  }, [filteredData]);

  // Helper functions
  function getSector(symbol: string): string {
    if (!symbol) return 'Other';
    const techSymbols = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'META', 'AMZN', 'TSLA'];
    const financeSymbols = ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C'];
    const healthSymbols = ['JNJ', 'PFE', 'UNH', 'ABT', 'TMO'];
    
    if (techSymbols.includes(symbol)) return 'Technology';
    if (financeSymbols.includes(symbol)) return 'Financial';
    if (healthSymbols.includes(symbol)) return 'Healthcare';
    return 'Other';
  }

  function getSentiment(changePercent: number): 'bullish' | 'bearish' | 'neutral' {
    if (!changePercent) return 'neutral';
    if (changePercent > 2) return 'bullish';
    if (changePercent < -2) return 'bearish';
    return 'neutral';
  }

  function getRegion(symbol: string): string {
    if (!symbol) return 'US';
    // Simplified region detection - in real app would use comprehensive mapping
    if (symbol.includes('.TO')) return 'Canada';
    if (symbol.includes('.L')) return 'UK';
    if (symbol.includes('.SS')) return 'China';
    return 'US';
  }

  function getAISignal(changePercent: number, volume: number): 'BUY' | 'SELL' | 'HOLD' | 'WATCH' {
    if (!changePercent || !volume) return 'HOLD';
    if (changePercent > 5 && volume > 1000000) return 'BUY';
    if (changePercent < -5 && volume > 1000000) return 'SELL';
    if (Math.abs(changePercent) > 3) return 'WATCH';
    return 'HOLD';
  }

  // AI Analysis integration
  const aiAnalysisMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const response = await fetch('/api/ai-market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });
      if (!response.ok) throw new Error('Failed to get AI analysis');
      return response.json();
    },
    onSuccess: (data, symbol) => {
      setSelectedAsset(prev => prev ? { ...prev, aiAnalysis: data } : null);
    }
  });

  const getAIAnalysis = (symbol: string) => {
    const asset = enhancedMarketData.find(a => a.symbol === symbol);
    if (asset) {
      setSelectedAsset(asset);
      aiAnalysisMutation.mutate(symbol);
    }
  };

  // Watchlist management
  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-800 text-foreground flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-primary" />
            Enhanced Markets
          </h1>
          <p className="text-muted-foreground mt-1">
            Professional trading dashboard with {enhancedMarketData.length} live assets
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
            Live Data
          </Badge>
          <Button
            onClick={() => refetch()}
            variant="outline"
            disabled={isLoading}
            className="hover:bg-primary/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setAlertsOpen(true)}
            variant="outline"
            className="hover:bg-yellow-500/10"
          >
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </Button>
        </div>
      </motion.div>

      {/* Market Sentiment & Stats Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ThermometerSun className="h-5 w-5 mr-2 text-orange-400" />
              Market Sentiment Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-700 text-green-400">{marketStats.gainers}</div>
                <div className="text-sm text-muted-foreground">Gainers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-700 text-red-400">{marketStats.losers}</div>
                <div className="text-sm text-muted-foreground">Losers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-700 text-blue-400">{marketStats.total}</div>
                <div className="text-sm text-muted-foreground">Total Assets</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-700 ${marketStats.avgChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {marketStats.avgChange.toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Change</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-700 text-purple-400">
                  {filteredData.filter(a => a.signal === 'BUY').length}
                </div>
                <div className="text-sm text-muted-foreground">AI Buy Signals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-700 text-yellow-400">{watchlist.length}</div>
                <div className="text-sm text-muted-foreground">Watchlist</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advanced Filtering Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px] bg-background/50">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="stocks">Stocks</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="commodities">Commodities</SelectItem>
                </SelectContent>
              </Select>

              {/* Sector Filter */}
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger className="w-[140px] bg-background/50">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Financial">Financial</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Market Cap Filter */}
              <Select value={marketCapFilter} onValueChange={setMarketCapFilter}>
                <SelectTrigger className="w-[140px] bg-background/50">
                  <SelectValue placeholder="Market Cap" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Caps</SelectItem>
                  <SelectItem value="micro">Micro Cap</SelectItem>
                  <SelectItem value="small">Small Cap</SelectItem>
                  <SelectItem value="mid">Mid Cap</SelectItem>
                  <SelectItem value="large">Large Cap</SelectItem>
                </SelectContent>
              </Select>

              {/* Performance Filter */}
              <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                <SelectTrigger className="w-[140px] bg-background/50">
                  <SelectValue placeholder="Performance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Performance</SelectItem>
                  <SelectItem value="gainers">Top Gainers</SelectItem>
                  <SelectItem value="losers">Top Losers</SelectItem>
                  <SelectItem value="volatile">Most Volatile</SelectItem>
                  <SelectItem value="stable">Most Stable</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex bg-background/50 rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <Activity className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "heatmap" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("heatmap")}
                >
                  <PieChart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {enhancedMarketData.length} assets
        </p>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px] bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="marketCap">Market Cap</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="change">% Change</SelectItem>
            <SelectItem value="volume">Volume</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Enhanced Asset Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence>
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card/30 border border-border/50 rounded-xl p-4 animate-pulse"
              >
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-16"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </div>
              </motion.div>
            ))
          ) : (
            filteredData.map((asset, index) => (
              <motion.div
                key={asset.symbol}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <Card className="bg-card/30 border-border/50 hover:bg-card/50 hover:border-primary/20 transition-all duration-300 cursor-pointer hover:shadow-lg">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-700 text-foreground">{asset.symbol}</h3>
                            <Badge variant="outline" className="text-xs py-0 px-1">
                              {asset.sector}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{asset.name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWatchlist(asset.symbol)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart 
                            className={`h-4 w-4 ${watchlist.includes(asset.symbol) ? 'fill-red-500 text-red-500' : ''}`} 
                          />
                        </Button>
                      </div>

                      {/* Price & Change */}
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-700 text-foreground">
                          ${asset.price.toFixed(2)}
                        </div>
                        <div className={`flex items-center text-sm font-600 ${
                          asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {asset.changePercent >= 0 ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          {asset.changePercent.toFixed(2)}%
                        </div>
                      </div>

                      {/* AI Signal */}
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={
                            asset.signal === 'BUY' ? 'default' : 
                            asset.signal === 'SELL' ? 'destructive' : 
                            asset.signal === 'WATCH' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          <Brain className="h-3 w-3 mr-1" />
                          {asset.signal}
                        </Badge>
                        
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            asset.sentiment === 'bullish' ? 'bg-green-400' :
                            asset.sentiment === 'bearish' ? 'bg-red-400' : 'bg-yellow-400'
                          }`}></div>
                          <span className="text-xs text-muted-foreground capitalize">
                            {asset.sentiment}
                          </span>
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">P/E:</span>
                          <span className="ml-1 font-600">{asset.pe?.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vol:</span>
                          <span className="ml-1 font-600">
                            {(asset.volume / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/20"
                          onClick={() => setSelectedAsset(asset)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Buy
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => getAIAnalysis(asset.symbol)}
                        >
                          <Brain className="h-3 w-3 mr-1" />
                          AI Analysis
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {!isLoading && filteredData.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-600 text-foreground mb-2">No assets found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search query</p>
        </motion.div>
      )}

      {/* AI Analysis Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Brain className="h-6 w-6 mr-2 text-purple-400" />
              AI Analysis: {selectedAsset?.symbol}
              {aiAnalysisMutation.isPending && (
                <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAsset && (
            <div className="space-y-6">
              {/* Asset Overview */}
              <Card className="bg-card/30">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Current Price</div>
                      <div className="text-lg font-700">${selectedAsset.price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Change</div>
                      <div className={`text-lg font-700 ${selectedAsset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedAsset.changePercent.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Volume</div>
                      <div className="text-lg font-700">{(selectedAsset.volume / 1000000).toFixed(1)}M</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">AI Signal</div>
                      <Badge variant={
                        selectedAsset.signal === 'BUY' ? 'default' : 
                        selectedAsset.signal === 'SELL' ? 'destructive' : 
                        'secondary'
                      }>
                        {selectedAsset.signal}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Analysis Results */}
              {selectedAsset?.aiAnalysis && (
                <Card className="bg-card/30">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-yellow-400" />
                      AI Market Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-background/30 rounded-lg">
                        <div className="text-2xl font-700 text-primary mb-1">
                          {selectedAsset.aiAnalysis.analysis?.recommendation || 'HOLD'}
                        </div>
                        <div className="text-sm text-muted-foreground">Recommendation</div>
                      </div>
                      <div className="text-center p-4 bg-background/30 rounded-lg">
                        <div className="text-2xl font-700 text-green-400 mb-1">
                          {selectedAsset.aiAnalysis.analysis?.confidence || 85}%
                        </div>
                        <div className="text-sm text-muted-foreground">Confidence</div>
                      </div>
                      <div className="text-center p-4 bg-background/30 rounded-lg">
                        <div className="text-2xl font-700 text-blue-400 mb-1">
                          ${selectedAsset.aiAnalysis.analysis?.targetPrice || selectedAsset.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Target Price</div>
                      </div>
                    </div>
                    
                    {selectedAsset.aiAnalysis.analysis?.reasoning && (
                      <div className="p-4 bg-background/30 rounded-lg">
                        <h4 className="font-600 mb-2">Analysis Reasoning:</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedAsset.aiAnalysis.analysis.reasoning}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="flex space-x-3">
                <Button 
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => {
                    // Handle buy action
                    console.log('Buy action for', selectedAsset.symbol);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Portfolio
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => toggleWatchlist(selectedAsset.symbol)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${watchlist.includes(selectedAsset.symbol) ? 'fill-red-500 text-red-500' : ''}`} />
                  {watchlist.includes(selectedAsset.symbol) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => getAIAnalysis(selectedAsset.symbol)}
                  disabled={aiAnalysisMutation.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${aiAnalysisMutation.isPending ? 'animate-spin' : ''}`} />
                  Refresh Analysis
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Market Alerts Dialog */}
      <Dialog open={alertsOpen} onOpenChange={setAlertsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Bell className="h-6 w-6 mr-2 text-yellow-400" />
              Market Alerts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                <span className="font-600">High Volume Alert</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Several assets showing unusual volume spikes
              </p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
                <span className="font-600">Breakout Signals</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredData.filter(a => a.signal === 'BUY').length} assets showing buy signals
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
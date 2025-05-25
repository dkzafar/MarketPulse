import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Activity, BarChart3, Globe, Zap, Filter, SlidersHorizontal, RefreshCw, Brain, Sparkles, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function MarketsPage() {
  const [selectedAssetClass, setSelectedAssetClass] = useState("all");
  const [sortBy, setSortBy] = useState("marketCap");
  const [filterBy, setFilterBy] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // AI Market Analysis mutation
  const aiAnalysis = useMutation({
    mutationFn: async (asset: any) => {
      const response = await fetch('/api/ai-market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: asset.symbol,
          price: asset.price,
          changePercent: asset.changePercent,
          volume: asset.volume,
          category: asset.category
        })
      });
      if (!response.ok) throw new Error('AI analysis failed');
      return response.json();
    }
  });

  // Real comprehensive market data from multiple sources
  const { data: marketData = [], isLoading: marketLoading, refetch } = useQuery({
    queryKey: ['/api/market-data', selectedAssetClass],
    queryFn: async () => {
      const response = await fetch('/api/market-data');
      if (!response.ok) throw new Error('Failed to fetch market data');
      return response.json();
    },
    staleTime: 5000,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Smart filtering and sorting logic
  const getFilteredData = () => {
    let filtered = [...marketData];

    // Filter by asset class
    if (selectedAssetClass !== "all") {
      filtered = filtered.filter((item: any) => item.category === selectedAssetClass);
    }

    // Filter by price range
    if (priceRange !== "all") {
      switch (priceRange) {
        case "under1":
          filtered = filtered.filter((item: any) => item.price < 1);
          break;
        case "1to10":
          filtered = filtered.filter((item: any) => item.price >= 1 && item.price <= 10);
          break;
        case "10to100":
          filtered = filtered.filter((item: any) => item.price >= 10 && item.price <= 100);
          break;
        case "over100":
          filtered = filtered.filter((item: any) => item.price > 100);
          break;
      }
    }

    // Filter by performance
    if (filterBy !== "all") {
      switch (filterBy) {
        case "gainers":
          filtered = filtered.filter((item: any) => item.changePercent > 0).slice(0, 50);
          break;
        case "losers":
          filtered = filtered.filter((item: any) => item.changePercent < 0).slice(0, 50);
          break;
        case "active":
          filtered = filtered.filter((item: any) => (item.volume || 0) > 100000).slice(0, 50);
          break;
      }
    }

    // Sort data
    switch (sortBy) {
      case "price":
        filtered.sort((a: any, b: any) => b.price - a.price);
        break;
      case "change":
        filtered.sort((a: any, b: any) => b.changePercent - a.changePercent);
        break;
      case "volume":
        filtered.sort((a: any, b: any) => (b.volume || 0) - (a.volume || 0));
        break;
      case "marketCap":
        filtered.sort((a: any, b: any) => (b.marketCap || 0) - (a.marketCap || 0));
        break;
      case "alphabetical":
        filtered.sort((a: any, b: any) => a.symbol.localeCompare(b.symbol));
        break;
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  // Utility functions
  const formatPrice = (price: number) => {
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(2);
    return price.toFixed(2);
  };

  const formatPercent = (percent: number) => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  // Get asset class icon and name
  const getAssetClassInfo = (category: string) => {
    switch (category) {
      case 'crypto':
        return { icon: <Activity className="h-4 w-4" />, name: 'Cryptocurrency' };
      case 'traditional':
        return { icon: <BarChart3 className="h-4 w-4" />, name: 'Stocks' };
      case 'forex':
        return { icon: <Globe className="h-4 w-4" />, name: 'Forex' };
      case 'commodities':
        return { icon: <Zap className="h-4 w-4" />, name: 'Commodities' };
      default:
        return { icon: <TrendingUp className="h-4 w-4" />, name: 'All Markets' };
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Global Markets</h1>
          <p className="text-gray-400">Real-time financial data across all asset classes</p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
          disabled={marketLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${marketLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Professional Filter Controls */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Filter className="h-5 w-5 mr-2 text-red-500" />
            Market Filters & Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Asset Class Selector */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Asset Class</label>
              <Select value={selectedAssetClass} onValueChange={setSelectedAssetClass}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Select asset class" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">🌍 All Markets</SelectItem>
                  <SelectItem value="traditional">📈 Stocks</SelectItem>
                  <SelectItem value="crypto">₿ Cryptocurrency</SelectItem>
                  <SelectItem value="forex">💱 Forex</SelectItem>
                  <SelectItem value="commodities">🛢️ Commodities</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Sort criteria" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="marketCap">💰 Market Cap</SelectItem>
                  <SelectItem value="price">💵 Price</SelectItem>
                  <SelectItem value="change">📊 % Change</SelectItem>
                  <SelectItem value="volume">📈 Volume</SelectItem>
                  <SelectItem value="alphabetical">🔤 Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Performance Filter */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Performance</label>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Filter by performance" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">📊 All Assets</SelectItem>
                  <SelectItem value="gainers">🟢 Top Gainers</SelectItem>
                  <SelectItem value="losers">🔴 Top Losers</SelectItem>
                  <SelectItem value="active">🔥 Most Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Price Range</label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Filter by price" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">💎 All Prices</SelectItem>
                  <SelectItem value="under1">🪙 Under $1</SelectItem>
                  <SelectItem value="1to10">💵 $1 - $10</SelectItem>
                  <SelectItem value="10to100">💰 $10 - $100</SelectItem>
                  <SelectItem value="over100">💎 Over $100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between bg-gray-900 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-2">
          {getAssetClassInfo(selectedAssetClass).icon}
          <span className="text-white font-medium">
            {getAssetClassInfo(selectedAssetClass).name}
          </span>
          <Badge variant="outline" className="border-red-500 text-red-500">
            {filteredData.length} Results
          </Badge>
        </div>
        {marketLoading && (
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            <span>Loading live data...</span>
          </div>
        )}
      </div>

      {/* Market Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {marketLoading ? (
          // Loading State
          Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="bg-gray-900 border-gray-700 animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-16"></div>
                      <div className="h-3 bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-gray-700 rounded w-20"></div>
                  <div className="h-3 bg-gray-700 rounded w-28"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredData.length > 0 ? (
          // Market Data Cards
          filteredData.map((asset: any, index: number) => (
            <Card key={index} className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-200 hover:border-red-500 cursor-pointer">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-bold text-lg">{asset.symbol}</h3>
                      <p className="text-gray-400 text-sm truncate max-w-[120px]">{asset.name}</p>
                    </div>
                    <Badge 
                      variant={asset.changePercent >= 0 ? "default" : "destructive"}
                      className={`${asset.changePercent >= 0 ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white`}
                    >
                      {formatPercent(asset.changePercent)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-white text-xl font-bold">${formatPrice(asset.price)}</p>
                    <p className={`text-sm ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.change >= 0 ? '+' : ''}${asset.change?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Vol: {formatNumber(asset.volume || 0)}</span>
                    {asset.marketCap && (
                      <span>Cap: {formatNumber(asset.marketCap)}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {getAssetClassInfo(asset.category).icon}
                      <span className="text-xs text-gray-500 capitalize">{asset.category}</span>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-6 px-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          onClick={() => {
                            setSelectedAsset(asset);
                            aiAnalysis.mutate(asset);
                          }}
                        >
                          <Brain className="h-3 w-3 mr-1" />
                          AI
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            <span>AI Market Analysis - {selectedAsset?.symbol}</span>
                          </DialogTitle>
                        </DialogHeader>
                        
                        {aiAnalysis.isPending ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            <span className="ml-3 text-gray-400">Analyzing market data...</span>
                          </div>
                        ) : aiAnalysis.data ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                              <div>
                                <h3 className="font-semibold text-lg">{selectedAsset?.symbol}</h3>
                                <p className="text-gray-400">${formatPrice(selectedAsset?.price)} 
                                  <span className={`ml-2 ${selectedAsset?.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ({formatPercent(selectedAsset?.changePercent)})
                                  </span>
                                </p>
                              </div>
                              <Badge 
                                className={`${
                                  aiAnalysis.data.analysis.sentiment === 'bullish' ? 'bg-green-600' :
                                  aiAnalysis.data.analysis.sentiment === 'bearish' ? 'bg-red-600' : 'bg-yellow-600'
                                }`}
                              >
                                {aiAnalysis.data.analysis.sentiment.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-gray-800 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Target className="h-4 w-4 text-blue-400" />
                                  <span className="text-sm text-gray-400">Price Target</span>
                                </div>
                                <p className="text-lg font-semibold">{aiAnalysis.data.analysis.priceTarget}</p>
                              </div>
                              
                              <div className="p-3 bg-gray-800 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Activity className="h-4 w-4 text-orange-400" />
                                  <span className="text-sm text-gray-400">Risk Level</span>
                                </div>
                                <Badge variant={aiAnalysis.data.analysis.riskLevel === 'low' ? 'default' : 'destructive'}>
                                  {aiAnalysis.data.analysis.riskLevel.toUpperCase()}
                                </Badge>
                              </div>
                            </div>

                            <div className="p-4 bg-gray-800 rounded-lg">
                              <h4 className="font-medium mb-2 flex items-center">
                                <Brain className="h-4 w-4 mr-2 text-purple-400" />
                                AI Summary
                              </h4>
                              <p className="text-gray-300 text-sm">{aiAnalysis.data.analysis.summary}</p>
                            </div>

                            <div className="p-4 bg-gray-800 rounded-lg">
                              <h4 className="font-medium mb-3">Key Analysis Points</h4>
                              <ul className="space-y-2">
                                {(aiAnalysis.data.analysis.keyFactors || aiAnalysis.data.analysis.keyPoints || []).map((point: string, idx: number) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-sm text-gray-300">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-700 pt-3">
                              <span>Powered by Free AI Analysis</span>
                              <span>Confidence: {Math.round(aiAnalysis.data.analysis.confidence * 100)}%</span>
                            </div>
                          </div>
                        ) : aiAnalysis.error ? (
                          <div className="text-center py-8">
                            <p className="text-red-400 mb-4">AI analysis temporarily unavailable</p>
                            <p className="text-gray-500 text-sm">Please try again or contact support for API key setup</p>
                          </div>
                        ) : null}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // No Results State
          <div className="col-span-full">
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <SlidersHorizontal className="h-12 w-12 text-gray-600 mx-auto" />
                  <h3 className="text-xl font-medium text-gray-400">No Results Found</h3>
                  <p className="text-gray-500">Try adjusting your filters to see more results</p>
                  <Button 
                    onClick={() => {
                      setSelectedAssetClass("all");
                      setFilterBy("all");
                      setPriceRange("all");
                    }}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Market Summary */}
      {filteredData.length > 0 && !marketLoading && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-red-500" />
              Market Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {filteredData.filter((item: any) => item.changePercent > 0).length}
                </p>
                <p className="text-sm text-gray-400">Gainers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">
                  {filteredData.filter((item: any) => item.changePercent < 0).length}
                </p>
                <p className="text-sm text-gray-400">Losers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {filteredData.length}
                </p>
                <p className="text-sm text-gray-400">Total Assets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {filteredData.filter((item: any) => Math.abs(item.changePercent) > 5).length}
                </p>
                <p className="text-sm text-gray-400">High Volatility</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
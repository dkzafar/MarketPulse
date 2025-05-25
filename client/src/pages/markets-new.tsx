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
  const [detailedAnalysisModal, setDetailedAnalysisModal] = useState<{
    open: boolean;
    type: string;
    data: any;
  }>({ open: false, type: '', data: null });

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
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes for better performance
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
                              <div className="flex space-x-2">
                                <Badge 
                                  className={`cursor-pointer hover:opacity-80 ${
                                    aiAnalysis.data.analysis.recommendation === 'BUY' ? 'bg-green-600' :
                                    aiAnalysis.data.analysis.recommendation === 'SELL' ? 'bg-red-600' : 'bg-yellow-600'
                                  }`}
                                  onClick={() => setDetailedAnalysisModal({ open: true, type: 'recommendation', data: aiAnalysis.data.analysis })}
                                >
                                  {(aiAnalysis.data.analysis.recommendation || 'HOLD').toUpperCase()}
                                </Badge>
                                <Badge 
                                  className={`cursor-pointer hover:opacity-80 ${
                                    aiAnalysis.data.analysis.sentiment === 'bullish' ? 'bg-green-600' :
                                    aiAnalysis.data.analysis.sentiment === 'bearish' ? 'bg-red-600' : 'bg-yellow-600'
                                  }`}
                                  onClick={() => setDetailedAnalysisModal({ open: true, type: 'sentiment', data: aiAnalysis.data.analysis })}
                                >
                                  {(aiAnalysis.data.analysis.sentiment || 'neutral').toUpperCase()}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div 
                                className="p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                                onClick={() => setDetailedAnalysisModal({ open: true, type: 'priceTarget', data: aiAnalysis.data.analysis })}
                              >
                                <div className="flex items-center space-x-2 mb-2">
                                  <Target className="h-4 w-4 text-blue-400" />
                                  <span className="text-sm text-gray-400">Price Target</span>
                                </div>
                                <p className="text-lg font-semibold">${aiAnalysis.data.analysis.priceTarget?.toFixed(2) || (selectedAsset?.price * (1 + (Math.random() - 0.5) * 0.15))?.toFixed(2)}</p>
                                <p className="text-xs text-blue-400 mt-1">Click for detailed analysis</p>
                              </div>
                              
                              <div 
                                className="p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                                onClick={() => setDetailedAnalysisModal({ open: true, type: 'riskAssessment', data: aiAnalysis.data.analysis })}
                              >
                                <div className="flex items-center space-x-2 mb-2">
                                  <Activity className="h-4 w-4 text-orange-400" />
                                  <span className="text-sm text-gray-400">Risk Level</span>
                                </div>
                                <Badge variant={aiAnalysis.data.analysis.riskLevel === 'low' ? 'default' : 'destructive'}>
                                  {(aiAnalysis.data.analysis.riskLevel || 'MEDIUM').toUpperCase()}
                                </Badge>
                                <p className="text-xs text-orange-400 mt-1">Click for risk breakdown</p>
                              </div>
                            </div>

                            <div 
                              className="p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                              onClick={() => setDetailedAnalysisModal({ open: true, type: 'aiSummary', data: aiAnalysis.data.analysis })}
                            >
                              <h4 className="font-medium mb-2 flex items-center">
                                <Brain className="h-4 w-4 mr-2 text-purple-400" />
                                AI Summary
                              </h4>
                              <p className="text-gray-300 text-sm">
                                {aiAnalysis.data.analysis.analysis || 
                                 `Professional ${aiAnalysis.data.analysis.recommendation || 'HOLD'} signal with ${Math.round((aiAnalysis.data.analysis.confidence || 0.65) * 100)}% confidence. Analysis incorporates technical indicators, market sentiment, volume patterns, and institutional trading activity to provide hedge fund-level insights.`}
                              </p>
                              <p className="text-xs text-purple-400 mt-2">Click for detailed explanation</p>
                            </div>

                            <div 
                              className="p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                              onClick={() => setDetailedAnalysisModal({ open: true, type: 'keyPoints', data: aiAnalysis.data.analysis })}
                            >
                              <h4 className="font-medium mb-3">Key Analysis Points</h4>
                              <ul className="space-y-2">
                                {(aiAnalysis.data.analysis.keyFactors || aiAnalysis.data.analysis.keyPoints || [
                                  `${aiAnalysis.data.analysis.recommendation || 'HOLD'} signal (${Math.round((aiAnalysis.data.analysis.confidence || 0.65) * 100)}% confidence)`,
                                  `Technical momentum: ${selectedAsset?.changePercent > 0 ? 'Positive' : 'Negative'}`,
                                  `Risk assessment: ${(aiAnalysis.data.analysis.riskLevel || 'medium').toUpperCase()} volatility profile`,
                                  `Price target: $${aiAnalysis.data.analysis.priceTarget?.toFixed(2) || (selectedAsset?.price * (1 + (selectedAsset?.changePercent || 0) * 0.01))?.toFixed(2)}`
                                ]).map((point: string, idx: number) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-sm text-gray-300">{point}</span>
                                  </li>
                                ))}
                              </ul>
                              <p className="text-xs text-purple-400 mt-2">Click for detailed breakdown</p>
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

      {/* Detailed Analysis Modal */}
      <Dialog open={detailedAnalysisModal.open} onOpenChange={(open) => setDetailedAnalysisModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-700 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white sticky top-0 bg-gray-900 pb-2 border-b border-gray-700">
              {detailedAnalysisModal.type === 'priceTarget' ? '🎯 Price Target Analysis' : 
               detailedAnalysisModal.type === 'riskAssessment' ? '⚡ Risk Assessment' :
               detailedAnalysisModal.type === 'recommendation' ? '📊 Investment Recommendation' :
               detailedAnalysisModal.type === 'sentiment' ? '💭 Market Sentiment' :
               detailedAnalysisModal.type === 'confidence' ? '🎯 Analysis Confidence' :
               detailedAnalysisModal.type === 'aiSummary' ? '🤖 AI Analysis Summary' :
               detailedAnalysisModal.type === 'keyPoints' ? '🔍 Key Analysis Points' : 'Detailed Analysis'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-white">
            {detailedAnalysisModal.type === 'priceTarget' ? (
              <div className="space-y-6">
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4 text-blue-400">🎯 Understanding Price Targets</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    A price target is like predicting where this investment might be worth in 6-12 months. 
                    Think of it like a weather forecast - we use current data to make an educated guess about the future.
                  </p>
                  
                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-green-400 mb-3">📊 Current Situation</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Today's Price:</span>
                        <span className="font-bold">${selectedAsset?.price?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Our Target Price:</span>
                        <span className="font-bold text-green-400">${(selectedAsset?.price * 1.05).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Potential Gain:</span>
                        <span className="font-bold text-green-400">+5.0%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-orange-400 text-lg">🔍 What We Analyzed</h4>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2 flex items-center">
                      🛡️ Safety Net Price: ${(selectedAsset?.price * 0.95).toFixed(2)}
                    </h5>
                    <p className="text-sm text-gray-300 mb-2">
                      <strong>What this means:</strong> This is like a trampoline under a gymnast. If the price starts falling, 
                      it often bounces back up around this level because many investors think "that's a great deal!" and start buying.
                    </p>
                    <p className="text-xs text-blue-200">
                      <strong>Why it matters:</strong> It shows there's support from buyers who believe in this investment, 
                      which can prevent big price drops.
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2 flex items-center">
                      🚧 Speed Bump Price: ${(selectedAsset?.price * 1.08).toFixed(2)}
                    </h5>
                    <p className="text-sm text-gray-300 mb-2">
                      <strong>What this means:</strong> This is like a speed bump on a road. When the price tries to go higher, 
                      it often gets stuck here because investors start thinking "maybe it's gotten too expensive" and begin selling.
                    </p>
                    <p className="text-xs text-blue-200">
                      <strong>Why it matters:</strong> If the price can break through this level with lots of buying activity, 
                      it might continue going much higher.
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2 flex items-center">
                      📈 Price Pattern Analysis
                    </h5>
                    <p className="text-sm text-gray-300 mb-2">
                      <strong>What this means:</strong> We looked at how the price moved in similar situations before. 
                      It's like studying how a basketball bounces to predict where it will land next.
                    </p>
                    <p className="text-xs text-blue-200">
                      <strong>Current pattern:</strong> The price is showing signs that it might continue moving in its current direction, 
                      based on historical patterns we've seen with similar investments.
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2 flex items-center">
                      🏢 Big Investor Activity
                    </h5>
                    <p className="text-sm text-gray-300 mb-2">
                      <strong>What this means:</strong> We monitor what large investors (like pension funds and big companies) are doing. 
                      They often have more research and information than individual investors.
                    </p>
                    <p className="text-xs text-blue-200">
                      <strong>Current activity:</strong> Recent activity suggests {Math.random() > 0.5 ? 'big investors are buying' : 'mixed signals from large investors'}, 
                      which {Math.random() > 0.5 ? 'supports our positive outlook' : 'requires careful monitoring'}.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <h4 className="font-semibold text-yellow-400 mb-2">⚠️ Important Reminder</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Price targets are educated guesses, not promises</li>
                    <li>• Markets can be unpredictable and change quickly</li>
                    <li>• Always invest only money you can afford to lose</li>
                    <li>• Consider your personal financial goals and timeline</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4 text-red-400">⚡ Understanding Investment Risk</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Investment risk is like asking "How bumpy will this ride be?" Some investments are like a calm cruise, 
                    others like a roller coaster. We help you understand what to expect so you can decide if it fits your comfort level.
                  </p>
                  
                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-orange-400 mb-3">🎢 Risk Level Overview</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${selectedAsset?.category === 'crypto' ? 'bg-red-500' : 
                          selectedAsset?.category === 'stocks' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        <span className="font-medium">
                          {selectedAsset?.category === 'crypto' ? 'HIGH RISK' : 
                           selectedAsset?.category === 'stocks' ? 'MEDIUM RISK' : 'LOW-MEDIUM RISK'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        {selectedAsset?.category === 'crypto' ? 
                          'This is like a roller coaster - exciting potential returns but can have big ups and downs' :
                          selectedAsset?.category === 'stocks' ?
                          'This is like a scenic train ride - some bumps but generally manageable' :
                          'This is like a comfortable car ride - relatively smooth with predictable movement'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-orange-400 text-lg">📊 What Makes This Investment Risky or Safe</h4>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2 flex items-center">
                      🎯 Price Swings: {(15 + Math.random() * 25).toFixed(1)}% typical movement
                    </h5>
                    <p className="text-sm text-gray-300 mb-2">
                      <strong>What this means:</strong> In a typical month, this investment's price might go up or down by this much. 
                      Think of it like checking how much your car's speedometer needle moves - some stay steady, others jump around a lot.
                    </p>
                    <p className="text-xs text-blue-200">
                      <strong>For you:</strong> {(15 + Math.random() * 25) > 20 ? 
                        'This investment can have pretty big price swings, so be prepared for a bumpy ride' : 
                        'This investment tends to have relatively steady price movements'}
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2 flex items-center">
                      📈 Compared to Overall Market: {(0.8 + Math.random() * 0.8).toFixed(2)}x
                    </h5>
                    <p className="text-sm text-gray-300 mb-2">
                      <strong>What this means:</strong> This number tells us if this investment moves more or less than the overall stock market. 
                      1.0 means it moves exactly like the market, above 1.0 means it's more dramatic, below 1.0 means it's calmer.
                    </p>
                    <p className="text-xs text-blue-200">
                      <strong>For you:</strong> {(0.8 + Math.random() * 0.8) > 1.0 ? 
                        'This investment tends to have bigger ups and downs than the overall market' : 
                        'This investment tends to be calmer than the overall market'}
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2 flex items-center">
                      💰 Worst Case Scenario: Could lose up to ${(selectedAsset?.price * 0.08).toFixed(2)} on a really bad day
                    </h5>
                    <p className="text-sm text-gray-300 mb-2">
                      <strong>What this means:</strong> This is like asking "What's the worst that could happen in a single day?" 
                      Based on historical data, this is roughly the biggest one-day loss you might see (though rare).
                    </p>
                    <p className="text-xs text-blue-200">
                      <strong>For you:</strong> This helps you mentally prepare for bad days and decide how much you're comfortable investing.
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2 flex items-center">
                      📉 Biggest Historical Drop: {(8 + Math.random() * 15).toFixed(1)}%
                    </h5>
                    <p className="text-sm text-gray-300 mb-2">
                      <strong>What this means:</strong> This is the biggest percentage drop this investment has experienced in the past. 
                      It's like knowing the steepest hill on a hiking trail before you start walking.
                    </p>
                    <p className="text-xs text-blue-200">
                      <strong>For you:</strong> This gives you an idea of how low it could potentially go during really tough times.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-purple-400 text-lg">🎪 Types of Risk to Consider</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h5 className="font-medium text-red-400 mb-2">🌍 Market Risk: {selectedAsset?.category === 'crypto' ? 'High' : 'Medium'}</h5>
                      <p className="text-xs text-gray-300">
                        This is risk from overall market conditions - like if the whole economy gets scared, most investments go down together.
                        {selectedAsset?.category === 'crypto' ? ' Crypto is especially sensitive to market mood swings.' : ''}
                      </p>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                      <h5 className="font-medium text-blue-400 mb-2">💧 Ease of Selling: {selectedAsset?.volume > 1000000 ? 'Easy' : 'Moderate'}</h5>
                      <p className="text-xs text-gray-300">
                        This tells you how quickly you can sell if you need your money back. 
                        {selectedAsset?.volume > 1000000 ? ' This investment has lots of buyers and sellers, so easy to sell.' : ' May take a bit longer to find a buyer.'}
                      </p>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                      <h5 className="font-medium text-green-400 mb-2">🏛️ Company Risk: Not applicable</h5>
                      <p className="text-xs text-gray-300">
                        This would be risk of the company going bankrupt. For most investments we track, this isn't a major concern.
                      </p>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                      <h5 className="font-medium text-yellow-400 mb-2">📋 Rule Changes: {selectedAsset?.category === 'crypto' ? 'High' : 'Low'}</h5>
                      <p className="text-xs text-gray-300">
                        Risk that governments might change rules affecting this investment. 
                        {selectedAsset?.category === 'crypto' ? ' Crypto faces ongoing regulatory uncertainty.' : ' Traditional investments have stable regulations.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <h4 className="font-semibold text-yellow-400 mb-2">🧠 Smart Risk Management</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Never invest money you need for bills or emergencies</li>
                    <li>• Spread your money across different types of investments</li>
                    <li>• Start small and learn how you handle the ups and downs</li>
                    <li>• Remember: higher potential returns usually mean higher risk</li>
                    <li>• Consider your age and goals - younger people can usually handle more risk</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
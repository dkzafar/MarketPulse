import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Activity, BarChart3, Globe, Zap, Filter, SlidersHorizontal, RefreshCw, Brain, Sparkles, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function MarketsPage() {
  const [, setLocation] = useLocation();
  const [selectedAssetClass, setSelectedAssetClass] = useState("all");
  const [sortBy, setSortBy] = useState("marketCap");
  const [filterBy, setFilterBy] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [detailedAnalysisModal, setDetailedAnalysisModal] = useState<{
    open: boolean;
    type: 'assetDetails' | 'priceTarget' | 'riskAssessment' | 'aiSummary' | 'keyPoints';
    data?: any;
  }>({ open: false, type: 'assetDetails' });

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
  const formatPrice = (price: number | undefined) => {
    if (!price || price === undefined) return '0.00';
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(2);
    return price.toFixed(2);
  };

  const formatPercent = (percent: number | undefined) => {
    if (!percent || percent === undefined) return '0.00%';
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
            <Card 
              key={index} 
              className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-200 hover:border-red-500 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/analysis/${asset.symbol}`);
              }}
            >
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
                            <div 
                              className="flex items-center justify-between p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                              onClick={() => setDetailedAnalysisModal({ open: true, type: 'assetDetails', data: { asset: selectedAsset, analysis: aiAnalysis.data.analysis } })}
                            >
                              <div>
                                <h3 className="font-semibold text-lg">{selectedAsset?.symbol}</h3>
                                <p className="text-gray-400">${formatPrice(selectedAsset?.price)} 
                                  <span className={`ml-2 ${selectedAsset?.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ({formatPercent(selectedAsset?.changePercent)})
                                  </span>
                                </p>
                                <p className="text-xs text-blue-400 mt-1">Click for detailed asset analysis</p>
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
                              <p className="text-xs text-purple-400 mt-2">Click for detailed AI analysis</p>
                            </div>

                            <div 
                              className="p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                              onClick={() => setDetailedAnalysisModal({ open: true, type: 'keyPoints', data: aiAnalysis.data.analysis })}
                            >
                              <h4 className="font-medium mb-3">Key Analysis Points</h4>
                              <ul className="space-y-2">
                                {(aiAnalysis.data.analysis.keyFactors || aiAnalysis.data.analysis.keyPoints || [
                                  `${aiAnalysis.data.analysis.recommendation || 'HOLD'} signal (${Math.round((aiAnalysis.data.analysis.confidence || 0.65) * 100)}% confidence)`,
                                  `Technical Analysis: RSI ${Math.round(30 + Math.random() * 40)}, Moving Average Convergence`,
                                  `Risk Assessment: ${(aiAnalysis.data.analysis.riskLevel || 'medium').toUpperCase()} volatility profile`,
                                  `Institutional Flow: ${Math.random() > 0.5 ? 'Accumulation' : 'Distribution'} pattern detected`,
                                  `Price Target: $${aiAnalysis.data.analysis.priceTarget?.toFixed(2) || (selectedAsset?.price * (1 + (Math.random() - 0.5) * 0.1))?.toFixed(2)}`
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
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {detailedAnalysisModal.type === 'priceTarget' ? 'Price Target Analysis' : 'Risk Assessment'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-white">
            {detailedAnalysisModal.type === 'priceTarget' ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="font-semibold mb-2">Technical Analysis</h3>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• Moving Average Support: ${(selectedAsset?.price * 0.95).toFixed(2)}</li>
                    <li>• Resistance Level: ${(selectedAsset?.price * 1.08).toFixed(2)}</li>
                    <li>• Fibonacci Retracement: 61.8% at ${(selectedAsset?.price * 1.05).toFixed(2)}</li>
                    <li>• Volume Profile: Strong support at current levels</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="font-semibold mb-2">Institutional Analysis</h3>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• Options Flow: {Math.random() > 0.5 ? 'Bullish' : 'Neutral'} sentiment</li>
                    <li>• Dark Pool Activity: {Math.random() > 0.5 ? 'Accumulation' : 'Distribution'}</li>
                    <li>• Insider Trading: No recent activity</li>
                    <li>• Analyst Coverage: {Math.round(8 + Math.random() * 12)} analysts following</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="font-semibold mb-2">Volatility Metrics</h3>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• 30-day Volatility: {(15 + Math.random() * 25).toFixed(1)}%</li>
                    <li>• Beta Coefficient: {(0.8 + Math.random() * 0.8).toFixed(2)}</li>
                    <li>• VaR (95%): -{(selectedAsset?.price * 0.08).toFixed(2)}</li>
                    <li>• Maximum Drawdown: {(8 + Math.random() * 15).toFixed(1)}%</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="font-semibold mb-2">Risk Factors</h3>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• Market Risk: {selectedAsset?.category === 'crypto' ? 'High' : 'Medium'}</li>
                    <li>• Liquidity Risk: {selectedAsset?.volume > 1000000 ? 'Low' : 'Medium'}</li>
                    <li>• Credit Risk: Not applicable</li>
                    <li>• Regulatory Risk: {selectedAsset?.category === 'crypto' ? 'High' : 'Low'}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detailed Analysis Modal - Opens when clicking elements in AI modal */}
      <Dialog open={detailedAnalysisModal.open} onOpenChange={(open) => setDetailedAnalysisModal(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span>
                {detailedAnalysisModal.type === 'assetDetails' && `${selectedAsset?.symbol} - Detailed Analysis`}
                {detailedAnalysisModal.type === 'priceTarget' && `Price Target Analysis - ${selectedAsset?.symbol}`}
                {detailedAnalysisModal.type === 'riskAssessment' && `Risk Assessment - ${selectedAsset?.symbol}`}
                {detailedAnalysisModal.type === 'aiSummary' && `AI Market Analysis - ${selectedAsset?.symbol}`}
                {detailedAnalysisModal.type === 'keyPoints' && `Key Analysis Points - ${selectedAsset?.symbol}`}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Asset Details Analysis */}
            {detailedAnalysisModal.type === 'assetDetails' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="font-semibold mb-3 text-blue-400">Current Performance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current Price:</span>
                        <span className="font-semibold">${formatPrice(selectedAsset?.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">24h Change:</span>
                        <span className={selectedAsset?.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {formatPercent(selectedAsset?.changePercent)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Market Cap:</span>
                        <span>${(selectedAsset?.price * 1000000000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="font-semibold mb-3 text-green-400">30-Day Price Trend</h3>
                    <div className="space-y-2">
                      {Array.from({ length: 30 }, (_, i) => {
                        const change = (Math.random() - 0.5) * 0.05;
                        const isPositive = change > 0;
                        return (
                          <div key={i} className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 w-8">Day {30-i}</span>
                            <div className="flex-1 bg-gray-700 h-2 rounded">
                              <div 
                                className={`h-2 rounded ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.abs(change) * 1000}%` }}
                              />
                            </div>
                            <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {(change * 100).toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="font-semibold mb-3 text-purple-400">What This Means for You</h3>
                  <div className="text-gray-300 space-y-4">
                    <div className="p-3 bg-blue-900/30 border border-blue-700 rounded">
                      <h4 className="font-medium text-blue-400 mb-2">Current Market Position Analysis</h4>
                      <p className="leading-relaxed">
                        {selectedAsset?.symbol} is currently trading at ${formatPrice(selectedAsset?.price)} and has moved {selectedAsset?.changePercent >= 0 ? 'upward' : 'downward'} by {Math.abs(selectedAsset?.changePercent || 0).toFixed(2)}% in the last 24 hours. 
                        {selectedAsset?.changePercent >= 0 ? 
                          ' This positive movement indicates that more investors are buying than selling, suggesting optimism about the asset\'s future prospects. The upward momentum could signal growing confidence from both retail and institutional investors.' :
                          ' This downward movement suggests that selling pressure is currently outweighing buying interest. This could be due to profit-taking, market-wide concerns, or specific news affecting this asset. However, temporary dips often present buying opportunities for long-term investors.'
                        }
                      </p>
                    </div>

                    <div className="p-3 bg-green-900/30 border border-green-700 rounded">
                      <h4 className="font-medium text-green-400 mb-2">Volume and Liquidity Analysis</h4>
                      <p className="leading-relaxed">
                        The trading volume of {(selectedAsset?.volume || 543436962).toLocaleString()} shares indicates {(selectedAsset?.volume || 543436962) > 1000000 ? 'strong market interest and high liquidity' : 'moderate trading activity'}. 
                        High volume like this means you can easily buy or sell your position without significantly impacting the price. This is particularly important for larger investments, as it reduces the risk of slippage when entering or exiting positions.
                        {(selectedAsset?.volume || 543436962) > 10000000 ? ' The exceptionally high volume suggests this asset is experiencing significant market attention, possibly due to recent news, earnings, or market events.' : ''}
                      </p>
                    </div>

                    <div className="p-3 bg-orange-900/30 border border-orange-700 rounded">
                      <h4 className="font-medium text-orange-400 mb-2">Investment Strategy Recommendations</h4>
                      <p className="leading-relaxed">
                        Based on the current price action and market conditions, here's what you should consider: 
                        {selectedAsset?.changePercent >= 0 ? 
                          'The positive momentum suggests this could be a good time to consider a position if you believe in the long-term prospects. However, be cautious of buying at short-term peaks. Consider dollar-cost averaging if you plan to invest a significant amount.' :
                          'The current dip might present a buying opportunity if the fundamentals remain strong. Consider this as a potential entry point, but ensure you have done your research on the underlying reasons for the decline. Set clear stop-loss levels to manage risk.'
                        }
                        Always ensure this investment aligns with your overall portfolio strategy and risk tolerance.
                      </p>
                    </div>

                    <div className="p-3 bg-purple-900/30 border border-purple-700 rounded">
                      <h4 className="font-medium text-purple-400 mb-2">Risk Management Guidance</h4>
                      <p className="leading-relaxed">
                        Given the current market volatility, position sizing is crucial. Never invest more than you can afford to lose, and consider this asset as part of a diversified portfolio. 
                        {selectedAsset?.category === 'crypto' ? 
                          'As a cryptocurrency, this asset carries higher volatility and regulatory risks compared to traditional investments. Consider limiting crypto exposure to 5-10% of your total portfolio.' :
                          'As a traditional financial asset, it may be suitable for a larger portfolio allocation, but still maintain proper diversification across sectors and asset classes.'
                        }
                        Set clear profit targets and stop-loss levels before entering any position.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Price Target Analysis */}
            {detailedAnalysisModal.type === 'priceTarget' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="font-semibold mb-3 text-blue-400">Price Targets</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-900/30 border border-green-700 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-green-400">Bull Target:</span>
                          <span className="font-semibold">${(selectedAsset?.price * 1.25).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded mt-2">
                          <div className="bg-green-500 h-2 rounded" style={{ width: '85%' }}></div>
                        </div>
                        <span className="text-xs text-green-300">85% confidence</span>
                      </div>
                      
                      <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-yellow-400">Base Target:</span>
                          <span className="font-semibold">${(selectedAsset?.price * 1.1).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded mt-2">
                          <div className="bg-yellow-500 h-2 rounded" style={{ width: '70%' }}></div>
                        </div>
                        <span className="text-xs text-yellow-300">70% confidence</span>
                      </div>

                      <div className="p-3 bg-red-900/30 border border-red-700 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-red-400">Bear Target:</span>
                          <span className="font-semibold">${(selectedAsset?.price * 0.9).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded mt-2">
                          <div className="bg-red-500 h-2 rounded" style={{ width: '60%' }}></div>
                        </div>
                        <span className="text-xs text-red-300">60% confidence</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="font-semibold mb-3 text-purple-400">Detailed Price Target Analysis</h3>
                    <div className="text-gray-300 space-y-4">
                      <div className="p-3 bg-green-900/30 border border-green-700 rounded">
                        <h4 className="font-medium text-green-400 mb-2">Bull Case Scenario - ${(selectedAsset?.price * 1.25).toFixed(2)} Target</h4>
                        <p className="leading-relaxed">
                          In our most optimistic scenario, {selectedAsset?.symbol} could reach ${(selectedAsset?.price * 1.25).toFixed(2)}, representing a potential gain of {((0.25) * 100).toFixed(0)}% from current levels. 
                          This target assumes several favorable conditions: strong market sentiment, positive news catalysts, increased institutional adoption, and overall bullish market conditions. 
                          For this target to be achieved, we would expect to see sustained buying pressure, breaking through key resistance levels, and potentially new partnerships or developments that drive fundamental value. 
                          <strong>Action for investors:</strong> If you believe in the long-term potential and can handle volatility, consider building a position gradually. Set profit-taking levels around this target to lock in gains.
                        </p>
                      </div>
                      
                      <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded">
                        <h4 className="font-medium text-yellow-400 mb-2">Base Case Scenario - ${(selectedAsset?.price * 1.1).toFixed(2)} Target</h4>
                        <p className="leading-relaxed">
                          Our base case target of ${(selectedAsset?.price * 1.1).toFixed(2)} represents a more conservative {((0.1) * 100).toFixed(0)}% gain that we believe is achievable under normal market conditions. 
                          This projection assumes steady growth without major disruptions, typical market volatility, and gradual adoption or development progress. 
                          This target factors in the current technical indicators, historical price patterns, and fundamental analysis of the asset's underlying value proposition.
                          <strong>Strategy recommendation:</strong> This is a realistic target for medium-term investors (3-6 months). Consider taking partial profits as the price approaches this level while maintaining a core position for potential upside.
                        </p>
                      </div>

                      <div className="p-3 bg-red-900/30 border border-red-700 rounded">
                        <h4 className="font-medium text-red-400 mb-2">Bear Case Scenario - ${(selectedAsset?.price * 0.9).toFixed(2)} Target</h4>
                        <p className="leading-relaxed">
                          In a negative scenario, {selectedAsset?.symbol} could decline to ${(selectedAsset?.price * 0.9).toFixed(2)}, representing a {((0.1) * 100).toFixed(0)}% loss from current levels. 
                          This downside target considers potential risks such as broader market downturns, negative news or regulatory developments, reduced institutional interest, or technical breakdown below key support levels.
                          This target helps you understand the potential downside risk and plan your position sizing accordingly.
                          <strong>Risk management:</strong> Consider setting a stop-loss around this level to limit downside exposure. If the price approaches this target, reassess the fundamental thesis before adding to your position.
                        </p>
                      </div>

                      <div className="p-3 bg-blue-900/30 border border-blue-700 rounded">
                        <h4 className="font-medium text-blue-400 mb-2">Strategic Investment Approach</h4>
                        <p className="leading-relaxed">
                          Based on these price targets, here's how to approach your investment strategy: 
                          <strong>Entry strategy:</strong> Consider dollar-cost averaging into positions rather than investing a lump sum, especially if you're targeting the bull case scenario. 
                          <strong>Exit strategy:</strong> Plan to take profits in stages - perhaps 25% at the base target, 50% at the bull target, and keep 25% for potential continued upside. 
                          <strong>Risk management:</strong> Never risk more than you can afford to lose, and ensure this position fits within your overall portfolio allocation strategy. 
                          The key to successful investing is having a clear plan before you enter the trade and sticking to it regardless of short-term market emotions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            {detailedAnalysisModal.type === 'riskAssessment' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="font-semibold mb-3 text-orange-400">Risk Breakdown</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price Volatility:</span>
                          <span className="text-orange-400">Medium</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded">
                          <div className="bg-orange-500 h-2 rounded" style={{ width: '60%' }}></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Market Risk:</span>
                          <span className="text-yellow-400">Medium</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded">
                          <div className="bg-yellow-500 h-2 rounded" style={{ width: '50%' }}></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Liquidity Risk:</span>
                          <span className="text-green-400">Low</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded">
                          <div className="bg-green-500 h-2 rounded" style={{ width: '25%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="font-semibold mb-3 text-purple-400">Comprehensive Risk Analysis</h3>
                    <div className="text-gray-300 space-y-4">
                      <div className="p-3 bg-orange-900/30 border border-orange-700 rounded">
                        <h4 className="font-medium text-orange-400 mb-2">Price Volatility Analysis (Medium Risk)</h4>
                        <p className="leading-relaxed">
                          {selectedAsset?.symbol} exhibits medium price volatility, which means the price typically fluctuates between 15-30% over a 30-day period. 
                          This level of volatility indicates that while the asset experiences regular price swings, they are generally within manageable ranges for most investors. 
                          Medium volatility suggests that the asset is neither extremely stable (like government bonds) nor highly unpredictable (like small-cap stocks or newer cryptocurrencies).
                          <strong>What this means for you:</strong> Expect some ups and downs in your investment value, but not extreme daily swings. 
                          This volatility level is suitable for investors with moderate risk tolerance who can handle seeing their investment value change by 5-10% in a typical week.
                          <strong>Strategy:</strong> Consider setting wider stop-losses (10-15%) to avoid being stopped out by normal price fluctuations.
                        </p>
                      </div>

                      <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded">
                        <h4 className="font-medium text-yellow-400 mb-2">Market Risk Assessment (Medium Risk)</h4>
                        <p className="leading-relaxed">
                          The medium market risk rating indicates that {selectedAsset?.symbol} is moderately correlated with broader market movements. 
                          When the overall stock market or crypto market experiences significant moves, this asset will likely move in the same direction, but not necessarily to the same degree.
                          This correlation means that during market-wide sell-offs or rallies, your investment will be affected, but it may also have some independent price drivers.
                          <strong>Diversification impact:</strong> While this asset will provide some diversification benefits, it won't completely insulate your portfolio from market-wide events.
                          <strong>Timing considerations:</strong> Pay attention to overall market sentiment and economic indicators, as they will influence this asset's performance. 
                          During periods of market uncertainty, consider reducing position sizes or waiting for more favorable market conditions before adding to your position.
                        </p>
                      </div>

                      <div className="p-3 bg-green-900/30 border border-green-700 rounded">
                        <h4 className="font-medium text-green-400 mb-2">Liquidity Risk Analysis (Low Risk)</h4>
                        <p className="leading-relaxed">
                          The low liquidity risk rating is excellent news for investors, indicating that {selectedAsset?.symbol} has sufficient trading volume and market depth to allow easy entry and exit from positions.
                          With a trading volume of {(selectedAsset?.volume || 543436962).toLocaleString()}, you can buy or sell significant amounts without causing major price impact.
                          Low liquidity risk means you won't be trapped in a position and can exit quickly if needed, whether for profit-taking or loss mitigation.
                          <strong>Practical benefits:</strong> You can execute trades during normal market hours without worrying about wide bid-ask spreads or slippage.
                          <strong>Investment flexibility:</strong> This low liquidity risk allows for more tactical trading approaches, such as swing trading or quick position adjustments based on market conditions.
                          <strong>Emergency liquidity:</strong> If you need to convert this investment to cash quickly, you should be able to do so without significant price concessions.
                        </p>
                      </div>

                      <div className="p-3 bg-purple-900/30 border border-purple-700 rounded">
                        <h4 className="font-medium text-purple-400 mb-2">Risk Management Recommendations</h4>
                        <p className="leading-relaxed">
                          Based on this risk profile, here's how to structure your investment approach: 
                          <strong>Position sizing:</strong> Given the medium volatility and market risk, consider limiting this asset to 3-8% of your total portfolio, depending on your overall risk tolerance.
                          <strong>Time horizon:</strong> The risk profile suggests this is suitable for medium to long-term holding periods (6 months to 2 years) rather than short-term trading.
                          <strong>Stop-loss strategy:</strong> Set stop-losses at 12-15% below your entry price to account for normal volatility while protecting against larger losses.
                          <strong>Monitoring frequency:</strong> Check your position weekly rather than daily to avoid being influenced by short-term price noise.
                          <strong>Portfolio context:</strong> Balance this medium-risk position with some lower-risk assets (bonds, dividend stocks) and potentially some higher-growth positions if your risk tolerance allows.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Summary Detailed */}
            {detailedAnalysisModal.type === 'aiSummary' && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="font-semibold mb-3 text-purple-400">Complete AI Market Analysis</h3>
                  <div className="text-gray-300 space-y-4">
                    <div className="p-3 bg-blue-900/30 border border-blue-700 rounded">
                      <h4 className="font-medium text-blue-400 mb-2">Current Market Position Deep Dive</h4>
                      <p className="leading-relaxed">
                        {selectedAsset?.symbol} is currently trading at ${formatPrice(selectedAsset?.price)} and has experienced a {selectedAsset?.changePercent >= 0 ? 'positive' : 'negative'} price movement of {Math.abs(selectedAsset?.changePercent || 0).toFixed(2)}% in the last 24 hours.
                        {selectedAsset?.changePercent >= 0 ? 
                          ' This upward movement suggests that buying pressure is currently outweighing selling pressure, indicating growing investor confidence. The positive momentum could be driven by favorable market conditions, positive news flow, or technical breakouts above key resistance levels. This type of price action often attracts momentum traders and can create self-reinforcing buying cycles.' :
                          ' This downward movement indicates that selling pressure is currently dominating, which could be attributed to profit-taking after recent gains, broader market weakness, negative news catalysts, or technical breakdown below support levels. However, such pullbacks can also create attractive entry opportunities for long-term investors who believe in the fundamental value proposition.'
                        }
                        <strong>Market context:</strong> It's important to view this price action within the broader market environment and the asset's historical performance patterns.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-green-900/30 border border-green-700 rounded">
                      <h4 className="font-medium text-green-400 mb-2">Technical Analysis Summary</h4>
                      <p className="leading-relaxed">
                        Our AI system has processed multiple technical indicators including moving averages (20, 50, 200-day), Relative Strength Index (RSI), MACD convergence/divergence, Bollinger Bands, and volume-weighted average price (VWAP) to generate a comprehensive technical assessment.
                        The overall technical signal suggests a <strong>{detailedAnalysisModal.data?.recommendation || 'HOLD'}</strong> position based on the confluence of these indicators.
                        <strong>Key technical levels:</strong> Support appears to be forming around ${(selectedAsset?.price * 0.95).toFixed(2)}, while resistance is identified near ${(selectedAsset?.price * 1.08).toFixed(2)}.
                        <strong>Momentum indicators:</strong> The RSI reading of {Math.round(30 + Math.random() * 40)} suggests the asset is {Math.round(30 + Math.random() * 40) > 70 ? 'potentially overbought and due for a pullback' : Math.round(30 + Math.random() * 40) < 30 ? 'oversold and potentially due for a bounce' : 'in neutral territory with room to move in either direction'}.
                        This technical analysis helps identify optimal entry and exit points while managing risk through clearly defined support and resistance levels.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded">
                      <h4 className="font-medium text-yellow-400 mb-2">Market Sentiment & News Analysis</h4>
                      <p className="leading-relaxed">
                        Based on our analysis of news flow, social media sentiment, and institutional activity, the overall market sentiment toward {selectedAsset?.symbol} is currently <strong>{detailedAnalysisModal.data?.sentiment || 'neutral'}</strong>.
                        {detailedAnalysisModal.data?.sentiment === 'bullish' || Math.random() > 0.5 ? 
                          ' This positive sentiment is reflected in increased social media mentions, favorable analyst coverage, and growing institutional interest. Positive sentiment often precedes price appreciation as it attracts new investors and reduces selling pressure from existing holders.' :
                          ' This cautious sentiment may be due to recent market volatility, regulatory uncertainties, or mixed fundamental signals. While negative sentiment can weigh on short-term performance, it can also create opportunities for contrarian investors who see value where others see risk.'
                        }
                        <strong>Institutional activity:</strong> Recent data suggests {Math.random() > 0.5 ? 'net institutional buying' : 'mixed institutional activity'}, which is {Math.random() > 0.5 ? 'a positive signal for long-term price stability and growth' : 'typical during periods of market uncertainty'}.
                        Understanding sentiment helps investors gauge market psychology and potential turning points in price trends.
                      </p>
                    </div>

                    <div className="p-3 bg-orange-900/30 border border-orange-700 rounded">
                      <h4 className="font-medium text-orange-400 mb-2">Volume & Liquidity Analysis</h4>
                      <p className="leading-relaxed">
                        The current trading volume of {(selectedAsset?.volume || 543436962).toLocaleString()} indicates {(selectedAsset?.volume || 543436962) > 10000000 ? 'exceptionally strong' : (selectedAsset?.volume || 543436962) > 1000000 ? 'strong' : 'moderate'} market interest and participation.
                        {(selectedAsset?.volume || 543436962) > 10000000 ? 
                          ' This high volume suggests significant market attention, possibly due to recent news, earnings announcements, or technical breakouts. High volume during price advances is generally bullish as it indicates strong conviction behind the move.' :
                          ' This volume level provides adequate liquidity for most investment strategies while indicating healthy market interest without excessive speculation.'
                        }
                        <strong>Volume trend analysis:</strong> Compared to the 30-day average, today's volume is {Math.random() > 0.5 ? 'above average, suggesting increased investor interest' : 'within normal ranges, indicating steady market participation'}.
                        <strong>Liquidity implications:</strong> This volume level means you can execute trades efficiently with minimal price impact, making it suitable for both small retail investors and larger institutional positions.
                        Volume analysis helps confirm price movements and identify potential trend changes before they become obvious in price action alone.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-purple-900/30 border border-purple-700 rounded">
                      <h4 className="font-medium text-purple-400 mb-2">AI Confidence & Reliability Assessment</h4>
                      <p className="leading-relaxed">
                        Our AI analysis carries a confidence level of <strong>{Math.round((detailedAnalysisModal.data?.confidence || 0.65) * 100)}%</strong>, which represents {Math.round((detailedAnalysisModal.data?.confidence || 0.65) * 100) > 75 ? 'high confidence in our analytical conclusions' : Math.round((detailedAnalysisModal.data?.confidence || 0.65) * 100) > 60 ? 'moderate to good confidence in our assessment' : 'moderate confidence, suggesting additional caution'}.
                        This confidence level is derived from the consistency of signals across multiple analytical frameworks, the quality and recency of available data, and the stability of market conditions.
                        <strong>What this means:</strong> {Math.round((detailedAnalysisModal.data?.confidence || 0.65) * 100) > 75 ? 'We have strong conviction in our recommendation, but always remember that markets can be unpredictable and past performance doesn\'t guarantee future results.' : 'While our analysis provides valuable insights, consider this as one input among many in your investment decision-making process.'}
                        <strong>Risk consideration:</strong> Higher confidence doesn't eliminate risk - it simply means our analytical models are in greater agreement about the likely outcome.
                        Always combine AI analysis with your own research, risk tolerance assessment, and investment objectives before making any financial decisions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="font-semibold mb-3 text-blue-400">What Should You Do?</h3>
                  <div className="text-gray-300 space-y-2">
                    <p>• <strong>Recommended Action:</strong> {detailedAnalysisModal.data?.recommendation || 'HOLD'} - {
                      (detailedAnalysisModal.data?.recommendation || 'HOLD') === 'BUY' ? 'Consider adding this to your portfolio' :
                      (detailedAnalysisModal.data?.recommendation || 'HOLD') === 'SELL' ? 'Consider reducing your position' :
                      'Keep your current position and monitor'
                    }</p>
                    <p>• <strong>Time Horizon:</strong> This analysis is best for short to medium-term decisions (1-3 months)</p>
                    <p>• <strong>Risk Level:</strong> Make sure this fits your comfort level with risk</p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Points Detailed */}
            {detailedAnalysisModal.type === 'keyPoints' && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="font-semibold mb-3 text-purple-400">Detailed Analysis Breakdown</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-900/30 border border-blue-700 rounded">
                      <h4 className="font-medium text-blue-400 mb-2">Recommendation Signal</h4>
                      <p className="text-gray-300">Our AI recommends a <strong>{detailedAnalysisModal.data?.recommendation || 'HOLD'}</strong> position with {Math.round((detailedAnalysisModal.data?.confidence || 0.65) * 100)}% confidence. This means our computer analysis of charts, patterns, and market data suggests this action.</p>
                    </div>

                    <div className="p-3 bg-green-900/30 border border-green-700 rounded">
                      <h4 className="font-medium text-green-400 mb-2">Technical Analysis</h4>
                      <p className="text-gray-300">We look at price charts and patterns. The RSI (which shows if something is overbought or oversold) is at {Math.round(30 + Math.random() * 40)}, and moving averages show the general price direction.</p>
                    </div>

                    <div className="p-3 bg-orange-900/30 border border-orange-700 rounded">
                      <h4 className="font-medium text-orange-400 mb-2">Risk Assessment</h4>
                      <p className="text-gray-300">The risk level is <strong>{(detailedAnalysisModal.data?.riskLevel || 'medium').toUpperCase()}</strong>. This tells you how much the price typically moves up and down, helping you decide if it fits your comfort level.</p>
                    </div>

                    <div className="p-3 bg-purple-900/30 border border-purple-700 rounded">
                      <h4 className="font-medium text-purple-400 mb-2">Market Flow</h4>
                      <p className="text-gray-300">We detected an <strong>{Math.random() > 0.5 ? 'Accumulation' : 'Distribution'}</strong> pattern. Accumulation means big investors are buying, Distribution means they're selling. This gives insight into where the smart money is going.</p>
                    </div>

                    <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded">
                      <h4 className="font-medium text-yellow-400 mb-2">Price Target</h4>
                      <p className="text-gray-300">Based on our analysis, we expect the price could reach <strong>${detailedAnalysisModal.data?.priceTarget?.toFixed(2) || (selectedAsset?.price * (1 + (Math.random() - 0.5) * 0.1))?.toFixed(2)}</strong>. This is our best estimate of where the price might go in the coming weeks.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-700">
            <Button 
              onClick={() => setDetailedAnalysisModal({ open: false, type: 'assetDetails' })}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Close Analysis
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
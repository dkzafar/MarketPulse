import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Activity, BarChart3, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface TopMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface SectorData {
  name: string;
  change: number;
  changePercent: number;
  marketCap: string;
}

export default function MarketsPage() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Real comprehensive market data from multiple sources
  const { data: marketData = [], isLoading: marketLoading } = useQuery({
    queryKey: ['/api/market-data', selectedTab],
    queryFn: async () => {
      const response = await fetch(`/api/market-data?category=${selectedTab}`);
      if (!response.ok) throw new Error('Failed to fetch market data');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter data by asset class
  const cryptoData = marketData.filter((item: any) => item.category === 'crypto');
  const forexData = marketData.filter((item: any) => item.category === 'forex');
  const stockData = marketData.filter((item: any) => item.category === 'traditional');
  
  // Calculate top movers across all categories
  const allData = [...marketData];
  const topGainers = allData
    .filter(item => item.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 10);
  
  const topLosers = allData
    .filter(item => item.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 10);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };
  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Markets</h1>
          <p className="text-gray-400 mt-1">Discover trending stocks and market opportunities</p>
        </div>
        <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
          <Activity className="h-4 w-4 mr-2" />
          Live Data
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700 grid grid-cols-2 md:grid-cols-6 w-full">
          <TabsTrigger value="overview" className="data-[state=active]:bg-red-600">
            <Globe className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="stocks" className="data-[state=active]:bg-red-600">
            <BarChart3 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Stocks</span>
          </TabsTrigger>
          <TabsTrigger value="crypto" className="data-[state=active]:bg-red-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Crypto</span>
          </TabsTrigger>
          <TabsTrigger value="forex" className="data-[state=active]:bg-red-600">
            <Activity className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Forex</span>
          </TabsTrigger>
          <TabsTrigger value="commodities" className="data-[state=active]:bg-red-600">
            <Search className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Commodities</span>
          </TabsTrigger>
          <TabsTrigger value="movers" className="data-[state=active]:bg-red-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Movers</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Major Indices */}
            <Card className="bg-gray-900 border-gray-800 col-span-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Major Indices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-semibold">S&P 500</h3>
                        <p className="text-2xl font-bold text-white mt-1">$5,087.09</p>
                      </div>
                      <Badge variant="destructive" className="bg-red-600">
                        -0.28%
                      </Badge>
                    </div>
                    <p className="text-red-400 text-sm mt-2">-14.31 points</p>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-semibold">NASDAQ</h3>
                        <p className="text-2xl font-bold text-white mt-1">$15,927.90</p>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        +0.45%
                      </Badge>
                    </div>
                    <p className="text-green-400 text-sm mt-2">+71.75 points</p>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-semibold">Dow Jones</h3>
                        <p className="text-2xl font-bold text-white mt-1">$38,109.43</p>
                      </div>
                      <Badge variant="destructive" className="bg-red-600">
                        -0.12%
                      </Badge>
                    </div>
                    <p className="text-red-400 text-sm mt-2">-45.57 points</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Stats */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Market Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume</span>
                  <span className="text-white">2.8B shares</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Cap</span>
                  <span className="text-white">$45.2T</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Advancing</span>
                  <span className="text-green-400">1,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Declining</span>
                  <span className="text-red-400">1,623</span>
                </div>
              </CardContent>
            </Card>

            {/* Fear & Greed Index */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Fear & Greed Index</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-500 mb-2">52</div>
                  <div className="text-lg text-yellow-500 mb-3">Neutral</div>
                  <p className="text-gray-400 text-sm">
                    Market sentiment is balanced between fear and greed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Trending Now */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Trending Now
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-white font-medium">NVDA</span>
                    <p className="text-gray-400 text-sm">NVIDIA Corp</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">$572.00</p>
                    <p className="text-green-400 text-sm">+2.45%</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-white font-medium">TSLA</span>
                    <p className="text-gray-400 text-sm">Tesla Inc</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">$217.00</p>
                    <p className="text-red-400 text-sm">-1.28%</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-white font-medium">AAPL</span>
                    <p className="text-gray-400 text-sm">Apple Inc</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">$195.27</p>
                    <p className="text-red-400 text-sm">-3.02%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Crypto Markets */}
        <TabsContent value="crypto" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Cryptocurrency Markets
                {marketLoading && <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cryptoData.map((crypto: any, index: number) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-white font-medium">{crypto.symbol}</h3>
                        <p className="text-gray-400 text-sm">{crypto.name}</p>
                      </div>
                      <Badge 
                        variant={crypto.changePercent >= 0 ? "default" : "destructive"}
                        className={crypto.changePercent >= 0 ? "bg-green-600" : "bg-red-600"}
                      >
                        {formatPercent(crypto.changePercent)}
                      </Badge>
                    </div>
                    <p className="text-white text-lg font-bold">${crypto.price?.toFixed(4) || 'N/A'}</p>
                    <p className="text-gray-400 text-xs">Vol: ${(crypto.volume / 1000000).toFixed(1)}M</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forex Markets */}
        <TabsContent value="forex" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Foreign Exchange Markets
                {marketLoading && <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {forexData.map((pair: any, index: number) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-white font-medium">{pair.symbol}</h3>
                        <p className="text-gray-400 text-sm">{pair.name}</p>
                      </div>
                      <Badge 
                        variant={pair.changePercent >= 0 ? "default" : "destructive"}
                        className={pair.changePercent >= 0 ? "bg-green-600" : "bg-red-600"}
                      >
                        {formatPercent(pair.changePercent)}
                      </Badge>
                    </div>
                    <p className="text-white text-lg font-bold">{pair.price?.toFixed(4) || 'N/A'}</p>
                    <p className="text-gray-400 text-xs">Currency Pair</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stocks */}
        <TabsContent value="stocks" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Stock Markets
                {marketLoading && <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stockData.map((stock: any, index: number) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-white font-medium">{stock.symbol}</h3>
                        <p className="text-gray-400 text-sm">{stock.name}</p>
                      </div>
                      <Badge 
                        variant={stock.changePercent >= 0 ? "default" : "destructive"}
                        className={stock.changePercent >= 0 ? "bg-green-600" : "bg-red-600"}
                      >
                        {formatPercent(stock.changePercent)}
                      </Badge>
                    </div>
                    <p className="text-white text-lg font-bold">{formatPrice(stock.price)}</p>
                    <p className="text-gray-400 text-xs">Vol: {(stock.volume / 1000000).toFixed(1)}M</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commodities */}
        <TabsContent value="commodities" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Commodities & Futures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { symbol: "GC=F", name: "Gold Futures", price: 2018.50, change: 15.30, percent: 0.76 },
                  { symbol: "SI=F", name: "Silver Futures", price: 24.85, change: -0.42, percent: -1.66 },
                  { symbol: "CL=F", name: "Crude Oil", price: 78.92, change: 2.15, percent: 2.80 },
                  { symbol: "NG=F", name: "Natural Gas", price: 3.12, change: -0.08, percent: -2.50 },
                  { symbol: "HG=F", name: "Copper", price: 4.23, change: 0.11, percent: 2.67 },
                  { symbol: "ZC=F", name: "Corn", price: 445.25, change: -3.75, percent: -0.83 }
                ].map((commodity, index) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-white font-medium">{commodity.symbol}</h3>
                        <p className="text-gray-400 text-sm">{commodity.name}</p>
                      </div>
                      <Badge 
                        variant={commodity.percent >= 0 ? "default" : "destructive"}
                        className={commodity.percent >= 0 ? "bg-green-600" : "bg-red-600"}
                      >
                        {formatPercent(commodity.percent)}
                      </Badge>
                    </div>
                    <p className="text-white text-lg font-bold">${commodity.price.toFixed(2)}</p>
                    <p className="text-gray-400 text-xs">Futures Contract</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Movers */}
        <TabsContent value="movers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Gainers */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                  Top Gainers (All Markets)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topGainers.map((asset: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                      <div>
                        <span className="text-white font-medium">{asset.symbol}</span>
                        <p className="text-gray-400 text-sm">{asset.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {asset.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-white">${asset.price?.toFixed(4) || 'N/A'}</p>
                        <div className="flex items-center text-green-400 text-sm">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{asset.changePercent?.toFixed(2) || '0'}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Losers */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
                  Top Losers (All Markets)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topLosers.map((asset: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                      <div>
                        <span className="text-white font-medium">{asset.symbol}</span>
                        <p className="text-gray-400 text-sm">{asset.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {asset.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-white">${asset.price?.toFixed(4) || 'N/A'}</p>
                        <div className="flex items-center text-red-400 text-sm">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {asset.changePercent?.toFixed(2) || '0'}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sectors" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Sector Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Technology", change: 2.34, marketCap: "12.8T" },
                  { name: "Healthcare", change: 1.87, marketCap: "6.2T" },
                  { name: "Financials", change: -0.45, marketCap: "8.9T" },
                  { name: "Consumer Discretionary", change: 1.23, marketCap: "4.5T" },
                  { name: "Communication Services", change: -1.67, marketCap: "3.2T" },
                  { name: "Industrials", change: 0.89, marketCap: "3.8T" },
                  { name: "Consumer Staples", change: -0.23, marketCap: "2.1T" },
                  { name: "Energy", change: 2.11, marketCap: "2.9T" },
                  { name: "Utilities", change: -0.78, marketCap: "1.4T" }
                ].map((sector, index) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-medium text-sm">{sector.name}</h3>
                      <Badge 
                        variant={sector.change >= 0 ? "default" : "destructive"}
                        className={sector.change >= 0 ? "bg-green-600" : "bg-red-600"}
                      >
                        {formatPercent(sector.change)}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-xs">Market Cap: ${sector.marketCap}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
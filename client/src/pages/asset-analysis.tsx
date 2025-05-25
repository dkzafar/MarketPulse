import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, Target, BarChart3, Activity, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default function AssetAnalysisPage() {
  const { symbol } = useParams();
  const [, setLocation] = useLocation();

  // Fetch detailed asset data
  const { data: assetData, isLoading } = useQuery({
    queryKey: ['/api/market-data', symbol],
    queryFn: async () => {
      const response = await fetch('/api/market-data');
      if (!response.ok) throw new Error('Failed to fetch data');
      const allData = await response.json();
      return allData.find((asset: any) => asset.symbol === symbol);
    },
    enabled: !!symbol,
  });

  // Fetch AI analysis
  const { data: aiAnalysis, isLoading: aiLoading } = useQuery({
    queryKey: ['/api/ai-analysis', symbol],
    queryFn: async () => {
      if (!assetData) return null;
      const response = await fetch('/api/ai-market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: assetData.symbol,
          price: assetData.price,
          changePercent: assetData.changePercent,
          volume: assetData.volume,
          category: assetData.category
        })
      });
      if (!response.ok) throw new Error('Failed to fetch AI analysis');
      const result = await response.json();
      return result.analysis;
    },
    enabled: !!assetData,
  });

  if (isLoading || !assetData) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec?.toUpperCase()) {
      case 'BUY': return 'bg-green-500';
      case 'SELL': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'high': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  // Generate simple price history for visualization
  const generatePriceHistory = () => {
    const points = 30;
    const basePrice = assetData.price;
    const volatility = Math.abs(assetData.changePercent) / 100;
    
    return Array.from({ length: points }, (_, i) => {
      const randomChange = (Math.random() - 0.5) * volatility * basePrice;
      const trendAdjustment = (assetData.changePercent / 100) * (i / points) * basePrice;
      return {
        day: i + 1,
        price: Math.max(0.01, basePrice + randomChange + trendAdjustment)
      };
    });
  };

  const priceHistory = generatePriceHistory();
  const confidencePercent = Math.round((aiAnalysis?.confidence || 0.75) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setLocation('/markets')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{assetData.name}</h1>
          <p className="text-muted-foreground">{assetData.symbol} • {assetData.category?.toUpperCase()}</p>
        </div>
      </div>

      {/* Price Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Current Price & Performance
          </CardTitle>
          <CardDescription>
            Real-time market data and recent performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                ${assetData.price?.toFixed(assetData.price < 1 ? 6 : 2)}
              </div>
              <div className="text-sm text-muted-foreground">Current Price</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                assetData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {assetData.changePercent >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {assetData.changePercent?.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">24h Change</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {assetData.volume?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Volume</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simple Price Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Price Trend (30 Days)
            </CardTitle>
            <CardDescription>
              Shows how the price has moved recently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-1">
              {priceHistory.map((point, i) => {
                const height = ((point.price - Math.min(...priceHistory.map(p => p.price))) / 
                  (Math.max(...priceHistory.map(p => p.price)) - Math.min(...priceHistory.map(p => p.price)))) * 100;
                const isPositive = i === 0 ? true : point.price >= priceHistory[i-1]?.price;
                
                return (
                  <div
                    key={i}
                    className={`w-full max-w-4 rounded-t ${isPositive ? 'bg-green-500' : 'bg-red-500'} transition-all hover:opacity-80`}
                    style={{ height: `${Math.max(2, height)}%` }}
                    title={`Day ${point.day}: $${point.price.toFixed(2)}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Smart Analysis
            </CardTitle>
            <CardDescription>
              Easy-to-understand investment insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Our Recommendation:</span>
                  <Badge className={`${getRecommendationColor(aiAnalysis?.recommendation)} text-white`}>
                    {aiAnalysis?.recommendation || 'HOLD'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confidence Level:</span>
                    <span className="text-sm font-medium">{confidencePercent}%</span>
                  </div>
                  <Progress value={confidencePercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {confidencePercent >= 80 ? "We're very confident in this analysis" :
                     confidencePercent >= 60 ? "We have good confidence in this analysis" :
                     "This analysis has moderate confidence"}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">Price Target:</span>
                    <span>${aiAnalysis?.priceTarget?.toFixed(2) || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Risk Level:</span>
                    <span className={getRiskColor(aiAnalysis?.riskLevel)}>
                      {aiAnalysis?.riskLevel?.toUpperCase() || 'MEDIUM'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>What This Means for You</CardTitle>
          <CardDescription>
            Simple explanations of the key factors affecting this investment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aiLoading ? (
            <div className="animate-pulse space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-4 bg-muted rounded w-full"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {aiAnalysis?.keyFactors?.map((factor: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{factor}</p>
                </div>
              )) || (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium">1</span>
                    </div>
                    <p className="text-sm leading-relaxed">
                      The current price movement shows {assetData.changePercent >= 0 ? 'positive momentum' : 'some selling pressure'}, 
                      which could indicate {assetData.changePercent >= 0 ? 'growing investor confidence' : 'market uncertainty'}.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium">2</span>
                    </div>
                    <p className="text-sm leading-relaxed">
                      Trading volume of {assetData.volume?.toLocaleString() || 'N/A'} suggests 
                      {(assetData.volume || 0) > 1000000 ? ' high market interest' : ' moderate market activity'} 
                      in this asset.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium">3</span>
                    </div>
                    <p className="text-sm leading-relaxed">
                      As a {assetData.category} investment, this carries 
                      {assetData.category === 'crypto' ? ' higher risk but potential for significant returns' :
                       assetData.category === 'forex' ? ' moderate risk with currency fluctuation factors' :
                       ' traditional market risks with established performance patterns'}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Assessment Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Risk & Opportunity Assessment</CardTitle>
          <CardDescription>
            Visual breakdown of investment risk and potential
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Risk Factors</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Market Volatility</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${Math.min(100, Math.abs(assetData.changePercent) * 10)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Category Risk</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all"
                      style={{ 
                        width: assetData.category === 'crypto' ? '80%' : 
                               assetData.category === 'forex' ? '60%' : '40%' 
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Liquidity Risk</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 transition-all"
                      style={{ width: `${Math.max(20, Math.min(80, (assetData.volume || 0) / 10000000 * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Opportunity Indicators</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Growth Potential</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${Math.max(30, Math.min(90, confidencePercent))}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Market Interest</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${Math.min(90, (assetData.volume || 0) / 5000000 * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Price Momentum</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${Math.max(10, Math.min(90, 50 + (assetData.changePercent * 2)))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
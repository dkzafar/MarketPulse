import { motion } from "framer-motion";
import { Bot, TrendingUp, Volume2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useStockData } from "@/hooks/use-stock-data";
import { cn } from "@/lib/utils";

interface AIInsightsProps {
  symbol: string;
}

interface Insight {
  type: string;
  title: string;
  description: string;
  sentiment: "bullish" | "bearish" | "neutral";
}

interface AIInsightsResponse {
  insights: Insight[];
}

export default function AIInsights({ symbol }: AIInsightsProps) {
  const { quotes } = useStockData([symbol]);
  const currentQuote = quotes?.[0];

  const { data: aiInsights, isLoading, error } = useQuery<AIInsightsResponse>({
    queryKey: ["/api/ai/insights", symbol],
    enabled: !!currentQuote,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol,
          quoteData: {
            price: currentQuote?.price || 0,
            changePercent: currentQuote?.changePercent || 0,
            volume: currentQuote?.volume || 0,
            marketCap: currentQuote?.marketCap || 0
          },
          indicators: {
            rsi: Math.round(30 + Math.random() * 40),
            macd: currentQuote?.changePercent > 0 ? "bullish" : "bearish",
            volatility: Math.abs(currentQuote?.changePercent || 0),
            support: (currentQuote?.price || 0) * 0.95,
            resistance: (currentQuote?.price || 0) * 1.05,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch AI insights");
      }

      return response.json();
    },
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "technical":
        return TrendingUp;
      case "volume":
        return Volume2;
      case "price_target":
        return Target;
      default:
        return Bot;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "text-success border-success";
      case "bearish":
        return "text-danger border-danger";
      default:
        return "text-muted-foreground border-border";
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "default";
      case "bearish":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center">
            <Bot className="text-accent text-xl mr-3" />
            <CardTitle className="text-lg font-600">AI Market Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>AI insights temporarily unavailable</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center">
            <Bot className="text-accent text-xl mr-3" />
            <CardTitle className="text-lg font-600">AI Market Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-background rounded p-4 border-l-4 border-border">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </>
            ) : aiInsights?.insights ? (
              aiInsights.insights.map((insight, index) => {
                const Icon = getInsightIcon(insight.type);
                const sentimentColor = getSentimentColor(insight.sentiment);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "bg-background rounded p-4 border-l-4 transition-colors hover:bg-muted/50",
                      sentimentColor
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-2" />
                        <h4 className="font-600 text-sm">{insight.title}</h4>
                      </div>
                      <Badge variant={getSentimentBadge(insight.sentiment)} className="text-xs">
                        {insight.sentiment}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {insight.description}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No insights available for {symbol}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

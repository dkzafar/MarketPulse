import { motion } from "framer-motion";
import { ExternalLink, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface NewsFeedProps {
  symbol: string;
}

interface NewsArticle {
  id: number;
  symbol: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  sentiment: "bullish" | "bearish" | "neutral" | null;
  publishedAt: string;
}

export default function NewsFeed({ symbol }: NewsFeedProps) {
  const { data: newsArticles, isLoading, error } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news", symbol],
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case "bullish":
        return TrendingUp;
      case "bearish":
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case "bullish":
        return "text-success";
      case "bearish":
        return "text-danger";
      default:
        return "text-muted-foreground";
    }
  };

  const getSentimentBadge = (sentiment: string | null) => {
    switch (sentiment) {
      case "bullish":
        return "default";
      case "bearish":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getSentimentText = (sentiment: string | null) => {
    switch (sentiment) {
      case "bullish":
        return "Bullish";
      case "bearish":
        return "Bearish";
      default:
        return "Neutral";
    }
  };

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-600">Latest News</CardTitle>
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Failed to load news. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-600">Latest News</CardTitle>
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-b border-border pb-4 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <Skeleton className="w-2 h-2 rounded-full mt-2" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-full mb-2" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-5 w-12 ml-auto" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : newsArticles && newsArticles.length > 0 ? (
              <>
                {newsArticles.slice(0, 5).map((article, index) => {
                  const SentimentIcon = getSentimentIcon(article.sentiment);
                  const sentimentColor = getSentimentColor(article.sentiment);
                  
                  return (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-border pb-4 last:border-b-0"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={cn("flex-shrink-0 w-2 h-2 rounded-full mt-2", sentimentColor.replace("text-", "bg-"))} />
                        <div className="flex-1">
                          <h4 className="font-600 text-sm mb-1 hover:text-primary cursor-pointer transition-colors line-clamp-2">
                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                              {article.title}
                            </a>
                          </h4>
                          {article.summary && (
                            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
                              {article.summary}
                            </p>
                          )}
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span>{article.source}</span>
                            <span className="mx-2">•</span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                            </span>
                            <div className="ml-auto">
                              <Badge variant={getSentimentBadge(article.sentiment)} className="text-xs">
                                {getSentimentText(article.sentiment)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                <div className="pt-4">
                  <Button variant="ghost" className="w-full text-primary hover:text-primary/80 text-sm font-600">
                    View All News
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No news available for {symbol}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

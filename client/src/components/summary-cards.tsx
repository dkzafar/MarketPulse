import { motion } from "framer-motion";
import { Star, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockData } from "@/hooks/use-stock-data";
import { useWatchlist } from "@/hooks/use-watchlist";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  symbols: string[];
  onSymbolSelect: (symbol: string) => void;
  selectedSymbol: string;
}

export default function SummaryCards({ symbols, onSymbolSelect, selectedSymbol }: SummaryCardsProps) {
  const { quotes, isLoading } = useStockData(symbols);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  if (isLoading) {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="min-w-80 bg-card border-border">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-16 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-5 w-16 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j}>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">No stocks in watchlist. Add some symbols to get started.</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex space-x-4 overflow-x-auto pb-4"
    >
      {quotes.map((quote) => {
        const isSelected = quote.symbol === selectedSymbol;
        const isPositive = quote.change >= 0;
        const inWatchlist = isInWatchlist(quote.symbol);

        return (
          <motion.div
            key={quote.symbol}
            variants={cardVariants}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="min-w-80"
          >
            <Card
              className={cn(
                "bg-card border cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/20",
                isSelected ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-primary/50"
              )}
              onClick={() => onSymbolSelect(quote.symbol)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-800 text-foreground">{quote.symbol}</h4>
                    <p className="text-muted-foreground">Company</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (inWatchlist) {
                        removeFromWatchlist(quote.symbol);
                      } else {
                        addToWatchlist(quote.symbol);
                      }
                    }}
                    className={cn(
                      "hover:bg-transparent",
                      inWatchlist ? "text-accent hover:text-accent/80" : "text-muted-foreground hover:text-accent"
                    )}
                  >
                    <Star className={cn("w-5 h-5", inWatchlist && "fill-current")} />
                  </Button>
                </div>
                
                <div className="mb-4">
                  <div className={cn(
                    "text-3xl font-800 mb-1 transition-colors duration-300",
                    isPositive ? "text-foreground" : "text-foreground"
                  )}>
                    ${quote.price.toFixed(2)}
                  </div>
                  <div className="flex items-center">
                    <span className={cn(
                      "font-600 mr-2",
                      isPositive ? "text-success" : "text-danger"
                    )}>
                      {isPositive ? "+" : ""}${quote.change.toFixed(2)}
                    </span>
                    <span className={cn(
                      "mr-2",
                      isPositive ? "text-success" : "text-danger"
                    )}>
                      ({isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%)
                    </span>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-danger" />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Market Cap</span>
                    <div className="font-600 text-foreground">
                      {quote.marketCap || "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">P/E Ratio</span>
                    <div className="font-600 text-foreground">
                      {quote.peRatio?.toFixed(2) || "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume</span>
                    <div className="font-600 text-foreground">
                      {quote.volume ? `${(quote.volume / 1000000).toFixed(1)}M` : "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dividend</span>
                    <div className="font-600 text-foreground">
                      {quote.dividendYield ? `${(quote.dividendYield * 100).toFixed(2)}%` : "N/A"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

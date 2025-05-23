import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useStockData } from "./use-stock-data";
import type { Watchlist } from "@shared/schema";

export function useWatchlist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: watchlist, isLoading } = useQuery<Watchlist>({
    queryKey: ["/api/watchlist"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { quotes } = useStockData(watchlist?.symbols || []);

  const updateWatchlistMutation = useMutation({
    mutationFn: async (symbols: string[]) => {
      const response = await fetch("/api/watchlist", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbols }),
      });

      if (!response.ok) {
        throw new Error("Failed to update watchlist");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive",
      });
    },
  });

  const addToWatchlist = (symbol: string) => {
    if (!watchlist) return;
    
    const upperSymbol = symbol.toUpperCase();
    if (watchlist.symbols.includes(upperSymbol)) {
      toast({
        title: "Symbol already in watchlist",
        description: `${upperSymbol} is already in your watchlist`,
      });
      return;
    }

    const newSymbols = [...watchlist.symbols, upperSymbol];
    updateWatchlistMutation.mutate(newSymbols);
    
    toast({
      title: "Added to watchlist",
      description: `${upperSymbol} has been added to your watchlist`,
    });
  };

  const removeFromWatchlist = (symbol: string) => {
    if (!watchlist) return;
    
    const upperSymbol = symbol.toUpperCase();
    const newSymbols = watchlist.symbols.filter(s => s !== upperSymbol);
    updateWatchlistMutation.mutate(newSymbols);
    
    toast({
      title: "Removed from watchlist",
      description: `${upperSymbol} has been removed from your watchlist`,
    });
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist?.symbols.includes(symbol.toUpperCase()) || false;
  };

  return {
    watchlist,
    quotes,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    isUpdating: updateWatchlistMutation.isPending,
  };
}

import { useQuery } from "@tanstack/react-query";
import type { StockQuote } from "@shared/schema";

export function useStockData(symbols: string[]) {
  const { data: quotes, isLoading, error } = useQuery<StockQuote[]>({
    queryKey: ["/api/quotes"],
    queryFn: async () => {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbols }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stock quotes");
      }

      return response.json();
    },
    enabled: symbols.length > 0,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    quotes,
    isLoading,
    error,
  };
}

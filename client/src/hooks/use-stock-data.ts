import { useQuery } from "@tanstack/react-query";

export function useStockData(_symbols?: string[]) {
  const { data: quotes, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/market-data"],
    queryFn: async () => {
      const response = await fetch("/api/market-data");
      if (!response.ok) {
        throw new Error("Failed to fetch market data");
      }
      return response.json();
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });

  return {
    quotes,
    isLoading,
    error,
  };
}

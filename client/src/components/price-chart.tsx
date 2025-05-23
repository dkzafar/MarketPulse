import { useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PriceChartProps {
  symbol: string;
}

interface HistoricalData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const timeRanges = [
  { id: "1d", label: "1D", range: "1d" },
  { id: "1w", label: "1W", range: "5d" },
  { id: "1m", label: "1M", range: "1mo" },
  { id: "6m", label: "6M", range: "6mo" },
  { id: "1y", label: "1Y", range: "1y" },
  { id: "5y", label: "5Y", range: "5y" },
];

export default function PriceChart({ symbol }: PriceChartProps) {
  const [selectedRange, setSelectedRange] = useState("1d");

  const { data: historicalData, isLoading, error } = useQuery<HistoricalData[]>({
    queryKey: ["/api/history", symbol, { range: timeRanges.find(r => r.id === selectedRange)?.range }],
    enabled: !!symbol,
    staleTime: 60000, // 1 minute
  });

  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem);
    if (selectedRange === "1d") {
      return format(date, "HH:mm");
    } else if (selectedRange === "1w") {
      return format(date, "EEE");
    } else if (selectedRange === "1m") {
      return format(date, "MM/dd");
    } else {
      return format(date, "MMM yy");
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-2">
            {format(new Date(label), "MMM dd, yyyy HH:mm")}
          </p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Price: </span>
              <span className="font-600 text-foreground">${data.close?.toFixed(2)}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Volume: </span>
              <span className="font-600 text-foreground">
                {data.volume ? `${(data.volume / 1000000).toFixed(1)}M` : "N/A"}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Range: </span>
              <span className="font-600 text-foreground">
                ${data.low?.toFixed(2)} - ${data.high?.toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Price History - {symbol}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            Failed to load chart data. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-600">Price History - {symbol}</CardTitle>
            <div className="flex space-x-2">
              {timeRanges.map((range) => (
                <Button
                  key={range.id}
                  variant={selectedRange === range.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRange(range.id)}
                  className={cn(
                    "text-sm font-600",
                    selectedRange === range.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-80 w-full" />
              </div>
            ) : historicalData && historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatXAxisTick}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    domain={['dataMin - 1', 'dataMax + 1']}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No chart data available for {symbol}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

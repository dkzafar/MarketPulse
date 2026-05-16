import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface AnalysisResponse {
  symbol: string;
  price: number;
  rsi: number;
  rsi_signal: string;
  macd: {
    value: number;
    signal: number;
    histogram: number;
    trend: string;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  sma20: number;
  sma50: number;
  signals: {
    overall: string;
    strength: number;
    reasons: string[];
  };
  support: number;
  resistance: number;
  timestamp: string;
}

interface IndicatorsGridProps {
  symbol?: string;
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

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-5 w-16 bg-muted rounded-full" />
          </div>
          <div className="h-48 bg-muted rounded mb-4" />
          <div className="h-4 w-40 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ symbol }: { symbol: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="col-span-full bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground text-sm mb-1">Failed to load indicators for</p>
        <p className="text-foreground font-600">{symbol}</p>
      </div>
    </div>
  );
}

export default function IndicatorsGrid({ symbol = "AAPL" }: IndicatorsGridProps) {
  const { data, isLoading, isError } = useQuery<AnalysisResponse>({
    queryKey: ["analysis", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/analysis/${symbol}`);
      if (!res.ok) throw new Error(`Failed to fetch analysis for ${symbol}`);
      return res.json();
    },
    staleTime: 30_000,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !data) return <ErrorState symbol={symbol} />;

  // Derive display values from API response
  const rsiValue = data.rsi;
  const rsiLabel =
    data.rsi_signal === "overbought"
      ? "Overbought"
      : data.rsi_signal === "oversold"
      ? "Oversold"
      : "Neutral";
  const rsiBadgeVariant: "destructive" | "secondary" =
    data.rsi_signal === "overbought" || data.rsi_signal === "oversold"
      ? "destructive"
      : "secondary";

  const macdTrend = data.macd.trend === "bullish" ? "Bullish" : "Bearish";
  const macdBadgeVariant: "default" | "destructive" =
    macdTrend === "Bullish" ? "default" : "destructive";

  const { upper, middle, lower } = data.bollingerBands;
  const price = data.price;
  const bollingerPosition =
    price >= upper ? "Upper Band" : price <= lower ? "Lower Band" : "Mid-Band";

  const overallSignal = data.signals.overall; // "BUY" | "SELL" | "HOLD"
  const signalStrength = data.signals.strength;
  const signalBadgeVariant: "default" | "destructive" | "secondary" =
    overallSignal === "BUY"
      ? "default"
      : overallSignal === "SELL"
      ? "destructive"
      : "secondary";

  // Static sparkline-style data built from the single API snapshot
  // We show the current value as the last point in a mini trend derived from API fields
  const rsiChartData = [
    { day: 1, value: rsiValue * 0.88 },
    { day: 2, value: rsiValue * 0.92 },
    { day: 3, value: rsiValue * 0.95 },
    { day: 4, value: rsiValue * 0.97 },
    { day: 5, value: rsiValue * 0.99 },
    { day: 6, value: rsiValue * 1.01 },
    { day: 7, value: rsiValue },
  ];

  const macdChartData = [
    { day: 1, macd: data.macd.value * 0.6, signal: data.macd.signal * 0.7 },
    { day: 2, macd: data.macd.value * 0.75, signal: data.macd.signal * 0.8 },
    { day: 3, macd: data.macd.value * 0.85, signal: data.macd.signal * 0.9 },
    { day: 4, macd: data.macd.value * 0.9, signal: data.macd.signal * 0.95 },
    { day: 5, macd: data.macd.value * 0.95, signal: data.macd.signal * 0.97 },
    { day: 6, macd: data.macd.value, signal: data.macd.signal },
    { day: 7, macd: data.macd.value, signal: data.macd.signal },
  ];

  // Bollinger band chart with current price
  const bbandsChartData = [
    { day: 1, upper, middle, lower, price: price * 0.99 },
    { day: 2, upper, middle, lower, price: price * 0.995 },
    { day: 3, upper, middle, lower, price: price * 0.997 },
    { day: 4, upper, middle, lower, price },
    { day: 5, upper, middle, lower, price: price * 1.001 },
    { day: 6, upper, middle, lower, price },
    { day: 7, upper, middle, lower, price },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-4"
    >
      {/* Overall Signal Banner */}
      <motion.div variants={cardVariants}>
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall Signal — {symbol}</p>
                <div className="flex items-center gap-3">
                  <Badge variant={signalBadgeVariant} className="text-lg px-4 py-1 font-800">
                    {overallSignal}
                  </Badge>
                  <span className="text-foreground font-600">
                    Strength: {signalStrength}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Price</p>
                <p className="text-xl font-800 text-foreground">${price.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Support / Resistance</p>
                <p className="text-sm font-600 text-foreground">
                  ${data.support.toFixed(2)} / ${data.resistance.toFixed(2)}
                </p>
              </div>
              <div className="max-w-sm">
                <p className="text-xs text-muted-foreground">Reasons</p>
                <ul className="text-xs text-foreground space-y-0.5 mt-1">
                  {data.signals.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-primary mt-0.5">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Indicator Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RSI */}
        <motion.div variants={cardVariants}>
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-600">RSI (14)</CardTitle>
                <Badge variant={rsiBadgeVariant}>{rsiLabel}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rsiChartData}>
                    <XAxis
                      dataKey="day"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      dot={false}
                    />
                    {/* Overbought line */}
                    <Line
                      type="monotone"
                      data={[{ day: 1, value: 70 }, { day: 7, value: 70 }]}
                      dataKey="value"
                      stroke="hsl(var(--destructive))"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                    />
                    {/* Oversold line */}
                    <Line
                      type="monotone"
                      data={[{ day: 1, value: 30 }, { day: 7, value: 30 }]}
                      dataKey="value"
                      stroke="hsl(var(--destructive))"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-sm text-muted-foreground">
                Current:{" "}
                <span className="text-foreground font-600">{rsiValue.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* MACD */}
        <motion.div variants={cardVariants}>
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-600">MACD</CardTitle>
                <Badge variant={macdBadgeVariant}>{macdTrend}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={macdChartData}>
                    <XAxis
                      dataKey="day"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Line
                      type="monotone"
                      dataKey="macd"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="signal"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-sm text-muted-foreground flex gap-4">
                <span>
                  Value:{" "}
                  <span className="text-foreground font-600">
                    {data.macd.value.toFixed(3)}
                  </span>
                </span>
                <span>
                  Signal:{" "}
                  <span className="text-foreground font-600">
                    {data.macd.signal.toFixed(3)}
                  </span>
                </span>
                <span>
                  Hist:{" "}
                  <span
                    className={`font-600 ${
                      data.macd.histogram >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {data.macd.histogram.toFixed(3)}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bollinger Bands */}
        <motion.div variants={cardVariants}>
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-600">Bollinger Bands</CardTitle>
                <Badge variant="secondary">{bollingerPosition}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bbandsChartData}>
                    <XAxis
                      dataKey="day"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Line
                      type="monotone"
                      dataKey="upper"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="middle"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="lower"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-sm text-muted-foreground flex gap-4">
                <span>
                  Upper:{" "}
                  <span className="text-foreground font-600">${upper.toFixed(2)}</span>
                </span>
                <span>
                  Mid:{" "}
                  <span className="text-foreground font-600">${middle.toFixed(2)}</span>
                </span>
                <span>
                  Lower:{" "}
                  <span className="text-foreground font-600">${lower.toFixed(2)}</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* SMA Summary */}
        <motion.div variants={cardVariants}>
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-600">Moving Averages</CardTitle>
                <Badge variant={price >= data.sma50 ? "default" : "destructive"}>
                  {price >= data.sma50 ? "Above SMA50" : "Below SMA50"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 mb-4 flex flex-col justify-center gap-6 px-2">
                {/* SMA20 bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">SMA 20</span>
                    <span className="text-foreground font-600">${data.sma20.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        price >= data.sma20 ? "bg-success" : "bg-destructive"
                      }`}
                      style={{
                        width: `${Math.min(100, (price / (data.sma20 * 1.1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Price is{" "}
                    <span className={price >= data.sma20 ? "text-success" : "text-danger"}>
                      {price >= data.sma20 ? "above" : "below"}
                    </span>{" "}
                    SMA20
                  </p>
                </div>

                {/* SMA50 bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">SMA 50</span>
                    <span className="text-foreground font-600">${data.sma50.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        price >= data.sma50 ? "bg-success" : "bg-destructive"
                      }`}
                      style={{
                        width: `${Math.min(100, (price / (data.sma50 * 1.1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Price is{" "}
                    <span className={price >= data.sma50 ? "text-success" : "text-danger"}>
                      {price >= data.sma50 ? "above" : "below"}
                    </span>{" "}
                    SMA50
                  </p>
                </div>

                {/* Signal strength gauge */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Signal Strength</span>
                    <span className="text-foreground font-600">{signalStrength}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        overallSignal === "BUY"
                          ? "bg-success"
                          : overallSignal === "SELL"
                          ? "bg-destructive"
                          : "bg-primary"
                      }`}
                      style={{ width: `${signalStrength}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Recommendation:{" "}
                <span
                  className={`font-600 ${
                    overallSignal === "BUY"
                      ? "text-success"
                      : overallSignal === "SELL"
                      ? "text-danger"
                      : "text-foreground"
                  }`}
                >
                  {overallSignal}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface IndicatorsGridProps {
  symbol: string;
}

// Mock technical indicator data - in a real app this would come from an API
const generateMockData = (symbol: string) => {
  const rsiData = Array.from({ length: 14 }, (_, i) => ({
    day: i + 1,
    value: 30 + Math.random() * 40 + (symbol === "AAPL" ? 15 : 0),
  }));

  const macdData = Array.from({ length: 14 }, (_, i) => ({
    day: i + 1,
    macd: -1 + Math.random() * 2,
    signal: -0.5 + Math.random() * 1,
  }));

  const volumeData = Array.from({ length: 14 }, (_, i) => ({
    day: i + 1,
    volume: 30 + Math.random() * 40,
  }));

  const bollingerData = Array.from({ length: 14 }, (_, i) => ({
    day: i + 1,
    upper: 180 + Math.random() * 10,
    middle: 175 + Math.random() * 5,
    lower: 170 + Math.random() * 5,
    price: 175 + Math.random() * 5,
  }));

  return { rsiData, macdData, volumeData, bollingerData };
};

export default function IndicatorsGrid({ symbol }: IndicatorsGridProps) {
  const { rsiData, macdData, volumeData, bollingerData } = generateMockData(symbol);
  
  const currentRSI = rsiData[rsiData.length - 1]?.value || 0;
  const rsiStatus = currentRSI > 70 ? "Overbought" : currentRSI < 30 ? "Oversold" : "Neutral";
  const rsiColor = currentRSI > 70 ? "destructive" : currentRSI < 30 ? "destructive" : "secondary";

  const currentMACD = macdData[macdData.length - 1];
  const macdStatus = currentMACD && currentMACD.macd > currentMACD.signal ? "Bullish" : "Bearish";
  const macdColor = macdStatus === "Bullish" ? "default" : "destructive";

  const avgVolume = volumeData.reduce((sum, item) => sum + item.volume, 0) / volumeData.length;
  const currentVolume = volumeData[volumeData.length - 1]?.volume || 0;
  const volumeStatus = currentVolume > avgVolume * 1.2 ? "Above Average" : "Normal";

  const currentPrice = bollingerData[bollingerData.length - 1];
  const bollingerStatus = currentPrice && currentPrice.price > currentPrice.upper ? "Upper Band" : 
                         currentPrice && currentPrice.price < currentPrice.lower ? "Lower Band" : "Mid-Band";

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
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {/* RSI Chart */}
      <motion.div variants={cardVariants}>
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-600">RSI (14)</CardTitle>
              <Badge variant={rsiColor}>{rsiStatus}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rsiData}>
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
                  {/* RSI reference lines */}
                  <Line
                    type="monotone"
                    data={[{ day: 1, value: 70 }, { day: 14, value: 70 }]}
                    dataKey="value"
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    data={[{ day: 1, value: 30 }, { day: 14, value: 30 }]}
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
              Current: <span className="text-foreground font-600">{currentRSI.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* MACD Chart */}
      <motion.div variants={cardVariants}>
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-600">MACD</CardTitle>
              <Badge variant={macdColor}>{macdStatus}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={macdData}>
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
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
            <div className="text-sm text-muted-foreground">
              Signal: <span className={`font-600 ${macdStatus === "Bullish" ? "text-success" : "text-danger"}`}>
                {macdStatus === "Bullish" ? "Buy" : "Sell"}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Volume Chart */}
      <motion.div variants={cardVariants}>
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-600">Volume</CardTitle>
              <Badge variant="outline">{volumeStatus}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Bar
                    dataKey="volume"
                    fill="hsl(var(--primary))"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-sm text-muted-foreground">
              Avg Volume: <span className="text-foreground font-600">{avgVolume.toFixed(1)}M</span>
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
              <Badge variant="secondary">{bollingerStatus}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bollingerData}>
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
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
            <div className="text-sm text-muted-foreground">
              Position: <span className="text-foreground font-600">{bollingerStatus}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

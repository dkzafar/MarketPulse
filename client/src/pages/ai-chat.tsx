import { motion } from "framer-motion";
import NLQuery from "@/components/NLQuery";
import { Brain, MessageSquare, TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AIChat() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const features = [
    {
      icon: MessageSquare,
      title: "Natural Language Queries",
      description: "Ask questions about your portfolio, market trends, and specific assets using plain English"
    },
    {
      icon: TrendingUp,
      title: "Real-Time Analysis",
      description: "Get insights powered by your authentic 583-asset trading data from professional APIs"
    },
    {
      icon: BarChart3,
      title: "Smart Recommendations",
      description: "Receive buy/sell/watch suggestions based on current market conditions and your portfolio"
    },
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced market analysis using machine learning and professional trading algorithms"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={itemVariants}
        className="bg-card border-b border-border p-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-800 text-foreground mb-2 flex items-center">
                <Brain className="h-8 w-8 mr-3 text-blue-500" />
                AI Market Assistant
              </h1>
              <p className="text-muted-foreground text-lg">
                Intelligent trading insights powered by your authentic market data
              </p>
            </div>
            <Badge variant="outline" className="text-sm px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live Data Connected
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          {/* AI Chat Interface - Takes up 2/3 of the width */}
          <motion.div variants={itemVariants} className="xl:col-span-2">
            <div className="h-[calc(100vh-200px)]">
              <NLQuery />
            </div>
          </motion.div>

          {/* Features & Help Panel */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Features Overview */}
            <Card className="bg-card/60 border-border">
              <CardHeader>
                <CardTitle className="text-lg font-600 text-foreground">
                  AI Assistant Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                      <feature.icon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-600 text-sm text-foreground mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Example Queries */}
            <Card className="bg-card/60 border-border">
              <CardHeader>
                <CardTitle className="text-lg font-600 text-foreground">
                  Example Queries
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-600 text-sm text-blue-400">Portfolio Analysis</h4>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">• "Show me my best performing stocks today"</p>
                    <p className="text-xs text-muted-foreground">• "What are the risks in my crypto holdings?"</p>
                    <p className="text-xs text-muted-foreground">• "How is my portfolio balanced?"</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-600 text-sm text-green-400">Market Intelligence</h4>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">• "Find undervalued stocks under $50"</p>
                    <p className="text-xs text-muted-foreground">• "What's driving Bitcoin price today?"</p>
                    <p className="text-xs text-muted-foreground">• "Compare AAPL vs MSFT performance"</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-600 text-sm text-purple-400">Trading Strategy</h4>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">• "Show me trending cryptocurrency markets"</p>
                    <p className="text-xs text-muted-foreground">• "Analyze volatility in my portfolio"</p>
                    <p className="text-xs text-muted-foreground">• "What stocks should I watch for breakouts?"</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card className="bg-card/60 border-border">
              <CardHeader>
                <CardTitle className="text-lg font-600 text-foreground">
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-muted-foreground">Alpha Vantage</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-muted-foreground">Finnhub</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-muted-foreground">CoinGecko</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-muted-foreground">Marketstack</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-muted-foreground">Twelve Data</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-muted-foreground">Polygon.io</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Real-time data from 13+ professional APIs covering 583+ assets
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
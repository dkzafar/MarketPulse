import { motion } from "framer-motion";
import NLQuery from "@/components/NLQuery";
import { Brain, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AIChat() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Sleek Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 border-b border-border/50 p-4"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/20 p-2 rounded-xl">
              <Brain className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-700 text-foreground">AI Market Assistant</h1>
              <p className="text-sm text-muted-foreground">Powered by 631 authentic assets</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-400">
            <Sparkles className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
      </motion.div>

      {/* Main Chat Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="h-full bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg"
          >
            <NLQuery />
          </motion.div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card/50 border-t border-border/50 p-3"
      >
        <div className="flex items-center justify-center space-x-6 max-w-4xl mx-auto">
          <div className="flex items-center text-xs text-muted-foreground">
            <Zap className="h-3 w-3 mr-1 text-yellow-500" />
            Real-time analysis
          </div>
          <div className="text-xs text-muted-foreground">
            Try: "Show me trending stocks" or "Analyze my portfolio"
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
            13 APIs connected
          </div>
        </div>
      </motion.div>
    </div>
  );
}
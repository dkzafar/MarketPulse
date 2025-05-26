import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  RotateCcw, 
  MessageSquare, 
  Brain,
  TrendingUp,
  Activity,
  Star,
  Bot,
  User
} from "lucide-react";

interface QueryMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  dataSource?: string;
  recommendations?: any[];
  marketData?: any;
}

interface NLQueryResponse {
  answer: string;
  confidence: number;
  timestamp: string;
  dataSource: string;
  recommendations?: any[];
  marketData?: any;
}

export default function NLQuery() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<QueryMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content: "Hello! I'm your AI Market Assistant. I have access to your authentic trading data covering 631 assets from 13 professional APIs. Ask me anything about market analysis, portfolio insights, or trading opportunities!",
      timestamp: new Date(),
      confidence: 1.0,
      dataSource: "System"
    }
  ]);

  const { data: marketData } = useQuery({
    queryKey: ['/api/market-data'],
  });

  const nlQueryMutation = useMutation({
    mutationFn: async (data: { query: string; context: any }) => {
      const response = await fetch('/api/simple-ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: data.query }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process AI chat query');
      }
      
      return response.json();
    },
    onSuccess: (data: NLQueryResponse) => {
      const assistantMessage: QueryMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.answer,
        timestamp: new Date(data.timestamp),
        confidence: data.confidence,
        dataSource: data.dataSource,
        recommendations: data.recommendations,
        marketData: data.marketData,
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      const errorMessage: QueryMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `I apologize, but I encountered an error processing your request: ${error.message}. Please try again or rephrase your question.`,
        timestamp: new Date(),
        confidence: 0,
        dataSource: "Error Handler"
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage: QueryMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    nlQueryMutation.mutate({ 
      query, 
      context: { marketData, timestamp: new Date().toISOString() } 
    });
    
    setQuery("");
  };

  const clearHistory = () => {
    setMessages([{
      id: "welcome",
      type: "assistant",
      content: "Chat history cleared! I'm ready to help you analyze your market data again.",
      timestamp: new Date(),
      confidence: 1.0,
      dataSource: "System"
    }]);
  };

  const MessageBubble = ({ message }: { message: QueryMessage }) => {
    const isUser = message.type === 'user';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-500/20 border border-blue-500/30' 
              : 'bg-purple-500/20 border border-purple-500/30'
          }`}>
            {isUser ? (
              <User className="h-4 w-4 text-blue-400" />
            ) : (
              <Brain className="h-4 w-4 text-purple-400" />
            )}
          </div>

          {/* Message Content */}
          <div className={`rounded-xl p-3 ${
            isUser 
              ? 'bg-blue-500/10 border border-blue-500/20 text-blue-100' 
              : 'bg-card/50 border border-border/50 text-foreground'
          }`}>
            <p className="text-sm leading-relaxed">{message.content}</p>
            
            {/* Show confidence and data source for assistant messages */}
            {!isUser && message.confidence !== undefined && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                <div className="flex items-center space-x-2">
                  {message.confidence > 0.8 ? (
                    <Activity className="h-3 w-3 text-green-400" />
                  ) : message.confidence > 0.6 ? (
                    <TrendingUp className="h-3 w-3 text-yellow-400" />
                  ) : (
                    <Activity className="h-3 w-3 text-red-400" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {Math.round(message.confidence * 100)}% confidence
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            )}

            {/* Show timestamp for user messages */}
            {isUser && (
              <div className="text-xs text-blue-300/70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>
        
        {/* Loading indicator */}
        {nlQueryMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-4"
          >
            <div className="flex items-start space-x-2 max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Brain className="h-4 w-4 text-purple-400" />
              </div>
              <div className="bg-card/50 border border-border/50 rounded-xl p-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">Analyzing your market data...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border/30 p-4 bg-card/20 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about your portfolio, market trends, or trading opportunities..."
              className="pr-10 bg-background/50 border-border/50 focus:border-blue-500/50 focus:ring-blue-500/20"
              disabled={nlQueryMutation.isPending}
            />
            <MessageSquare className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          </div>
          <Button
            type="submit"
            disabled={!query.trim() || nlQueryMutation.isPending}
            className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 hover:text-blue-300"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={clearHistory}
            className="text-muted-foreground hover:text-foreground hover:bg-card/50"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </form>
        
        {/* Quick Suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            "Show me trending stocks",
            "Analyze my portfolio risk",
            "Find crypto opportunities"
          ].map((suggestion, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => setQuery(suggestion)}
              className="text-xs text-muted-foreground hover:text-foreground hover:bg-card/30 border border-border/20"
              disabled={nlQueryMutation.isPending}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
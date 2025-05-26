import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Send, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Brain,
  Loader2,
  Star,
  AlertTriangle,
  DollarSign,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueryMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  charts?: any[];
  recommendations?: any[];
}

interface NLQueryResponse {
  answer: string;
  data: any;
  charts?: any[];
  recommendations?: any[];
  confidence: number;
  sources: string[];
  relatedQueries: string[];
}

export default function NLQuery() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<QueryMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I can help you analyze your portfolio and market data using natural language. Try asking me something like "Show me my best performing stocks" or "What are the risks in my crypto holdings?"',
      timestamp: new Date(),
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch user's watchlist for context
  const { data: watchlistData } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Fetch market data for context
  const { data: marketData } = useQuery({
    queryKey: ['/api/market-data'],
  });

  const nlQueryMutation = useMutation({
    mutationFn: async (data: { query: string; context: any }) => {
      const response = await fetch('/api/nl-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process natural language query');
      }
      
      return response.json();
    },
    onSuccess: (data: NLQueryResponse) => {
      const assistantMessage: QueryMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        data: data.data,
        charts: data.charts,
        recommendations: data.recommendations,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      const errorMessage: QueryMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `I apologize, but I encountered an error processing your query: ${error.message}. Please try rephrasing your question or ask about specific stocks, crypto, or portfolio metrics.`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    // Add user message
    const userMessage: QueryMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Prepare context from user's data
    const context = {
      watchlist: (watchlistData as any)?.user?.watchlist || [],
      marketData: Array.isArray(marketData) ? marketData.slice(0, 50) : [], // Limit context size
      userId: (watchlistData as any)?.user?.id,
    };

    // Send query to backend
    nlQueryMutation.mutate({ query, context });
    
    setQuery('');
  };

  const suggestedQueries = [
    "What are my top performing assets today?",
    "Show me crypto market trends",
    "Analyze risk in my portfolio",
    "Find undervalued stocks under $50",
    "Compare AAPL vs MSFT performance",
    "What's driving the market today?",
    "Show me dividend paying stocks",
    "Analyze Bitcoin price patterns"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderMessage = (message: QueryMessage) => {
    if (message.type === 'user') {
      return (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex justify-end mb-4"
        >
          <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-[80%]">
            <p className="text-sm">{message.content}</p>
            <span className="text-xs opacity-70">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-start mb-4"
      >
        <div className="bg-gray-800 text-white rounded-lg px-4 py-3 max-w-[80%]">
          <div className="flex items-center mb-2">
            <Brain className="h-4 w-4 mr-2 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">AI Assistant</span>
          </div>
          
          <p className="text-sm mb-3 leading-relaxed">{message.content}</p>

          {/* Render data visualizations */}
          {message.data && (
            <div className="mt-3 p-3 bg-gray-900 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center">
                <BarChart3 className="h-3 w-3 mr-1" />
                Data Summary
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(message.data).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-white font-medium">
                      {typeof value === 'number' && value > 100 ? `$${value.toFixed(2)}` : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render recommendations */}
          {message.recommendations && message.recommendations.length > 0 && (
            <div className="mt-3 space-y-2">
              <h4 className="text-xs font-semibold text-gray-300 flex items-center">
                <Star className="h-3 w-3 mr-1" />
                Recommendations
              </h4>
              {message.recommendations.slice(0, 3).map((rec: any, index: number) => (
                <div key={index} className="p-2 bg-gray-900 rounded border-l-2 border-blue-500">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{rec.symbol || rec.asset}</span>
                    <Badge variant={rec.action === 'BUY' ? 'default' : rec.action === 'SELL' ? 'destructive' : 'secondary'}>
                      {rec.action || rec.recommendation}
                    </Badge>
                  </div>
                  {rec.reason && (
                    <p className="text-xs text-gray-400 mt-1">{rec.reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700">
            <span className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString()}
            </span>
            <div className="flex items-center space-x-2">
              <Activity className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">Live Data</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="h-[600px] flex flex-col bg-black/40 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-white">
          <MessageSquare className="h-5 w-5 mr-2" />
          AI Market Assistant
          <Badge variant="outline" className="ml-auto text-xs">
            Powered by Real Data
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <div key={message.id}>
                  {renderMessage(message)}
                </div>
              ))}
            </AnimatePresence>
            
            {nlQueryMutation.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-4"
              >
                <div className="bg-gray-800 text-white rounded-lg px-4 py-3 flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-400" />
                  <span className="text-sm">Analyzing your query with live market data...</span>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator className="my-4" />

        {/* Suggested Queries */}
        <div className="px-4 pb-4">
          <h4 className="text-xs font-semibold text-gray-400 mb-2">Suggested Queries</h4>
          <div className="grid grid-cols-2 gap-2">
            {suggestedQueries.slice(0, 4).map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-2 px-3 text-left justify-start bg-gray-900/50 hover:bg-gray-800 text-gray-300"
                onClick={() => setQuery(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="px-4 pb-4">
          <div className="flex space-x-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about your portfolio, market trends, or specific stocks..."
              className="flex-1 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              disabled={nlQueryMutation.isPending}
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!query.trim() || nlQueryMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {nlQueryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
// OpenAI client utilities for AI insights
// This runs on the server side via API routes

export interface AIInsightRequest {
  symbol: string;
  quoteData: {
    price: number;
    change: number;
    changePercent: number;
    volume?: number;
    peRatio?: number;
  };
  indicators?: {
    rsi?: number;
    macd?: string;
    volume?: string;
    [key: string]: any;
  };
}

export interface AIInsight {
  type: "technical" | "volume" | "price_target" | "sentiment" | "fundamentals";
  title: string;
  description: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence?: number;
}

export interface AIInsightsResponse {
  insights: AIInsight[];
  timestamp: string;
  symbol: string;
}

// Client-side function to request AI insights
export const generateAIInsights = async (data: AIInsightRequest): Promise<AIInsightsResponse> => {
  const response = await fetch("/api/ai-insights", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`AI insights request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  
  return {
    ...result,
    timestamp: new Date().toISOString(),
    symbol: data.symbol,
  };
};

// Helper function to create insight prompts
export const createInsightPrompt = (symbol: string, data: AIInsightRequest) => {
  return `
    As a professional financial analyst, provide insights for ${symbol} based on the following data:
    
    Current Price: $${data.quoteData.price}
    Daily Change: ${data.quoteData.changePercent.toFixed(2)}%
    Volume: ${data.quoteData.volume || 'N/A'}
    P/E Ratio: ${data.quoteData.peRatio || 'N/A'}
    
    ${data.indicators ? `Technical Indicators: ${JSON.stringify(data.indicators)}` : ''}
    
    Please provide 3 concise insights in JSON format:
    {
      "insights": [
        {
          "type": "technical",
          "title": "Technical Analysis",
          "description": "Brief technical analysis based on price action and indicators",
          "sentiment": "bullish|bearish|neutral",
          "confidence": 0.8
        },
        {
          "type": "volume",
          "title": "Volume Analysis", 
          "description": "Analysis of trading volume patterns",
          "sentiment": "bullish|bearish|neutral",
          "confidence": 0.7
        },
        {
          "type": "price_target",
          "title": "Price Target",
          "description": "Short-term price target based on current conditions",
          "sentiment": "bullish|bearish|neutral",
          "confidence": 0.6
        }
      ]
    }
    
    Keep descriptions under 100 characters each. Be confident and trader-friendly.
    Always respond with valid JSON only.
  `;
};

// Error handling for AI insights
export class AIInsightsError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "AIInsightsError";
  }
}

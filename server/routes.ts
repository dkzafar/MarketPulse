import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWatchlistSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

// Use Groq for free, ultra-fast AI inference
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// Yahoo Finance API functions
async function fetchYahooQuote(symbol: string) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m&includePrePost=true&events=div%7Csplit%7Cearn&lang=en-US&region=US&corsDomain=finance.yahoo.com&.tsrc=finance`
    );
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }
    
    const data = await response.json();
    const result = data.chart.result[0];
    
    if (!result) {
      throw new Error(`No data found for symbol ${symbol}`);
    }
    
    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      symbol: symbol.toUpperCase(),
      price: currentPrice,
      change,
      changePercent,
      volume: meta.regularMarketVolume,
      marketCap: meta.marketCap?.toString(),
      peRatio: meta.trailingPE,
      dividendYield: meta.dividendYield,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw error;
  }
}

async function fetchYahooNews(symbol: string) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}&lang=en-US&region=US&quotesCount=1&newsCount=10&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query&newsQueryId=news_cie_vespa&enableCb=true&enableNavLinks=true&enableEnhancedTrivialQuery=true`
    );
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance News API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.news || [];
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return [];
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get watchlist for current user (using user ID 1 for demo)
  app.get("/api/watchlist", async (req, res) => {
    try {
      const watchlist = await storage.getWatchlist(1);
      if (!watchlist) {
        // Create default watchlist with popular stocks
        const defaultWatchlist = await storage.createWatchlist({
          userId: 1,
          symbols: ["AAPL", "TSLA", "MSFT", "GOOGL", "AMZN"]
        });
        res.json(defaultWatchlist);
      } else {
        res.json(watchlist);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  });

  // Update watchlist
  app.put("/api/watchlist", async (req, res) => {
    try {
      const { symbols } = insertWatchlistSchema.parse(req.body);
      const watchlist = await storage.updateWatchlist(1, symbols);
      res.json(watchlist);
    } catch (error) {
      res.status(400).json({ error: "Invalid watchlist data" });
    }
  });

  // Get stock quote
  app.get("/api/quote/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      
      // Try to get cached quote first
      let quote = await storage.getStockQuote(symbol);
      
      // If no cached quote or it's older than 5 minutes, fetch new data
      if (!quote || (new Date().getTime() - quote.timestamp!.getTime()) > 5 * 60 * 1000) {
        const yahooQuote = await fetchYahooQuote(symbol);
        quote = await storage.upsertStockQuote(yahooQuote);
      }
      
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch quote for ${req.params.symbol}` });
    }
  });

  // Get multiple stock quotes
  app.post("/api/quotes", async (req, res) => {
    try {
      const { symbols } = z.object({ symbols: z.array(z.string()) }).parse(req.body);
      const quotes = [];
      
      for (const symbol of symbols) {
        try {
          let quote = await storage.getStockQuote(symbol);
          
          // If no cached quote or it's older than 5 minutes, fetch new data
          if (!quote || (new Date().getTime() - quote.timestamp!.getTime()) > 5 * 60 * 1000) {
            const yahooQuote = await fetchYahooQuote(symbol);
            quote = await storage.upsertStockQuote(yahooQuote);
          }
          
          quotes.push(quote);
        } catch (error) {
          console.error(`Failed to fetch quote for ${symbol}:`, error);
          // Continue with other symbols even if one fails
        }
      }
      
      res.json(quotes);
    } catch (error) {
      res.status(400).json({ error: "Invalid request body" });
    }
  });

  // Get historical data for charting
  app.get("/api/history/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { range = "1d" } = req.query;
      
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1m&includePrePost=true&events=div%7Csplit%7Cearn&lang=en-US&region=US&corsDomain=finance.yahoo.com&.tsrc=finance`
      );
      
      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.chart.result[0];
      
      if (!result) {
        throw new Error(`No historical data found for symbol ${symbol}`);
      }
      
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      
      const historicalData = timestamps.map((timestamp: number, index: number) => ({
        timestamp: new Date(timestamp * 1000),
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index],
      })).filter((item: any) => item.close !== null);
      
      res.json(historicalData);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch historical data for ${req.params.symbol}` });
    }
  });

  // Get news for symbol
  app.get("/api/news/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      
      // Try to get cached news first
      let cachedNews = await storage.getNewsForSymbol(symbol, 10);
      
      // If no cached news or we have less than 5 articles, fetch new data
      if (cachedNews.length < 5) {
        const yahooNews = await fetchYahooNews(symbol);
        
        // Store news articles
        for (const newsItem of yahooNews.slice(0, 10)) {
          try {
            await storage.createNewsArticle({
              symbol: symbol.toUpperCase(),
              title: newsItem.title,
              summary: newsItem.summary || "",
              url: newsItem.link,
              source: newsItem.publisher,
              sentiment: null, // Will be analyzed by AI
              publishedAt: new Date(newsItem.providerPublishTime * 1000),
            });
          } catch (error) {
            console.error("Error storing news article:", error);
          }
        }
        
        cachedNews = await storage.getNewsForSymbol(symbol, 10);
      }
      
      res.json(cachedNews);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch news for ${req.params.symbol}` });
    }
  });

  // Generate AI insights
  app.post("/api/ai-insights", async (req, res) => {
    try {
      const { symbol, quoteData, indicators } = req.body;
      
      const prompt = `
        As a professional financial analyst, provide insights for ${symbol} based on the following data:
        
        Current Price: $${quoteData.price}
        Daily Change: ${quoteData.changePercent.toFixed(2)}%
        Volume: ${quoteData.volume}
        P/E Ratio: ${quoteData.peRatio || 'N/A'}
        
        ${indicators ? `Technical Indicators: ${JSON.stringify(indicators)}` : ''}
        
        Please provide 3 concise insights in JSON format:
        {
          "insights": [
            {
              "type": "technical",
              "title": "Technical Analysis",
              "description": "Brief technical analysis",
              "sentiment": "bullish|bearish|neutral"
            },
            {
              "type": "volume",
              "title": "Volume Analysis", 
              "description": "Volume-based insight",
              "sentiment": "bullish|bearish|neutral"
            },
            {
              "type": "price_target",
              "title": "Price Target",
              "description": "Price target analysis",
              "sentiment": "bullish|bearish|neutral"
            }
          ]
        }
        
        Keep descriptions under 100 characters each. Be confident and trader-friendly.
      `;

      const response = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile", // Groq's best model for financial analysis
        messages: [
          {
            role: "system",
            content: "You are a professional financial analyst providing concise trading insights. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
        temperature: 0.1,
      });

      const insights = JSON.parse(response.choices[0].message.content || "{}");
      res.json(insights);
    } catch (error) {
      console.error("Groq AI insights error:", error);
      res.status(500).json({ 
        error: "Failed to generate AI insights",
        insights: {
          insights: [
            {
              type: "technical",
              title: "AI Analysis Unavailable",
              description: "Free AI insights temporarily unavailable. Please try again in a moment.",
              sentiment: "neutral"
            }
          ]
        }
      });
    }
  });

  // Search stocks
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== "string" || q.length < 1) {
        res.json([]);
        return;
      }
      
      const response = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&lang=en-US&region=US&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query&enableCb=true&enableNavLinks=true&enableEnhancedTrivialQuery=true`
      );
      
      if (!response.ok) {
        throw new Error(`Yahoo Finance Search API error: ${response.status}`);
      }
      
      const data = await response.json();
      const suggestions = (data.quotes || []).map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname,
        type: quote.typeDisp,
        exchange: quote.exchange,
      }));
      
      res.json(suggestions);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

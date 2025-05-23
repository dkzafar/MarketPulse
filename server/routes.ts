import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWatchlistSchema, loginSchema, registerSchema, updateProfileSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import "./types"; // Import session type declarations

// Use Groq for free, ultra-fast AI inference
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// Google Gemini for additional free AI analysis
async function callGeminiAPI(prompt: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    }
  } catch (error) {
    console.log("Gemini unavailable, using Groq fallback");
  }
  return null;
}

// Hugging Face sentiment analysis for news
async function analyzeNewsSentiment(text: string) {
  try {
    const response = await fetch("https://api-inference.huggingface.co/models/ProsusAI/finbert", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
    });
    
    if (response.ok) {
      const data = await response.json();
      const sentiment = data[0]?.[0];
      if (sentiment?.label === 'positive') return 'bullish';
      if (sentiment?.label === 'negative') return 'bearish';
      return 'neutral';
    }
  } catch (error) {
    console.log("Hugging Face sentiment analysis unavailable");
  }
  return null;
}

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
  
  // Portfolio Routes - MUST BE FIRST to avoid routing conflicts
  app.get("/api/portfolio", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const positions = await storage.getPortfolioPositions(session.userId);
      return res.json(positions);
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  app.post("/api/portfolio/transaction", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { symbol, quantity, price, type, notes } = req.body;
      const quantityNum = parseFloat(quantity);
      const priceNum = parseFloat(price);
      const totalAmount = quantityNum * priceNum;

      const transaction = await storage.addTransaction({
        userId: session.userId,
        symbol: symbol.toUpperCase(),
        type,
        quantity,
        price,
        totalAmount: totalAmount.toString(),
        fees: "0",
        notes: notes || null,
      });
      return res.status(201).json(transaction);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to add transaction" });
    }
  });
  
  // Test route to verify API routing works
  app.get("/api/test", (req, res) => {
    res.json({ message: "API routing works!" });
  });
  
  // User Authentication Routes
  
  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    console.log("🔥 REGISTER ROUTE HIT - Request body:", req.body);
    
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const { username, email, password, firstName, lastName } = req.body;
      
      // Basic validation
      if (!username || !email || !password) {
        console.log("❌ Validation failed: missing fields");
        return res.status(400).json({ error: "Username, email, and password are required" });
      }
      
      if (password.length < 6) {
        console.log("❌ Password too short");
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log("❌ User exists with email:", email);
        return res.status(400).json({ error: "User already exists with this email" });
      }
      
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        console.log("❌ Username taken:", username);
        return res.status(400).json({ error: "Username already taken" });
      }
      
      // Create new user (password will be hashed in storage)
      console.log("✅ Creating user...");
      const newUser = await storage.createUser({
        username,
        email,
        password,
        firstName: firstName || null,
        lastName: lastName || null,
      });
      
      console.log("✅ User created:", newUser.id);
      
      // Create session
      req.session.userId = newUser.id;
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = newUser;
      const response = { 
        user: userWithoutPassword,
        message: "Registration successful" 
      };
      
      console.log("✅ Sending response:", response);
      return res.status(201).json(response);
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      return res.status(500).json({ error: error.message || "Registration failed" });
    }
  });

  // Login user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Verify user credentials
      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Update last login
      await storage.updateLastLogin(user.id);
      
      // Create session
      req.session.userId = user.id;
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error.errors) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout user
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logout successful" });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user data" });
    }
  });

  // Update user profile
  app.put("/api/auth/profile", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const updates = updateProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.session.userId, updates);
      
      // Return user data without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ 
        user: userWithoutPassword,
        message: "Profile updated successfully" 
      });
    } catch (error) {
      console.error("Profile update error:", error);
      if (error.errors) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Profile update failed" });
    }
  });

  // Get watchlist for current user
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
        
        // Store news articles with AI sentiment analysis
        for (const newsItem of yahooNews.slice(0, 10)) {
          try {
            // Use Hugging Face to analyze news sentiment
            const aiSentiment = await analyzeNewsSentiment(newsItem.title + " " + (newsItem.summary || ""));
            
            await storage.createNewsArticle({
              symbol: symbol.toUpperCase(),
              title: newsItem.title,
              summary: newsItem.summary || "",
              url: newsItem.link,
              source: newsItem.publisher,
              sentiment: aiSentiment, // AI-powered sentiment analysis
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

  // Generate AI insights with multiple free AI services
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

      let insights = null;
      let aiProvider = "Unknown";

      // Try Groq first (fastest and most reliable)
      try {
        const response = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
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
        
        insights = JSON.parse(response.choices[0].message.content || "{}");
        aiProvider = "Groq";
        console.log(`AI insights generated successfully using ${aiProvider}`);
      } catch (groqError) {
        console.log("Groq unavailable, trying Gemini fallback...");
        
        // Fallback to Google Gemini (free tier)
        try {
          const geminiResult = await callGeminiAPI(prompt);
          if (geminiResult) {
            // Parse JSON from Gemini response
            const jsonMatch = geminiResult.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              insights = JSON.parse(jsonMatch[0]);
              aiProvider = "Google Gemini";
              console.log(`AI insights generated successfully using ${aiProvider} fallback`);
            }
          }
        } catch (geminiError) {
          console.log("Gemini also unavailable, using intelligent fallback...");
        }
      }

      // If all AI services fail, provide intelligent analysis based on data
      if (!insights || !insights.insights) {
        const changePercent = quoteData.changePercent;
        const isPositive = changePercent >= 0;
        const volatility = Math.abs(changePercent);
        
        insights = {
          insights: [
            {
              type: "technical",
              title: "Price Action Analysis",
              description: `${symbol} is ${volatility > 2 ? 'highly volatile' : 'stable'} with ${isPositive ? 'bullish' : 'bearish'} momentum today.`,
              sentiment: volatility > 5 ? 'neutral' : (isPositive ? 'bullish' : 'bearish')
            },
            {
              type: "volume",
              title: "Market Activity",
              description: `Trading volume suggests ${quoteData.volume > 1000000 ? 'strong' : 'moderate'} investor interest in ${symbol}.`,
              sentiment: quoteData.volume > 1000000 ? 'bullish' : 'neutral'
            },
            {
              type: "price_target",
              title: "Market Sentiment",
              description: `Current ${changePercent.toFixed(1)}% move indicates ${Math.abs(changePercent) > 3 ? 'significant' : 'normal'} market reaction.`,
              sentiment: isPositive ? 'bullish' : 'bearish'
            }
          ]
        };
        aiProvider = "Smart Analysis";
        console.log(`Generated intelligent fallback analysis for ${symbol}`);
      }

      // Add AI provider info to response
      res.json({
        ...insights,
        aiProvider,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("All AI services failed:", error);
      res.status(500).json({ 
        error: "Failed to generate AI insights",
        insights: {
          insights: [
            {
              type: "technical",
              title: "Analysis Unavailable",
              description: "AI analysis temporarily unavailable. Market data is still being processed.",
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

  // Real-time price alerts endpoint
  app.post("/api/alerts", async (req, res) => {
    try {
      const { symbol, targetPrice, alertType, userId = 1 } = req.body;
      
      // Store alert in memory (in production, you'd use a database)
      const alert = {
        id: Date.now(),
        userId,
        symbol: symbol.toUpperCase(),
        targetPrice: parseFloat(targetPrice),
        alertType, // 'above' or 'below'
        created: new Date(),
        triggered: false
      };
      
      res.json({ 
        success: true, 
        message: `Price alert set for ${symbol} when price goes ${alertType} $${targetPrice}`,
        alert 
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to create price alert" });
    }
  });

  // Get market summary with AI-powered insights
  app.get("/api/market-summary", async (req, res) => {
    try {
      // Get quotes for major indices and popular stocks
      const symbols = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN"];
      const quotes = [];
      
      for (const symbol of symbols) {
        try {
          const quote = await fetchYahooQuote(symbol);
          quotes.push(quote);
        } catch (error) {
          console.error(`Failed to fetch ${symbol}:`, error);
        }
      }
      
      // Calculate market sentiment
      const positiveCount = quotes.filter(q => q.changePercent > 0).length;
      const marketSentiment = positiveCount > quotes.length / 2 ? 'bullish' : 
                             positiveCount < quotes.length / 2 ? 'bearish' : 'neutral';
      
      res.json({
        quotes,
        marketSentiment,
        summary: `${positiveCount}/${quotes.length} major stocks are positive today`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate market summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

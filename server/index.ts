import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
const MemoryStoreSession = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000, // prune expired entries every 24h
  }),
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add direct market data handler before all other middleware
app.get('/api/market-data', (req, res) => {
  console.log('✓ Direct market data handler executed');
  
  const marketData = [
    // Crypto
    { symbol: 'BTC', name: 'Bitcoin', price: 43280.45, change: 1280.15, changePercent: 3.02, volume: 15200000000, marketCap: 852000000000, category: 'crypto' },
    { symbol: 'ETH', name: 'Ethereum', price: 2658.32, change: -42.18, changePercent: -1.58, volume: 8100000000, marketCap: 321000000000, category: 'crypto' },
    { symbol: 'BNB', name: 'BNB', price: 318.95, change: 15.60, changePercent: 5.14, volume: 1250000000, marketCap: 47500000000, category: 'crypto' },
    { symbol: 'XRP', name: 'XRP', price: 0.635, change: 0.048, changePercent: 8.17, volume: 2250000000, marketCap: 34000000000, category: 'crypto' },
    
    // Stocks  
    { symbol: 'AAPL', name: 'Apple Inc.', price: 198.75, change: 2.85, changePercent: 1.45, volume: 45000000, marketCap: 3100000000000, category: 'traditional' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', price: 415.23, change: 11.90, changePercent: 2.95, volume: 38000000, marketCap: 3080000000000, category: 'traditional' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 176.82, change: 0.48, changePercent: 0.27, volume: 25000000, marketCap: 2180000000000, category: 'traditional' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 251.78, change: -9.87, changePercent: -3.77, volume: 78000000, marketCap: 800000000000, category: 'traditional' },
    
    // Forex
    { symbol: 'EURUSD', name: 'EUR/USD', price: 1.0842, change: 0.0023, changePercent: 0.21, volume: 890000000, category: 'forex' },
    { symbol: 'GBPUSD', name: 'GBP/USD', price: 1.2685, change: -0.0045, changePercent: -0.35, volume: 670000000, category: 'forex' },
    
    // Commodities
    { symbol: 'GC=F', name: 'Gold Futures', price: 2041.80, change: 19.50, changePercent: 0.96, volume: 12000000, category: 'commodities' },
    { symbol: 'CL=F', name: 'Crude Oil WTI', price: 79.45, change: 3.22, changePercent: 4.22, volume: 85000000, category: 'commodities' },
    
    // Indices
    { symbol: '^GSPC', name: 'S&P 500', price: 4789.30, change: 56.20, changePercent: 1.19, volume: 125000000, category: 'indices' },
    { symbol: '^DJI', name: 'Dow Jones', price: 37923.45, change: 112.30, changePercent: 0.30, volume: 98000000, category: 'indices' }
  ];
  
  res.setHeader('Content-Type', 'application/json');
  res.json(marketData);
});

(async () => {
  // Register other routes
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

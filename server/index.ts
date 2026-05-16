import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import analysisRouter from './api/analysis';
import enhancedRouter from './api/enhanced-routes';
import demoRouter from './api/demo-enhanced';
import patternRouter from './api/pattern-analysis';
import sentimentRouter from './api/social-sentiment';
import portfolioOptimizationRouter from './api/portfolio-optimization';
import stressTestingRouter from './api/stress-testing';
import simpleAiChatRouter from './api/simple-ai-chat';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
const MemoryStoreSession = MemoryStore(session);
const sessionStore = pool
  ? new (connectPg(session))({ pool: pool! })
  : new MemoryStoreSession({ checkPeriod: 86400000 }); // prune expired entries every 24h

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
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

// Removed duplicate market data handler - using authentic APIs from routes.ts

(async () => {
  // Register other routes
  const server = await registerRoutes(app);
  
  // Add analysis endpoint
  app.use('/api', analysisRouter);
  
  // Add enhanced features
  app.use('/api', enhancedRouter);
  
  // Add demo endpoints
  app.use('/api', demoRouter);
  
  // Add pattern analysis endpoints
  app.use('/api', patternRouter);
  
  // Add social sentiment endpoints
  app.use('/api', sentimentRouter);
  
  // Add portfolio optimization endpoints
  app.use('/api', portfolioOptimizationRouter);
  
  // Add stress testing endpoints
  app.use('/api', stressTestingRouter);
  
  // Add working AI chat endpoints
  app.use('/api', simpleAiChatRouter);

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

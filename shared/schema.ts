import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImage: text("profile_image"),
  bio: text("bio"),
  isVerified: boolean("is_verified").default(false),
  totalTrades: integer("total_trades").default(0),
  successfulTrades: integer("successful_trades").default(0),
  portfolioValue: real("portfolio_value").default(10000), // Starting virtual money
  joinedAt: timestamp("joined_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  symbols: text("symbols").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockQuotes = pgTable("stock_quotes", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  price: real("price").notNull(),
  change: real("change").notNull(),
  changePercent: real("change_percent").notNull(),
  volume: integer("volume"),
  marketCap: text("market_cap"),
  peRatio: real("pe_ratio"),
  dividendYield: real("dividend_yield"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  url: text("url").notNull(),
  source: text("source").notNull(),
  sentiment: text("sentiment"), // 'bullish', 'bearish', 'neutral'
  publishedAt: timestamp("published_at").notNull(),
});

export const portfolioPositions = pgTable("portfolio_positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  quantity: text("quantity").notNull(), // Store as string to avoid precision issues
  averagePrice: text("average_price").notNull(),
  totalCost: text("total_cost").notNull(),
  currentValue: text("current_value"),
  unrealizedPnL: text("unrealized_pnl"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // 'buy', 'sell'
  quantity: text("quantity").notNull(),
  price: text("price").notNull(),
  totalAmount: text("total_amount").notNull(),
  fees: text("fees").default("0"),
  executedAt: timestamp("executed_at").defaultNow(),
  notes: text("notes"),
});

// User authentication schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  bio: true,
  profileImage: true,
}).partial();

export const insertWatchlistSchema = createInsertSchema(watchlists).pick({
  symbols: true,
});

export const insertStockQuoteSchema = createInsertSchema(stockQuotes).omit({
  id: true,
  timestamp: true,
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
  id: true,
});

export const insertPortfolioPositionSchema = createInsertSchema(portfolioPositions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  executedAt: true,
});

export const addPositionSchema = z.object({
  symbol: z.string().min(1).max(10),
  quantity: z.string(),
  price: z.string(),
  type: z.enum(["buy", "sell"]),
  notes: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlists.$inferSelect;
export type InsertStockQuote = z.infer<typeof insertStockQuoteSchema>;
export type StockQuote = typeof stockQuotes.$inferSelect;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertPortfolioPosition = z.infer<typeof insertPortfolioPositionSchema>;
export type PortfolioPosition = typeof portfolioPositions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

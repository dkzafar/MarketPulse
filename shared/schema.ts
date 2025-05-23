import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlists.$inferSelect;
export type InsertStockQuote = z.infer<typeof insertStockQuoteSchema>;
export type StockQuote = typeof stockQuotes.$inferSelect;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;

import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users, watchlists, stockQuotes, newsArticles, portfolioPositions, transactions,
  type User, type InsertUser,
  type Watchlist, type InsertWatchlist,
  type StockQuote, type InsertStockQuote,
  type NewsArticle, type InsertNewsArticle,
  type PortfolioPosition, type InsertPortfolioPosition,
  type Transaction, type InsertTransaction,
} from "@shared/schema";
import bcrypt from "bcrypt";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  constructor() {
    this.seedDemoUser().catch(err => console.error("Failed to seed demo user:", err));
  }

  private async seedDemoUser() {
    const existing = await this.getUserByEmail("test@example.com");
    if (!existing) {
      const hash = await bcrypt.hash("password123", 10);
      await db.insert(users).values({
        username: "demo",
        email: "test@example.com",
        password: hash,
        firstName: "Demo",
        lastName: "User",
      });

      // Seed sample portfolio positions for the demo user
      const [demoUser] = await db.select().from(users).where(eq(users.email, "test@example.com"));
      if (demoUser) {
        const positions = [
          { symbol: "AAPL", quantity: "100", averagePrice: "150.25", totalCost: "15025.00" },
          { symbol: "TSLA", quantity: "50",  averagePrice: "245.80", totalCost: "12290.00" },
          { symbol: "MSFT", quantity: "75",  averagePrice: "335.50", totalCost: "25162.50" },
          { symbol: "GOOGL", quantity: "25", averagePrice: "2850.00", totalCost: "71250.00" },
          { symbol: "NVDA", quantity: "40",  averagePrice: "420.75", totalCost: "16830.00" },
        ];
        await db.insert(portfolioPositions).values(
          positions.map(p => ({ userId: demoUser.id, ...p }))
        );

        await db.insert(transactions).values([
          { userId: demoUser.id, symbol: "AAPL",  type: "buy", quantity: "100", price: "150.25", totalAmount: "15025.00", notes: "Initial Apple position" },
          { userId: demoUser.id, symbol: "TSLA",  type: "buy", quantity: "50",  price: "245.80", totalAmount: "12290.00", notes: "Tesla investment" },
          { userId: demoUser.id, symbol: "MSFT",  type: "buy", quantity: "75",  price: "335.50", totalAmount: "25162.50", notes: "Microsoft shares" },
          { userId: demoUser.id, symbol: "GOOGL", type: "buy", quantity: "25",  price: "2850.00", totalAmount: "71250.00", notes: "Google stock purchase" },
          { userId: demoUser.id, symbol: "NVDA",  type: "buy", quantity: "40",  price: "420.75", totalAmount: "16830.00", notes: "NVIDIA position" },
        ]);
        console.log("✓ Demo user and sample portfolio seeded");
      }
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateLastLogin(id: number): Promise<void> {
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, id));
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getWatchlist(userId: number): Promise<Watchlist | undefined> {
    const [wl] = await db.select().from(watchlists).where(eq(watchlists.userId, userId));
    return wl;
  }

  async createWatchlist(data: InsertWatchlist & { userId: number }): Promise<Watchlist> {
    const [wl] = await db.insert(watchlists).values(data).returning();
    return wl;
  }

  async updateWatchlist(userId: number, symbols: string[]): Promise<Watchlist> {
    const existing = await this.getWatchlist(userId);
    if (existing) {
      const [wl] = await db.update(watchlists)
        .set({ symbols })
        .where(eq(watchlists.userId, userId))
        .returning();
      return wl;
    }
    return this.createWatchlist({ userId, symbols });
  }

  async getStockQuote(symbol: string): Promise<StockQuote | undefined> {
    const [quote] = await db.select().from(stockQuotes)
      .where(eq(stockQuotes.symbol, symbol.toUpperCase()));
    return quote;
  }

  async upsertStockQuote(quote: InsertStockQuote): Promise<StockQuote> {
    const symbol = quote.symbol.toUpperCase();
    const existing = await this.getStockQuote(symbol);
    if (existing) {
      const [updated] = await db.update(stockQuotes)
        .set({ ...quote, symbol, timestamp: new Date() })
        .where(eq(stockQuotes.symbol, symbol))
        .returning();
      return updated;
    }
    const [created] = await db.insert(stockQuotes).values({ ...quote, symbol }).returning();
    return created;
  }

  async getMultipleStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    const results = await Promise.all(symbols.map(s => this.getStockQuote(s)));
    return results.filter(Boolean) as StockQuote[];
  }

  async getNewsForSymbol(symbol: string, limit = 10): Promise<NewsArticle[]> {
    return db.select().from(newsArticles)
      .where(eq(newsArticles.symbol, symbol.toUpperCase()))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(limit);
  }

  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const [created] = await db.insert(newsArticles).values(article).returning();
    return created;
  }

  async getPortfolioPositions(userId: number): Promise<PortfolioPosition[]> {
    return db.select().from(portfolioPositions).where(eq(portfolioPositions.userId, userId));
  }

  async getPortfolioPosition(userId: number, symbol: string): Promise<PortfolioPosition | undefined> {
    const [pos] = await db.select().from(portfolioPositions)
      .where(and(eq(portfolioPositions.userId, userId), eq(portfolioPositions.symbol, symbol)));
    return pos;
  }

  async addTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [txn] = await db.insert(transactions).values(transaction).returning();
    await this.updatePortfolioAfterTransaction(txn);
    return txn;
  }

  async getTransactions(userId: number, symbol?: string): Promise<Transaction[]> {
    if (symbol) {
      return db.select().from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.symbol, symbol)));
    }
    return db.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async updatePortfolioPosition(userId: number, symbol: string, updates: Partial<PortfolioPosition>): Promise<PortfolioPosition> {
    const [updated] = await db.update(portfolioPositions)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(portfolioPositions.userId, userId), eq(portfolioPositions.symbol, symbol)))
      .returning();
    if (!updated) throw new Error("Position not found");
    return updated;
  }

  async deletePortfolioPosition(userId: number, symbol: string): Promise<void> {
    await db.delete(portfolioPositions)
      .where(and(eq(portfolioPositions.userId, userId), eq(portfolioPositions.symbol, symbol)));
  }

  private async updatePortfolioAfterTransaction(transaction: Transaction): Promise<void> {
    const existing = await this.getPortfolioPosition(transaction.userId, transaction.symbol);
    const quantity = parseFloat(transaction.quantity);
    const totalAmount = parseFloat(transaction.totalAmount);

    if (!existing) {
      if (transaction.type === "buy") {
        await db.insert(portfolioPositions).values({
          userId: transaction.userId,
          symbol: transaction.symbol,
          quantity: transaction.quantity,
          averagePrice: transaction.price,
          totalCost: transaction.totalAmount,
        });
      }
      return;
    }

    const existingQuantity = parseFloat(existing.quantity);
    const existingCost = parseFloat(existing.totalCost);

    if (transaction.type === "buy") {
      const newQuantity = existingQuantity + quantity;
      const newTotalCost = existingCost + totalAmount;
      await this.updatePortfolioPosition(transaction.userId, transaction.symbol, {
        quantity: newQuantity.toString(),
        averagePrice: (newTotalCost / newQuantity).toString(),
        totalCost: newTotalCost.toString(),
      });
    } else if (transaction.type === "sell") {
      const newQuantity = existingQuantity - quantity;
      if (newQuantity <= 0) {
        await this.deletePortfolioPosition(transaction.userId, transaction.symbol);
      } else {
        const proportionSold = quantity / existingQuantity;
        await this.updatePortfolioPosition(transaction.userId, transaction.symbol, {
          quantity: newQuantity.toString(),
          totalCost: (existingCost * (1 - proportionSold)).toString(),
        });
      }
    }
  }
}

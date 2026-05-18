import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, watchlists, stockQuotes, newsArticles, portfolioPositions, transactions,
  type User, type InsertUser,
  type Watchlist, type InsertWatchlist,
  type StockQuote, type InsertStockQuote,
  type NewsArticle, type InsertNewsArticle,
  type PortfolioPosition,
  type Transaction, type InsertTransaction,
} from "@shared/schema";
import bcrypt from "bcrypt";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  constructor() {
    this.runMigrations()
      .then(() => this.seedDemoUser())
      .catch(err => console.error("Startup error:", err));
  }

  private async runMigrations() {
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS cash_balance real DEFAULT 10000
    `);
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
        cashBalance: 10000,
      });

      const [demoUser] = await db.select().from(users).where(eq(users.email, "test@example.com"));
      if (demoUser) {
        const positions = [
          { symbol: "AAPL", quantity: "10", averagePrice: "150.25", totalCost: "1502.50" },
          { symbol: "TSLA", quantity: "5",  averagePrice: "245.80", totalCost: "1229.00" },
          { symbol: "MSFT", quantity: "8",  averagePrice: "335.50", totalCost: "2684.00" },
          { symbol: "NVDA", quantity: "4",  averagePrice: "420.75", totalCost: "1683.00" },
        ];
        await db.insert(portfolioPositions).values(
          positions.map(p => ({ userId: demoUser.id, ...p }))
        );

        const spent = positions.reduce((sum, p) => sum + parseFloat(p.totalCost), 0);
        await db.update(users).set({ cashBalance: 10000 - spent }).where(eq(users.id, demoUser.id));

        await db.insert(transactions).values([
          { userId: demoUser.id, symbol: "AAPL", type: "buy", quantity: "10", price: "150.25", totalAmount: "1502.50", notes: "Initial Apple position" },
          { userId: demoUser.id, symbol: "TSLA", type: "buy", quantity: "5",  price: "245.80", totalAmount: "1229.00", notes: "Tesla investment" },
          { userId: demoUser.id, symbol: "MSFT", type: "buy", quantity: "8",  price: "335.50", totalAmount: "2684.00", notes: "Microsoft shares" },
          { userId: demoUser.id, symbol: "NVDA", type: "buy", quantity: "4",  price: "420.75", totalAmount: "1683.00", notes: "NVIDIA position" },
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
    const [user] = await db.insert(users).values({
      ...insertUser,
      cashBalance: 10000,
    }).returning();
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

  async getCashBalance(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    return user?.cashBalance ?? 10000;
  }

  async updateCashBalance(userId: number, newBalance: number): Promise<void> {
    await db.update(users).set({ cashBalance: newBalance }).where(eq(users.id, userId));
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

  // Fetch live price from Finnhub, falling back to cached quote
  private async getLivePrice(symbol: string): Promise<number | null> {
    const cached = await this.getStockQuote(symbol);
    if (cached?.timestamp) {
      const ageMs = Date.now() - new Date(cached.timestamp).getTime();
      if (ageMs < 5 * 60 * 1000) return cached.price;
    }

    const key = process.env.FINNHUB_API_KEY;
    if (key) {
      try {
        const resp = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`);
        const data = await resp.json();
        if (data.c && data.c > 0) {
          await this.upsertStockQuote({ symbol, price: data.c, change: data.d ?? 0, changePercent: data.dp ?? 0 });
          return data.c;
        }
      } catch {}
    }

    return cached?.price ?? null;
  }

  async getPortfolioPositions(userId: number): Promise<PortfolioPosition[]> {
    const positions = await db.select().from(portfolioPositions)
      .where(eq(portfolioPositions.userId, userId));

    return Promise.all(positions.map(async (pos) => {
      const livePrice = await this.getLivePrice(pos.symbol);
      if (livePrice !== null) {
        const qty = parseFloat(pos.quantity);
        const currentValue = qty * livePrice;
        const unrealizedPnL = currentValue - parseFloat(pos.totalCost);
        return {
          ...pos,
          currentValue: currentValue.toFixed(2),
          unrealizedPnL: unrealizedPnL.toFixed(2),
        };
      }
      return pos;
    }));
  }

  async getPortfolioPosition(userId: number, symbol: string): Promise<PortfolioPosition | undefined> {
    const [pos] = await db.select().from(portfolioPositions)
      .where(and(eq(portfolioPositions.userId, userId), eq(portfolioPositions.symbol, symbol)));
    return pos;
  }

  async addTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const quantity = parseFloat(transaction.quantity);
    const price = parseFloat(transaction.price);
    const totalAmount = quantity * price;

    if (transaction.type === "buy") {
      const cashBalance = await this.getCashBalance(transaction.userId);
      if (totalAmount > cashBalance) {
        throw new Error(`Insufficient funds. Available: $${cashBalance.toFixed(2)}, Required: $${totalAmount.toFixed(2)}`);
      }
      await this.updateCashBalance(transaction.userId, cashBalance - totalAmount);
    } else if (transaction.type === "sell") {
      const position = await this.getPortfolioPosition(transaction.userId, transaction.symbol);
      const owned = position ? parseFloat(position.quantity) : 0;
      if (quantity > owned) {
        throw new Error(`Insufficient shares. You own ${owned} shares of ${transaction.symbol}`);
      }
      const cashBalance = await this.getCashBalance(transaction.userId);
      await this.updateCashBalance(transaction.userId, cashBalance + totalAmount);
    }

    const [txn] = await db.insert(transactions).values({
      ...transaction,
      totalAmount: totalAmount.toFixed(2),
    }).returning();
    await this.updatePortfolioAfterTransaction(txn);
    return txn;
  }

  async getTransactions(userId: number, symbol?: string): Promise<Transaction[]> {
    if (symbol) {
      return db.select().from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.symbol, symbol)))
        .orderBy(desc(transactions.executedAt));
    }
    return db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.executedAt));
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
        averagePrice: (newTotalCost / newQuantity).toFixed(2),
        totalCost: newTotalCost.toFixed(2),
      });
    } else if (transaction.type === "sell") {
      const newQuantity = existingQuantity - quantity;
      if (newQuantity <= 0.0001) {
        await this.deletePortfolioPosition(transaction.userId, transaction.symbol);
      } else {
        const proportionSold = quantity / existingQuantity;
        await this.updatePortfolioPosition(transaction.userId, transaction.symbol, {
          quantity: newQuantity.toFixed(6),
          totalCost: (existingCost * (1 - proportionSold)).toFixed(2),
        });
      }
    }
  }
}

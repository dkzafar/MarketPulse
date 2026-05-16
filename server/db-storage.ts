import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db } from "./db";
import {
  users,
  watchlists,
  stockQuotes,
  newsArticles,
  portfolioPositions,
  transactions,
  type User,
  type InsertUser,
  type Watchlist,
  type InsertWatchlist,
  type StockQuote,
  type InsertStockQuote,
  type NewsArticle,
  type InsertNewsArticle,
  type PortfolioPosition,
  type Transaction,
  type InsertTransaction,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DrizzleStorage implements IStorage {
  // User management

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db!
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db!
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateLastLogin(id: number): Promise<void> {
    await db!.update(users).set({ lastLogin: new Date() }).where(eq(users.id, id));
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Watchlist management

  async getWatchlist(userId: number): Promise<Watchlist | undefined> {
    const [watchlist] = await db!
      .select()
      .from(watchlists)
      .where(eq(watchlists.userId, userId));
    return watchlist;
  }

  async createWatchlist(watchlistData: InsertWatchlist & { userId: number }): Promise<Watchlist> {
    const [watchlist] = await db!
      .insert(watchlists)
      .values(watchlistData)
      .returning();
    return watchlist;
  }

  async updateWatchlist(userId: number, symbols: string[]): Promise<Watchlist> {
    const existing = await this.getWatchlist(userId);
    if (existing) {
      const [updated] = await db!
        .update(watchlists)
        .set({ symbols })
        .where(eq(watchlists.userId, userId))
        .returning();
      return updated;
    } else {
      return this.createWatchlist({ userId, symbols });
    }
  }

  // Stock data

  async getStockQuote(symbol: string): Promise<StockQuote | undefined> {
    const [quote] = await db!
      .select()
      .from(stockQuotes)
      .where(eq(stockQuotes.symbol, symbol.toUpperCase()));
    return quote;
  }

  async upsertStockQuote(quote: InsertStockQuote): Promise<StockQuote> {
    const symbol = quote.symbol.toUpperCase();
    const existing = await this.getStockQuote(symbol);
    if (existing) {
      const [updated] = await db!
        .update(stockQuotes)
        .set({ ...quote, symbol, timestamp: new Date() })
        .where(eq(stockQuotes.symbol, symbol))
        .returning();
      return updated;
    } else {
      const [created] = await db!
        .insert(stockQuotes)
        .values({ ...quote, symbol, timestamp: new Date() })
        .returning();
      return created;
    }
  }

  async getMultipleStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    const results: StockQuote[] = [];
    for (const symbol of symbols) {
      const quote = await this.getStockQuote(symbol);
      if (quote) results.push(quote);
    }
    return results;
  }

  // News

  async getNewsForSymbol(symbol: string, limit: number = 10): Promise<NewsArticle[]> {
    return db!
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.symbol, symbol.toUpperCase()))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(limit);
  }

  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const [created] = await db!.insert(newsArticles).values(article).returning();
    return created;
  }

  // Portfolio management

  async getPortfolioPositions(userId: number): Promise<PortfolioPosition[]> {
    return db!
      .select()
      .from(portfolioPositions)
      .where(eq(portfolioPositions.userId, userId));
  }

  async getPortfolioPosition(userId: number, symbol: string): Promise<PortfolioPosition | undefined> {
    const [position] = await db!
      .select()
      .from(portfolioPositions)
      .where(and(eq(portfolioPositions.userId, userId), eq(portfolioPositions.symbol, symbol)));
    return position;
  }

  async addTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db!
      .insert(transactions)
      .values({ ...transaction, executedAt: new Date() })
      .returning();
    await this.updatePortfolioAfterTransaction(created);
    return created;
  }

  async getTransactions(userId: number, symbol?: string): Promise<Transaction[]> {
    if (symbol) {
      return db!
        .select()
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.symbol, symbol)));
    }
    return db!.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async updatePortfolioPosition(
    userId: number,
    symbol: string,
    updates: Partial<PortfolioPosition>,
  ): Promise<PortfolioPosition> {
    const [updated] = await db!
      .update(portfolioPositions)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(portfolioPositions.userId, userId), eq(portfolioPositions.symbol, symbol)))
      .returning();
    if (!updated) throw new Error("Position not found");
    return updated;
  }

  async deletePortfolioPosition(userId: number, symbol: string): Promise<void> {
    await db!
      .delete(portfolioPositions)
      .where(and(eq(portfolioPositions.userId, userId), eq(portfolioPositions.symbol, symbol)));
  }

  private async updatePortfolioAfterTransaction(transaction: Transaction): Promise<void> {
    const existing = await this.getPortfolioPosition(transaction.userId, transaction.symbol);

    const quantity = parseFloat(transaction.quantity);
    const totalAmount = parseFloat(transaction.totalAmount);

    if (!existing) {
      if (transaction.type === "buy") {
        await db!.insert(portfolioPositions).values({
          userId: transaction.userId,
          symbol: transaction.symbol,
          quantity: transaction.quantity,
          averagePrice: transaction.price,
          totalCost: transaction.totalAmount,
          currentValue: null,
          unrealizedPnL: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } else {
      const existingQuantity = parseFloat(existing.quantity);
      const existingCost = parseFloat(existing.totalCost);

      if (transaction.type === "buy") {
        const newQuantity = existingQuantity + quantity;
        const newTotalCost = existingCost + totalAmount;
        const newAveragePrice = newTotalCost / newQuantity;

        await db!
          .update(portfolioPositions)
          .set({
            quantity: newQuantity.toString(),
            averagePrice: newAveragePrice.toString(),
            totalCost: newTotalCost.toString(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(portfolioPositions.userId, transaction.userId),
              eq(portfolioPositions.symbol, transaction.symbol),
            ),
          );
      } else if (transaction.type === "sell") {
        const newQuantity = existingQuantity - quantity;

        if (newQuantity <= 0) {
          await this.deletePortfolioPosition(transaction.userId, transaction.symbol);
        } else {
          const proportionSold = quantity / existingQuantity;
          const newTotalCost = existingCost * (1 - proportionSold);

          await db!
            .update(portfolioPositions)
            .set({
              quantity: newQuantity.toString(),
              totalCost: newTotalCost.toString(),
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(portfolioPositions.userId, transaction.userId),
                eq(portfolioPositions.symbol, transaction.symbol),
              ),
            );
        }
      }
    }
  }
}

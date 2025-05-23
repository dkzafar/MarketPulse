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
  type InsertPortfolioPosition,
  type Transaction,
  type InsertTransaction
} from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  updateLastLogin(id: number): Promise<void>;
  
  // Authentication
  verifyPassword(email: string, password: string): Promise<User | null>;
  
  // Watchlist management
  getWatchlist(userId: number): Promise<Watchlist | undefined>;
  createWatchlist(watchlist: InsertWatchlist & { userId: number }): Promise<Watchlist>;
  updateWatchlist(userId: number, symbols: string[]): Promise<Watchlist>;
  
  // Stock data
  getStockQuote(symbol: string): Promise<StockQuote | undefined>;
  upsertStockQuote(quote: InsertStockQuote): Promise<StockQuote>;
  getMultipleStockQuotes(symbols: string[]): Promise<StockQuote[]>;
  
  // News
  getNewsForSymbol(symbol: string, limit?: number): Promise<NewsArticle[]>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  
  // Portfolio management
  getPortfolioPositions(userId: number): Promise<PortfolioPosition[]>;
  getPortfolioPosition(userId: number, symbol: string): Promise<PortfolioPosition | undefined>;
  addTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactions(userId: number, symbol?: string): Promise<Transaction[]>;
  updatePortfolioPosition(userId: number, symbol: string, position: Partial<PortfolioPosition>): Promise<PortfolioPosition>;
  deletePortfolioPosition(userId: number, symbol: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private watchlists: Map<number, Watchlist>;
  private stockQuotes: Map<string, StockQuote>;
  private newsArticles: NewsArticle[];
  private portfolioPositions: Map<string, PortfolioPosition>; // key: userId-symbol
  private transactions: Transaction[];
  private currentUserId: number;
  private currentWatchlistId: number;
  private currentQuoteId: number;
  private currentNewsId: number;
  private currentPositionId: number;
  private currentTransactionId: number;

  constructor() {
    this.users = new Map();
    this.watchlists = new Map();
    this.stockQuotes = new Map();
    this.newsArticles = [];
    this.portfolioPositions = new Map();
    this.transactions = [];
    this.currentUserId = 1;
    this.currentWatchlistId = 1;
    this.currentQuoteId = 1;
    this.currentNewsId = 1;
    this.currentPositionId = 1;
    this.currentTransactionId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const user: User = { 
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: hashedPassword,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImage: null,
      bio: null,
      isVerified: false,
      totalTrades: 0,
      successfulTrades: 0,
      portfolioValue: 10000,
      joinedAt: new Date(),
      lastLogin: null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateLastLogin(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLogin = new Date();
      this.users.set(id, user);
    }
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getWatchlist(userId: number): Promise<Watchlist | undefined> {
    return Array.from(this.watchlists.values()).find(
      (watchlist) => watchlist.userId === userId,
    );
  }

  async createWatchlist(watchlistData: InsertWatchlist & { userId: number }): Promise<Watchlist> {
    const id = this.currentWatchlistId++;
    const watchlist: Watchlist = {
      ...watchlistData,
      id,
      createdAt: new Date(),
    };
    this.watchlists.set(id, watchlist);
    return watchlist;
  }

  async updateWatchlist(userId: number, symbols: string[]): Promise<Watchlist> {
    const existingWatchlist = await this.getWatchlist(userId);
    if (existingWatchlist) {
      existingWatchlist.symbols = symbols;
      this.watchlists.set(existingWatchlist.id, existingWatchlist);
      return existingWatchlist;
    } else {
      return this.createWatchlist({ userId, symbols });
    }
  }

  async getStockQuote(symbol: string): Promise<StockQuote | undefined> {
    return this.stockQuotes.get(symbol.toUpperCase());
  }

  async upsertStockQuote(quote: InsertStockQuote): Promise<StockQuote> {
    const symbol = quote.symbol.toUpperCase();
    const existingQuote = this.stockQuotes.get(symbol);
    
    if (existingQuote) {
      const updatedQuote: StockQuote = {
        ...existingQuote,
        ...quote,
        timestamp: new Date(),
      };
      this.stockQuotes.set(symbol, updatedQuote);
      return updatedQuote;
    } else {
      const id = this.currentQuoteId++;
      const newQuote: StockQuote = {
        ...quote,
        id,
        symbol,
        timestamp: new Date(),
      };
      this.stockQuotes.set(symbol, newQuote);
      return newQuote;
    }
  }

  async getMultipleStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    const quotes: StockQuote[] = [];
    for (const symbol of symbols) {
      const quote = await this.getStockQuote(symbol);
      if (quote) {
        quotes.push(quote);
      }
    }
    return quotes;
  }

  async getNewsForSymbol(symbol: string, limit: number = 10): Promise<NewsArticle[]> {
    return this.newsArticles
      .filter(article => article.symbol.toUpperCase() === symbol.toUpperCase())
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, limit);
  }

  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const id = this.currentNewsId++;
    const newsArticle: NewsArticle = {
      ...article,
      id,
    };
    this.newsArticles.push(newsArticle);
    return newsArticle;
  }

  // Portfolio management methods
  async getPortfolioPositions(userId: number): Promise<PortfolioPosition[]> {
    const positions: PortfolioPosition[] = [];
    for (const [key, position] of this.portfolioPositions) {
      if (key.startsWith(`${userId}-`)) {
        positions.push(position);
      }
    }
    return positions;
  }

  async getPortfolioPosition(userId: number, symbol: string): Promise<PortfolioPosition | undefined> {
    return this.portfolioPositions.get(`${userId}-${symbol}`);
  }

  async addTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: this.currentTransactionId++,
      ...transaction,
      executedAt: new Date(),
    };

    this.transactions.push(newTransaction);
    await this.updatePortfolioAfterTransaction(newTransaction);
    return newTransaction;
  }

  async getTransactions(userId: number, symbol?: string): Promise<Transaction[]> {
    return this.transactions.filter(t => 
      t.userId === userId && (!symbol || t.symbol === symbol)
    );
  }

  async updatePortfolioPosition(userId: number, symbol: string, updates: Partial<PortfolioPosition>): Promise<PortfolioPosition> {
    const key = `${userId}-${symbol}`;
    const existing = this.portfolioPositions.get(key);
    
    if (!existing) {
      throw new Error("Position not found");
    }

    const updated: PortfolioPosition = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.portfolioPositions.set(key, updated);
    return updated;
  }

  async deletePortfolioPosition(userId: number, symbol: string): Promise<void> {
    this.portfolioPositions.delete(`${userId}-${symbol}`);
  }

  private async updatePortfolioAfterTransaction(transaction: Transaction): Promise<void> {
    const key = `${transaction.userId}-${transaction.symbol}`;
    const existing = this.portfolioPositions.get(key);
    
    const quantity = parseFloat(transaction.quantity);
    const totalAmount = parseFloat(transaction.totalAmount);

    if (!existing) {
      if (transaction.type === 'buy') {
        const newPosition: PortfolioPosition = {
          id: this.currentPositionId++,
          userId: transaction.userId,
          symbol: transaction.symbol,
          quantity: transaction.quantity,
          averagePrice: transaction.price,
          totalCost: transaction.totalAmount,
          currentValue: null,
          unrealizedPnL: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.portfolioPositions.set(key, newPosition);
      }
    } else {
      const existingQuantity = parseFloat(existing.quantity);
      const existingCost = parseFloat(existing.totalCost);
      
      if (transaction.type === 'buy') {
        const newQuantity = existingQuantity + quantity;
        const newTotalCost = existingCost + totalAmount;
        const newAveragePrice = newTotalCost / newQuantity;
        
        const updated: PortfolioPosition = {
          ...existing,
          quantity: newQuantity.toString(),
          averagePrice: newAveragePrice.toString(),
          totalCost: newTotalCost.toString(),
          updatedAt: new Date(),
        };
        
        this.portfolioPositions.set(key, updated);
      } else if (transaction.type === 'sell') {
        const newQuantity = existingQuantity - quantity;
        
        if (newQuantity <= 0) {
          this.portfolioPositions.delete(key);
        } else {
          const proportionSold = quantity / existingQuantity;
          const newTotalCost = existingCost * (1 - proportionSold);
          
          const updated: PortfolioPosition = {
            ...existing,
            quantity: newQuantity.toString(),
            totalCost: newTotalCost.toString(),
            updatedAt: new Date(),
          };
          
          this.portfolioPositions.set(key, updated);
        }
      }
    }
  }
}

export const storage = new MemStorage();

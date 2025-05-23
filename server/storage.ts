import { 
  users, 
  watchlists, 
  stockQuotes, 
  newsArticles,
  type User, 
  type InsertUser,
  type Watchlist,
  type InsertWatchlist,
  type StockQuote,
  type InsertStockQuote,
  type NewsArticle,
  type InsertNewsArticle
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getWatchlist(userId: number): Promise<Watchlist | undefined>;
  createWatchlist(watchlist: InsertWatchlist & { userId: number }): Promise<Watchlist>;
  updateWatchlist(userId: number, symbols: string[]): Promise<Watchlist>;
  
  getStockQuote(symbol: string): Promise<StockQuote | undefined>;
  upsertStockQuote(quote: InsertStockQuote): Promise<StockQuote>;
  getMultipleStockQuotes(symbols: string[]): Promise<StockQuote[]>;
  
  getNewsForSymbol(symbol: string, limit?: number): Promise<NewsArticle[]>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private watchlists: Map<number, Watchlist>;
  private stockQuotes: Map<string, StockQuote>;
  private newsArticles: NewsArticle[];
  private currentUserId: number;
  private currentWatchlistId: number;
  private currentQuoteId: number;
  private currentNewsId: number;

  constructor() {
    this.users = new Map();
    this.watchlists = new Map();
    this.stockQuotes = new Map();
    this.newsArticles = [];
    this.currentUserId = 1;
    this.currentWatchlistId = 1;
    this.currentQuoteId = 1;
    this.currentNewsId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
}

export const storage = new MemStorage();

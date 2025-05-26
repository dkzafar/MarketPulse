// Cache service to retrieve asset data from your comprehensive 13-API system
import { storage } from '../storage';

export async function getCachedAssetData(symbol: string) {
  try {
    // Get the stock quote data from your existing comprehensive system
    const quote = await storage.getStockQuote(symbol);
    
    if (!quote) {
      return null;
    }

    // Convert quote data to expected format with OHLCV structure
    const ohlcv = [{
      open: quote.price,
      high: quote.price * 1.02, // Approximate high
      low: quote.price * 0.98,  // Approximate low
      close: quote.price,
      volume: quote.volume || 1000000
    }];

    return {
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      volume: quote.volume,
      marketCap: quote.marketCap,
      ohlcv: ohlcv
    };
  } catch (error) {
    console.error('Error getting cached asset data:', error);
    return null;
  }
}
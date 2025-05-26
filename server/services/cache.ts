import axios from 'axios';
import { AssetData, AssetOHLC } from '../types';

const cache = new Map<string, { data: AssetData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedAssetData(symbol: string): Promise<AssetData | null> {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const assetData = await fetchAssetData(symbol);
    if (assetData) {
      cache.set(symbol, { data: assetData, timestamp: Date.now() });
      return assetData;
    }
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
  }

  return null;
}

async function fetchAssetData(symbol: string): Promise<AssetData | null> {
  try {
    // Try Alpha Vantage first
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      const data = await fetchFromAlphaVantage(symbol);
      if (data) return data;
    }

    // Fallback to Yahoo Finance API (free)
    const data = await fetchFromYahooFinance(symbol);
    if (data) return data;

    return null;
  } catch (error) {
    console.error(`Failed to fetch data for ${symbol}:`, error);
    return null;
  }
}

async function fetchFromAlphaVantage(symbol: string): Promise<AssetData | null> {
  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: symbol,
        outputsize: 'full',
        apikey: process.env.ALPHA_VANTAGE_API_KEY
      }
    });

    const timeSeries = response.data['Time Series (Daily)'];
    if (!timeSeries) return null;

    const dates = Object.keys(timeSeries).sort().slice(-252); // Last year of data
    const ohlcv: AssetOHLC[] = dates.map(date => ({
      date,
      open: parseFloat(timeSeries[date]['1. open']),
      high: parseFloat(timeSeries[date]['2. high']),
      low: parseFloat(timeSeries[date]['3. low']),
      close: parseFloat(timeSeries[date]['4. close']),
      volume: parseInt(timeSeries[date]['5. volume'])
    }));

    const latestData = ohlcv[ohlcv.length - 1];
    const previousData = ohlcv[ohlcv.length - 2];
    const changePercent = ((latestData.close - previousData.close) / previousData.close) * 100;

    return {
      symbol,
      name: symbol,
      price: latestData.close,
      changePercent,
      volume: latestData.volume,
      ohlcv
    };
  } catch (error) {
    console.error('Alpha Vantage API error:', error);
    return null;
  }
}

async function fetchFromYahooFinance(symbol: string): Promise<AssetData | null> {
  try {
    // Use Yahoo Finance alternative API
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      params: {
        range: '1y',
        interval: '1d'
      }
    });

    const result = response.data.chart.result[0];
    if (!result) return null;

    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    
    const ohlcv: AssetOHLC[] = timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: quote.open[i] || 0,
      high: quote.high[i] || 0,
      low: quote.low[i] || 0,
      close: quote.close[i] || 0,
      volume: quote.volume[i] || 0
    })).filter(candle => candle.close > 0);

    if (ohlcv.length < 2) return null;

    const latestData = ohlcv[ohlcv.length - 1];
    const previousData = ohlcv[ohlcv.length - 2];
    const changePercent = ((latestData.close - previousData.close) / previousData.close) * 100;

    return {
      symbol,
      name: result.meta.shortName || symbol,
      price: latestData.close,
      changePercent,
      volume: latestData.volume,
      marketCap: result.meta.marketCap,
      ohlcv
    };
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    return null;
  }
}
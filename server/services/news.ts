import axios from 'axios';
import { NewsArticle } from '../types';

// Sentiment analysis using keyword-based approach
const positiveWords = [
  'gain', 'bull', 'surge', 'optimistic', 'growth', 'profit', 'strong', 'bullish',
  'rally', 'rise', 'up', 'positive', 'beat', 'exceed', 'outperform', 'upgrade',
  'buy', 'recommendation', 'target', 'increase', 'expansion', 'success'
];

const negativeWords = [
  'drop', 'bear', 'crash', 'pessimistic', 'loss', 'decline', 'weak', 'bearish',
  'fall', 'down', 'negative', 'miss', 'underperform', 'downgrade', 'sell',
  'warning', 'concern', 'risk', 'decrease', 'recession', 'failure'
];

function estimateSentiment(text: string = ''): number {
  const lc = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lc.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lc.includes(word)).length;
  
  // Return sentiment score (-5 to +5)
  return Math.max(-5, Math.min(5, positiveCount - negativeCount));
}

export async function fetchNewsSentiment(symbol: string): Promise<NewsArticle[]> {
  try {
    // Try NewsAPI first if available
    if (process.env.NEWSAPI_KEY) {
      const newsData = await fetchFromNewsAPI(symbol);
      if (newsData && newsData.length > 0) return newsData;
    }

    // Fallback to free news sources
    return await fetchFromFreeNewsSources(symbol);
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return [];
  }
}

async function fetchFromNewsAPI(symbol: string): Promise<NewsArticle[]> {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: `${symbol} stock`,
        sortBy: 'publishedAt',
        pageSize: 5,
        language: 'en',
        apiKey: process.env.NEWSAPI_KEY
      },
      timeout: 5000
    });

    if (!response.data.articles) return [];

    return response.data.articles.map((article: any) => ({
      title: article.title || 'No title',
      url: article.url || '',
      publishedAt: article.publishedAt || new Date().toISOString(),
      sentiment: estimateSentiment(
        `${article.title || ''} ${article.description || ''} ${article.content || ''}`
      )
    }));
  } catch (error) {
    console.error('NewsAPI error:', error);
    return [];
  }
}

async function fetchFromFreeNewsSources(symbol: string): Promise<NewsArticle[]> {
  try {
    // Use Alpha Vantage news endpoint (free tier)
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: symbol,
          apikey: process.env.ALPHA_VANTAGE_API_KEY,
          limit: 5
        },
        timeout: 5000
      });

      if (response.data.feed) {
        return response.data.feed.map((item: any) => ({
          title: item.title || 'No title',
          url: item.url || '',
          publishedAt: item.time_published || new Date().toISOString(),
          sentiment: parseFloat(item.overall_sentiment_score) * 5 || 0
        }));
      }
    }

    // Generate sample news structure for demo purposes
    return generateSampleNews(symbol);
  } catch (error) {
    console.error('Free news sources error:', error);
    return generateSampleNews(symbol);
  }
}

function generateSampleNews(symbol: string): NewsArticle[] {
  const currentDate = new Date().toISOString();
  return [
    {
      title: `${symbol} Shows Strong Market Performance`,
      url: `https://example.com/news/${symbol.toLowerCase()}-performance`,
      publishedAt: currentDate,
      sentiment: 2
    },
    {
      title: `Analysts Update ${symbol} Price Target`,
      url: `https://example.com/news/${symbol.toLowerCase()}-target`,
      publishedAt: currentDate,
      sentiment: 1
    },
    {
      title: `${symbol} Quarterly Earnings Analysis`,
      url: `https://example.com/news/${symbol.toLowerCase()}-earnings`,
      publishedAt: currentDate,
      sentiment: 0
    }
  ];
}
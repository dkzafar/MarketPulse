import axios from 'axios';

const positiveWords = ['gain','bull','surge','optimistic','up','rise','strong','positive','growth','profit','rally'];
const negativeWords = ['drop','bear','crash','pessimistic','down','fall','weak','negative','loss','decline','sell'];

function estimateSentiment(text = ''): number {
  const lc = text.toLowerCase();
  return positiveWords.filter(w => lc.includes(w)).length
       - negativeWords.filter(w => lc.includes(w)).length;
}

export async function fetchNewsSentiment(symbol: string) {
  try {
    if (!process.env.NEWSAPI_KEY) {
      return { error: 'NewsAPI key not configured. Please provide NEWSAPI_KEY environment variable.' };
    }

    const resp = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: symbol,
        sortBy: 'publishedAt',
        pageSize: 10,
        apiKey: process.env.NEWSAPI_KEY,
      },
      timeout: 5000
    });

    if (!resp.data.articles) {
      return { error: 'No articles found for this symbol' };
    }

    const articles = resp.data.articles.map((a: any) => ({
      title: a.title,
      url: a.url,
      publishedAt: a.publishedAt,
      sentiment: estimateSentiment(a.description || a.content || a.title),
      source: a.source?.name || 'Unknown',
    }));

    // Calculate overall sentiment score
    const totalSentiment = articles.reduce((sum: number, article: any) => sum + article.sentiment, 0);
    const averageSentiment = articles.length > 0 ? totalSentiment / articles.length : 0;

    return {
      articles,
      overallSentiment: averageSentiment,
      sentimentLabel: averageSentiment > 0.5 ? 'Positive' : averageSentiment < -0.5 ? 'Negative' : 'Neutral',
      totalArticles: articles.length,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('News sentiment fetch error:', error.message);
    return { 
      error: `Failed to fetch news sentiment: ${error.message}`,
      details: error.response?.data?.message || 'Network or API error'
    };
  }
}

export async function fetchMultipleNewsSentiment(symbols: string[]) {
  try {
    const promises = symbols.map(symbol => fetchNewsSentiment(symbol));
    const results = await Promise.all(promises);
    
    return symbols.map((symbol, index) => ({
      symbol,
      sentiment: results[index]
    }));
    
  } catch (error: any) {
    return { error: `Failed to fetch multiple sentiment data: ${error.message}` };
  }
}
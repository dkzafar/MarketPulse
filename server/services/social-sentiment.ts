/**
 * Social Media Sentiment Analysis
 * Aggregates sentiment from Twitter, Reddit, and news sources
 */

import axios from 'axios';

export interface SocialSentiment {
  symbol: string;
  timestamp: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -1 to 1
  confidence: number; // 0 to 1
  sources: {
    twitter: SentimentSource;
    reddit: SentimentSource;
    news: SentimentSource;
  };
  mentions: number;
  trending: boolean;
}

export interface SentimentSource {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
  mentions: number;
  volume24h: number;
}

export interface SocialPost {
  platform: 'twitter' | 'reddit' | 'news';
  content: string;
  author: string;
  timestamp: string;
  sentiment: number;
  engagement: number;
  url?: string;
}

/**
 * Fetch Twitter sentiment using free Twitter API
 */
export async function fetchTwitterSentiment(symbol: string): Promise<SentimentSource> {
  try {
    const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
      },
      params: {
        'query': `$${symbol} OR ${symbol} -is:retweet`,
        'max_results': 100,
        'tweet.fields': 'created_at,public_metrics,context_annotations'
      }
    });

    const tweets = response.data.data || [];
    
    if (tweets.length === 0) {
      return { sentiment: 'neutral', score: 0, mentions: 0, volume24h: 0 };
    }

    let totalSentiment = 0;
    let totalEngagement = 0;

    for (const tweet of tweets) {
      const sentiment = analyzeTweetSentiment(tweet.text);
      const engagement = (tweet.public_metrics?.like_count || 0) + 
                        (tweet.public_metrics?.retweet_count || 0) + 
                        (tweet.public_metrics?.reply_count || 0);
      
      totalSentiment += sentiment * Math.log(1 + engagement); // Weight by engagement
      totalEngagement += engagement;
    }

    const avgSentiment = totalSentiment / Math.log(1 + totalEngagement);
    
    return {
      sentiment: avgSentiment > 0.1 ? 'bullish' : avgSentiment < -0.1 ? 'bearish' : 'neutral',
      score: avgSentiment,
      mentions: tweets.length,
      volume24h: totalEngagement
    };
  } catch (error) {
    console.log('Twitter API not available, using news sentiment fallback');
    return { sentiment: 'neutral', score: 0, mentions: 0, volume24h: 0 };
  }
}

/**
 * Fetch Reddit sentiment using free Reddit API
 */
export async function fetchRedditSentiment(symbol: string): Promise<SentimentSource> {
  try {
    const subreddits = ['stocks', 'investing', 'SecurityAnalysis', 'ValueInvesting', 'wallstreetbets'];
    let allPosts: any[] = [];

    for (const subreddit of subreddits) {
      try {
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/search.json`, {
          params: {
            'q': symbol,
            'sort': 'new',
            'limit': 20,
            't': 'day'
          },
          headers: {
            'User-Agent': 'FinancialAnalysis/1.0'
          }
        });

        if (response.data.data?.children) {
          allPosts = allPosts.concat(response.data.data.children);
        }
      } catch (subError) {
        // Continue with other subreddits if one fails
        continue;
      }
    }

    if (allPosts.length === 0) {
      return { sentiment: 'neutral', score: 0, mentions: 0, volume24h: 0 };
    }

    let totalSentiment = 0;
    let totalScore = 0;

    for (const post of allPosts) {
      const data = post.data;
      const content = `${data.title} ${data.selftext || ''}`;
      const sentiment = analyzeTextSentiment(content);
      const score = data.score || 0;
      
      totalSentiment += sentiment * Math.log(1 + Math.max(score, 1));
      totalScore += score;
    }

    const avgSentiment = totalSentiment / Math.log(1 + totalScore);
    
    return {
      sentiment: avgSentiment > 0.1 ? 'bullish' : avgSentiment < -0.1 ? 'bearish' : 'neutral',
      score: avgSentiment,
      mentions: allPosts.length,
      volume24h: totalScore
    };
  } catch (error) {
    console.log('Reddit API not available, using news sentiment fallback');
    return { sentiment: 'neutral', score: 0, mentions: 0, volume24h: 0 };
  }
}

/**
 * Enhanced news sentiment analysis
 */
export async function fetchEnhancedNewsSentiment(symbol: string): Promise<SentimentSource> {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: `${symbol} AND (stock OR shares OR trading OR investment)`,
        sortBy: 'publishedAt',
        pageSize: 50,
        language: 'en',
        from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      headers: {
        'X-API-Key': process.env.NEWSAPI_KEY
      }
    });

    const articles = response.data.articles || [];
    
    if (articles.length === 0) {
      return { sentiment: 'neutral', score: 0, mentions: 0, volume24h: 0 };
    }

    let totalSentiment = 0;
    let validArticles = 0;

    for (const article of articles) {
      const content = `${article.title} ${article.description || ''}`;
      const sentiment = analyzeAdvancedSentiment(content);
      
      if (sentiment !== null) {
        totalSentiment += sentiment;
        validArticles++;
      }
    }

    const avgSentiment = validArticles > 0 ? totalSentiment / validArticles : 0;
    
    return {
      sentiment: avgSentiment > 0.1 ? 'bullish' : avgSentiment < -0.1 ? 'bearish' : 'neutral',
      score: avgSentiment,
      mentions: articles.length,
      volume24h: validArticles
    };
  } catch (error) {
    console.log('Enhanced news sentiment using basic analysis');
    return { sentiment: 'neutral', score: 0, mentions: 0, volume24h: 0 };
  }
}

/**
 * Advanced sentiment analysis using multiple indicators
 */
function analyzeAdvancedSentiment(text: string): number {
  const lowerText = text.toLowerCase();
  
  const strongBullish = ['surge', 'soar', 'rally', 'breakout', 'bullish', 'outperform', 'upgrade', 'beat expectations'];
  const bullish = ['gain', 'rise', 'up', 'positive', 'growth', 'strong', 'buy', 'recommend'];
  const strongBearish = ['crash', 'plunge', 'collapse', 'bearish', 'downgrade', 'miss expectations', 'selloff'];
  const bearish = ['fall', 'drop', 'down', 'decline', 'weak', 'sell', 'concern', 'risk'];
  
  let score = 0;
  
  // Count sentiment words with weights
  strongBullish.forEach(word => {
    const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
    score += matches * 2;
  });
  
  bullish.forEach(word => {
    const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
    score += matches * 1;
  });
  
  strongBearish.forEach(word => {
    const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
    score -= matches * 2;
  });
  
  bearish.forEach(word => {
    const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
    score -= matches * 1;
  });
  
  // Normalize score
  const maxWords = strongBullish.length + bullish.length + strongBearish.length + bearish.length;
  return Math.max(-1, Math.min(1, score / maxWords));
}

/**
 * Simple tweet sentiment analysis
 */
function analyzeTweetSentiment(text: string): number {
  return analyzeTextSentiment(text);
}

/**
 * General text sentiment analysis
 */
function analyzeTextSentiment(text: string): number {
  const positiveWords = ['bullish', 'buy', 'moon', 'pump', 'rocket', 'gain', 'profit', 'bull', 'long'];
  const negativeWords = ['bearish', 'sell', 'dump', 'crash', 'bear', 'short', 'drop', 'loss', 'down'];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 1;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 1;
  });
  
  return Math.max(-1, Math.min(1, score / 10));
}

/**
 * Aggregate sentiment from all sources
 */
export async function getComprehensiveSentiment(symbol: string): Promise<SocialSentiment> {
  const [twitterSentiment, redditSentiment, newsSentiment] = await Promise.all([
    fetchTwitterSentiment(symbol),
    fetchRedditSentiment(symbol),
    fetchEnhancedNewsSentiment(symbol)
  ]);

  // Calculate weighted average sentiment
  const totalMentions = twitterSentiment.mentions + redditSentiment.mentions + newsSentiment.mentions;
  
  if (totalMentions === 0) {
    return {
      symbol,
      timestamp: new Date().toISOString(),
      overallSentiment: 'neutral',
      sentimentScore: 0,
      confidence: 0,
      sources: {
        twitter: twitterSentiment,
        reddit: redditSentiment,
        news: newsSentiment
      },
      mentions: 0,
      trending: false
    };
  }

  const weightedScore = (
    twitterSentiment.score * twitterSentiment.mentions +
    redditSentiment.score * redditSentiment.mentions +
    newsSentiment.score * newsSentiment.mentions * 2 // Give news higher weight
  ) / (totalMentions + newsSentiment.mentions);

  const overallSentiment: 'bullish' | 'bearish' | 'neutral' = 
    weightedScore > 0.15 ? 'bullish' : 
    weightedScore < -0.15 ? 'bearish' : 'neutral';

  const confidence = Math.min(1, totalMentions / 50); // Higher confidence with more mentions
  const trending = totalMentions > 100 || twitterSentiment.volume24h > 1000;

  return {
    symbol,
    timestamp: new Date().toISOString(),
    overallSentiment,
    sentimentScore: weightedScore,
    confidence,
    sources: {
      twitter: twitterSentiment,
      reddit: redditSentiment,
      news: newsSentiment
    },
    mentions: totalMentions,
    trending
  };
}

/**
 * Get trending stocks based on social mentions
 */
export async function getTrendingSymbols(symbols: string[]): Promise<{ symbol: string; mentions: number; sentiment: string }[]> {
  const sentimentPromises = symbols.slice(0, 10).map(async symbol => {
    const sentiment = await getComprehensiveSentiment(symbol);
    return {
      symbol,
      mentions: sentiment.mentions,
      sentiment: sentiment.overallSentiment
    };
  });

  const results = await Promise.all(sentimentPromises);
  return results.sort((a, b) => b.mentions - a.mentions);
}
import axios from 'axios';

const positiveWords = ['gain','bull','surge','optimistic'];
const negativeWords = ['drop','bear','crash','pessimistic'];

function estimateSentiment(text = ''): number {
  const lc = text.toLowerCase();
  return positiveWords.filter(w => lc.includes(w)).length
       - negativeWords.filter(w => lc.includes(w)).length;
}

export async function fetchNewsSentiment(symbol: string) {
  const resp = await axios.get('https://newsapi.org/v2/everything', {
    params: {
      q: symbol,
      sortBy: 'publishedAt',
      pageSize: 5,
      apiKey: process.env.NEWSAPI_KEY,
    },
  });
  return resp.data.articles.map((a: any) => ({
    title:       a.title,
    url:         a.url,
    publishedAt: a.publishedAt,
    sentiment:   estimateSentiment(a.description || a.content),
  }));
}
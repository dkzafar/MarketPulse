// Yahoo Finance API integration utilities
// Note: In production, you should use a proper financial data API with authentication

export interface YahooQuoteResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        regularMarketPrice: number;
        previousClose: number;
        regularMarketVolume: number;
        marketCap?: number;
        trailingPE?: number;
        dividendYield?: number;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }>;
      };
    }>;
  };
}

export interface YahooSearchResponse {
  quotes: Array<{
    symbol: string;
    shortname: string;
    longname: string;
    typeDisp: string;
    exchange: string;
  }>;
}

export interface YahooNewsResponse {
  news: Array<{
    title: string;
    summary?: string;
    link: string;
    publisher: string;
    providerPublishTime: number;
  }>;
}

// Helper functions for Yahoo Finance API calls
export const buildYahooQuoteUrl = (symbol: string, range: string = "1d") => {
  const baseUrl = "https://query1.finance.yahoo.com/v8/finance/chart";
  const params = new URLSearchParams({
    symbol,
    range,
    interval: "1m",
    includePrePost: "true",
    events: "div|split|earn",
    lang: "en-US",
    region: "US",
    corsDomain: "finance.yahoo.com",
    ".tsrc": "finance",
  });
  
  return `${baseUrl}/${symbol}?${params.toString()}`;
};

export const buildYahooSearchUrl = (query: string) => {
  const baseUrl = "https://query1.finance.yahoo.com/v1/finance/search";
  const params = new URLSearchParams({
    q: query,
    lang: "en-US",
    region: "US",
    quotesCount: "10",
    newsCount: "0",
    enableFuzzyQuery: "false",
    quotesQueryId: "tss_match_phrase_query",
    multiQuoteQueryId: "multi_quote_single_token_query",
    enableCb: "true",
    enableNavLinks: "true",
    enableEnhancedTrivialQuery: "true",
  });
  
  return `${baseUrl}?${params.toString()}`;
};

export const buildYahooNewsUrl = (symbol: string) => {
  const baseUrl = "https://query1.finance.yahoo.com/v1/finance/search";
  const params = new URLSearchParams({
    q: symbol,
    lang: "en-US",
    region: "US",
    quotesCount: "1",
    newsCount: "10",
    enableFuzzyQuery: "false",
    quotesQueryId: "tss_match_phrase_query",
    multiQuoteQueryId: "multi_quote_single_token_query",
    newsQueryId: "news_cie_vespa",
    enableCb: "true",
    enableNavLinks: "true",
    enableEnhancedTrivialQuery: "true",
  });
  
  return `${baseUrl}?${params.toString()}`;
};

// Error handling for Yahoo Finance API
export class YahooFinanceError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "YahooFinanceError";
  }
}

export const handleYahooApiError = (response: Response) => {
  if (!response.ok) {
    throw new YahooFinanceError(
      `Yahoo Finance API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }
};

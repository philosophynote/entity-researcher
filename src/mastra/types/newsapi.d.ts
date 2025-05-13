declare module 'newsapi' {
  interface NewsApiArticle {
    title: string;
    description: string;
    url: string;
    publishedAt: string;
    source: { name: string };
  }
  interface NewsApiResponse {
    status: string;
    articles: NewsApiArticle[];
  }
  class NewsAPI {
    constructor(apiKey: string);
    v2: {
      everything(params: Record<string, any>): Promise<NewsApiResponse>;
      topHeadlines(params: Record<string, any>): Promise<NewsApiResponse>;
    };
  }
  export = NewsAPI;
} 
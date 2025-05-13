import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mcp } from '../mcp';
import fetch from "node-fetch";
import { parse } from "node-html-parser";

/** NEWS APIのArticle型 */
type Article = {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: { name: string };
};

/** 文字列が日本語を含むか判定 */
function containsJapanese(text: string): boolean {
  return /[一-龯ぁ-んァ-ン]/.test(text);
}

/**
 * 企業名からNEWS APIで日本のビジネスニュース（タイトル・日付・URL）を取得するツール
 */
export const fetchNewsByCompany = createTool({
  id: 'fetchNewsByCompany',
  description: '企業名でNEWS APIから日本のビジネスニュース（タイトル・日付・URL）を取得します',
  inputSchema: z.object({
    companyName: z.string().describe('企業名')
  }),
  outputSchema: z.array(z.object({
    title: z.string().describe('ニュースタイトル'),
    date: z.string().describe('公開日'),
    url: z.string().describe('ニュースURL'),
  })).describe('ニュース情報の配列'),
  execute: async ({ context: { companyName } }) => {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) throw new Error('環境変数 NEWS_API_KEY が未設定です');

    // NEWS APIで日本のビジネスニュースを取得
    const params = new URLSearchParams({
      country: 'jp',
      category: 'business',
      pageSize: '50',
      apiKey,
      q: companyName,
    });
    const res = await fetch(`https://newsapi.org/v2/top-headlines?${params.toString()}`);
    if (!res.ok) throw new Error(`NewsAPI request failed: ${res.status} ${res.statusText}`);

    const data = await res.json() as { status: string; articles: Article[] };
    if (data.status !== 'ok') throw new Error('NewsAPI returned non-ok status');

    // 企業名を含み、日本語タイトルの記事のみ返す
    return data.articles
      .filter(a => a.title.includes(companyName) && containsJapanese(a.title))
      .map(a => ({
        title: a.title,
        date: a.publishedAt,
        url: a.url,
      }));
  },
});



import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fetch from 'node-fetch';

function parseJapaneseDate(str: string): Date {
  const m = str.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2})?時?(\d{1,2})?分?/);
  if (!m) return new Date(0);
  const [_, y, mo, d, h = '0', mi = '0'] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
}

export const prtimesKeywordSearch = createTool({
  id: 'prtimesKeywordSearch',
  description: 'PR TIMES APIでキーワード検索を行い過去半年のプレスリリースを取得します',
  inputSchema: z.object({
    keyword: z.string().describe('検索キーワード'),
    limit: z.number().int().positive().max(100).optional().describe('取得件数'),
  }),
  outputSchema: z.array(
    z.object({
      title: z.string().describe('プレスリリースタイトル'),
      date: z.string().describe('公開日(ISO 8601)'),
      url: z.string().describe('記事URL'),
    })
  ).describe('プレスリリース情報の配列'),
  execute: async ({ context: { keyword, limit } }) => {
    const params = new URLSearchParams({
      keyword,
      page: '1',
      limit: String(limit ?? 20),
    });
    const res = await fetch(`https://prtimes.jp/api/keyword_search.php/search?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`PRTIMES API request failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json() as any;
    const releases = Array.isArray(data?.data?.release_list) ? data.data.release_list : [];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return releases
      .map((r: any) => ({
        title: r.title as string,
        dateObj: parseJapaneseDate(r.released_at as string),
        url: 'https://prtimes.jp' + (r.release_url as string),
      }))
      .filter(r => r.dateObj.getTime() >= sixMonthsAgo.getTime())
      .map(r => ({
        title: r.title,
        date: r.dateObj.toISOString(),
        url: r.url,
      }));
  },
});

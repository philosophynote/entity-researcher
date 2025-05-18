import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fetch from 'node-fetch';

const PRTIMES_API_URL = "https://prtimes.jp/api"
const SEARCH_PATH = "/keyword_search.php/search"
const SEARCH_WORD = "資金調達"
const PRESS_RELEASE_PREFIX = "/main/html/rd"

function parseJapaneseDate(str: string): Date {
  const m = str.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2})?時?(\d{1,2})?分?/);
  if (!m) return new Date(0);
  const [_, y, mo, d, h = '0', mi = '0'] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
}

/**
 * PR TIMES APIのrelease_list要素の型
 */
type PrTimesReleaseRaw = {
  title: string;
  released_at: string;
  release_url: string;
};

/**
 * PR TIMESのリリース情報を一時的に保持する型
 */
type Release = {
  title: string;
  dateObj: Date;
  url: string;
};

export const prtimesKeywordSearch = createTool({
  id: 'prtimesKeywordSearch',
  description: 'PR TIMES APIでキーワード検索を行い過去半年のプレスリリースを取得します',
  inputSchema: z.object({
    keyword: z.string().describe('検索キーワード')
  }),
  outputSchema: z.array(
    z.object({
      title: z.string().describe('プレスリリースタイトル'),
      date: z.string().describe('公開日(ISO 8601)'),
      url: z.string().describe('記事URL'),
    })
  ).describe('プレスリリース情報の配列'),
  execute: async ({ context: { keyword } }) => {
    const params = new URLSearchParams({
      keyword,
      page: '1',
      limit: '20',
    });
    const res = await fetch(`${PRTIMES_API_URL}${SEARCH_PATH}?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`PRTIMES API request failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json() as any;
    const releases: PrTimesReleaseRaw[] = Array.isArray(data?.data?.release_list) ? data.data.release_list : [];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return (releases
      .map((r: PrTimesReleaseRaw): Release => ({
        title: r.title,
        dateObj: parseJapaneseDate(r.released_at),
        url: 'https://prtimes.jp' + r.release_url,
      }))
      .filter((r: Release) => r.dateObj.getTime() >= sixMonthsAgo.getTime())
      .map((r: Release) => ({
        title: r.title,
        date: r.dateObj.toISOString(),
        url: r.url,
      }))
    );
  },
});

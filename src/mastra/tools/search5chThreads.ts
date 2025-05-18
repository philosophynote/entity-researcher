import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { parse } from 'node-html-parser';

/**
 * find.5ch.net をキーワード検索してスレッドURLを取得するツール
 */
export const search5chThreads = createTool({
  id: 'search5chThreads',
  description: 'find.5ch.net でキーワード検索し、スレッドURLを取得します',
  inputSchema: z.object({
    keyword: z.string().describe('検索キーワード'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe('取得件数 (最大50件)')
  }),
  outputSchema: z
    .array(z.string().url())
    .describe('条件に合致したスレッドURLの配列'),
  async execute({ context: { keyword, limit = 10 } }) {
    const params = new URLSearchParams({ q: keyword });
    const res = await fetch(`https://find.5ch.net/search?${params.toString()}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) {
      throw new Error(`find.5ch.net request failed: ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const root = parse(html);

    const threadRegex = /https?:\/\/\w+\.5ch\.net\/test\/read\.cgi\/[^\/?]+\/\d+/;
    const urls = root
      .querySelectorAll('a')
      .map((a) => a.getAttribute('href') ?? '')
      .map((href) => {
        const m = href.match(threadRegex);
        return m ? m[0] : null;
      })
      .filter((u): u is string => Boolean(u));

    const unique = Array.from(new Set(urls)).slice(0, limit);
    return unique;
  },
});

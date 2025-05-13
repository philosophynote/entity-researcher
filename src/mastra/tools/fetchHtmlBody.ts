// fetchBodyText.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { parse } from 'node-html-parser';

/**
 * 指定URLの<body>テキストを取得する
 */
export const fetchHtmlBody = createTool({
  id: 'fetchHtmlBody',
  description: '指定URLのHTML本文（<body>要素のテキスト）を取得します',
  inputSchema: z.object({
    url: z.string().url().describe('取得対象のURL')
  }),
  outputSchema: z.object({
    body: z.string().describe('本文テキスト')
  }),
  execute: async ({ context: { url } }) => {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.4638.74 Safari/537.36",
        "Accept-Language": "ja,en;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} – ${res.statusText}`);
    }

    const html = await res.text();
    const root = parse(html);
    const bodyText = root.querySelector('body')?.innerText.trim() ?? '';

    return { body: bodyText };
  },
});

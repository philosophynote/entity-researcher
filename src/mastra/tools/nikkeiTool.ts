import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mcp } from '../mcp';

/**
 * 日本経済新聞から企業の最新ニュースを取得するツール
 */
export const nikkeiSearch = createTool({
  id: 'nikkeiSearch',
  description: '日本経済新聞から企業関連のニュースを取得します',
  inputSchema: z.object({ companyName: z.string().describe('企業名') }),
  outputSchema: z.array(z.object({
    title: z.string().describe('ニュースタイトル'),
    date: z.string().describe('公開日'),
    url: z.string().describe('ニュースURL'),
  })).describe('ニュース情報の配列'),
  execute: async ({ context: { companyName } }) => {
    // TODO: Playwright MCP を使って https://www.nikkei.com/ で検索・スクレイピングを実装
    return [];
  },
}); 
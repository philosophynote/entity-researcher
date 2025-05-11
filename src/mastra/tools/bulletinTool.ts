import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mcp } from '../mcp';

/**
 * 5ch 掲示板から企業の関連情報を取得するツール
 */
export const bulletinSearch = createTool({
  id: 'bulletinSearch',
  description: '5ch 掲示板から企業の関連情報を取得します',
  inputSchema: z.object({ companyName: z.string().describe('企業名') }),
  outputSchema: z.array(z.object({
    content: z.string().describe('投稿内容'),
    url: z.string().describe('投稿URL'),
  })).describe('掲示板情報の配列'),
  execute: async ({ context: { companyName } }) => {
    // TODO: Playwright MCP を使って https://itest.5ch.net/ で検索・スクレイピングを実装
    return [];
  },
}); 
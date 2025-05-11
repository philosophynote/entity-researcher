import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mcp } from '../mcp';

/**
 * PR TIMES から企業のプレスリリース情報を取得するツール
 */
export const prTimesSearch = createTool({
  id: 'prTimesSearch',
  description: 'PR TIMES から企業のプレスリリース情報を取得します',
  inputSchema: z.object({ companyName: z.string().describe('企業名') }),
  outputSchema: z.array(z.object({
    title: z.string().describe('プレスリリースタイトル'),
    date: z.string().describe('リリース日'),
    url: z.string().describe('リリースURL'),
  })).describe('プレスリリース情報の配列'),
  execute: async ({ context: { companyName } }) => {
    // TODO: Playwright MCP を使って https://prtimes.jp/ で検索・スクレイピングを実装
    // 例:
    // const navigate = await mcp.getTool('playwright_browser_navigate');
    // await navigate({ url: 'https://prtimes.jp/' });
    // ...
    return [];
  },
}); 
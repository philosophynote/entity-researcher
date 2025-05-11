import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mcp } from '../mcp';

/**
 * 各口コミサイトから企業の口コミ情報を取得するツール
 */
export const reviewSearch = createTool({
  id: 'reviewSearch',
  description: '指定企業の口コミ情報を各サイトから取得します',
  inputSchema: z.object({ companyName: z.string().describe('企業名') }),
  outputSchema: z.array(z.object({
    site: z.string().describe('口コミサイト名'),
    content: z.string().describe('口コミ内容'),
    url: z.string().describe('口コミページURL'),
  })).describe('口コミ情報の配列'),
  execute: async ({ context: { companyName } }) => {
    // TODO: Playwright MCP を使って複数の口コミサイトで検索・スクレイピングを実装
    return [];
  },
}); 
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { mcp } from '../mcp';
import { prTimesSearch } from '../tools/prTimesTool';
import { nikkeiSearch } from '../tools/nikkeiTool';
import { reviewSearch } from '../tools/reviewTool';
import { bulletinSearch } from '../tools/bulletinTool';

/**
 * Playwright MCP ツールとカスタムツールを組み合わせたブラウザ自動操作エージェント
 */
export const browserAutomationAgent = new Agent({
  name: 'BrowserAutomationAgent',
  model: openai('gpt-4o-mini'),
  tools: async () => ({
    ...(await mcp.getTools()),
    prTimesSearch,
    nikkeiSearch,
    reviewSearch,
    bulletinSearch,
  }),
  instructions: `
  あなたはブラウザ操作エージェントです。
  必要に応じて以下のツールを使用してください:
  - Playwright MCP ツール (browser_navigate, browser_snapshot, browser_type, browser_click)
  - prTimesSearch, nikkeiSearch, reviewSearch, bulletinSearch
  最終的に取得した情報を JSON で返してください。
  `,
}); 
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { nikkeiSearch } from '../tools/nikkeiTool';
import { reviewSearch } from '../tools/reviewTool';

/**
 * Playwright MCP ツールとカスタムツールを組み合わせたブラウザ自動操作エージェント
 */
export const browserAutomationAgent = new Agent({
  name: 'BrowserAutomationAgent',
  model: openai('gpt-4.1-mini'),
  tools: {
    nikkeiSearch,
    reviewSearch,
  },
  instructions: `
  あなたはブラウザ操作エージェントです。
  必要に応じて以下のツールを使用してください:
  - prTimesSearch, nikkeiSearch, reviewSearch, bulletinSearch
  最終的に取得した情報を JSON で返してください。
  `,
}); 
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { mcp } from '../mcp';

/**
 * Playwright MCP の全ツールを利用するブラウザ自動操作エージェント
 */
export const browserAgent = new Agent({
  name: 'browserAgent',
  model: openai('gpt-4o-mini'),
  tools: await mcp.getTools(),
  instructions: `
    あなたは Playwright MCP を利用するブラウザ操作エージェントです。
    プロンプトで与えられた手順に従い、ページ遷移やフォーム入力、クリック操作を行ってください。
    最終的に取得した HTML など、要求された結果のみを返してください。
  `,
});

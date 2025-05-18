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
});

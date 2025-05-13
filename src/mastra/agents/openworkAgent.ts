import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { mcp } from '../mcp';

/**
 * 会社口コミの出力型
 */
export type WorkReview = {
  title: string;
  publishDate: string;
  url: string;
};

/**
 * Playwright MCP ツールとカスタムツールを組み合わせたブラウザ自動操作エージェント
 */
export const openworkAgent = new Agent({
  name: 'openworkAgent',
  model: openai('gpt-4.1-mini'),
  tools: await mcp.getTools(),
  instructions: `
  あなたは会社口コミを検索するエージェントです。
  エンゲージ 会社の評判にplaywrightを操作して過去3年間の口コミを検索してください。
  今日の日付は${new Date().toISOString().split('T')[0]}です。
  検索結果はTypeScript型 WorkReview のJSON配列として返してください。
  `,
}); 
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { mcp } from '../mcp';

/**
 * プレスリリースの出力型
 */
export type PressRelease = {
  title: string;
  date: string;
  url: string;
};

/**
 * Playwright MCP ツールとカスタムツールを組み合わせたブラウザ自動操作エージェント
 */
export const prtimesAgent = new Agent({
  name: 'prtimesAgent',
  model: openai('gpt-4.1-mini'),
  tools: await mcp.getTools(),
  instructions: `
  あなたはPR TIMESの記事を検索するエージェントです。
  与えられた企業名についてplaywrightを操作してPR TIMESの記事を検索してください。
  今日の日付は${new Date().toISOString().split('T')[0]}です。
  直近6ヶ月の記事を検索してください。
  検索結果はTypeScript型 PressRelease のJSON配列として返してください。
  `,
}); 
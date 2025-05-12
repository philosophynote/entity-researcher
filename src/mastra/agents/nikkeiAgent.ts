import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { mcp } from '../mcp';

/**
 * プレスリリースの出力型
 */
export type NewsArticle = {
  title: string;
  date: string;
  url: string;
};

/**
 * Playwright MCP ツールとカスタムツールを組み合わせたブラウザ自動操作エージェント
 */
export const nikkeiAgent = new Agent({
  name: 'nikkeiAgent',
  model: openai('gpt-4.1-mini'),
  tools: await mcp.getTools(),
  instructions: `
  あなたは日経新聞の記事を検索するエージェントです。
  与えられた企業名を法人格除去したものをplaywrightを操作して日経新聞の記事を検索してください。
  今日の日付は${new Date().toISOString().split('T')[0]}です。
  直近3年の記事を検索してください。
  検索結果はTypeScript型 NewsArticle のJSON配列として返してください。
  `,
}); 
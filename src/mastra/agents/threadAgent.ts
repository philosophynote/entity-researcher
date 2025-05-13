import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { mcp } from '../mcp';

/**
 * ネット掲示板に投稿されたスレッドの出力型
 */
export type Thread = {
  comment: string;
  url: string;
};

/**
 * Playwright MCP ツールとカスタムツールを組み合わせたブラウザ自動操作エージェント
 */
export const threadAgent = new Agent({
  name: 'threadAgent',
  model: openai('gpt-4.1-mini'),
  tools: await mcp.getTools(),
  instructions: `
  あなたはネット掲示板のスレッドに投稿されたコメントを検索するエージェントです。
  あなたの目的は過去1年間に入力された企業について,
  投稿されたポストを検索することです。
  入力された企業について,
  ${"https://zzzsearch.com/2ch/"}でplaywrightを操作して下さい。
  企業名は完全一致で検索してください。
  ヒットしたスレッドにアクセスして、企業名が入力された投稿を検索してください。
  今日の日付は${new Date().toISOString().split('T')[0]}です。
  入力された投稿とその投稿のURLをTypeScript型 Thread のJSON配列として返してください。
  `,
}); 
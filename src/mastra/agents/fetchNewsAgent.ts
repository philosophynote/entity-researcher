import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { fetchNewsByCompany } from '../tools/fetchNewsTool';

/**
 * NEWS APIを使って企業名から日本のビジネスニュースを検索するエージェント
 */
export const fetchNewsAgent = new Agent({
  name: 'fetchNewsAgent',
  model: openai('gpt-4.1-mini'),
  tools: {
    fetchNewsByCompany,
  },
  instructions: `
あなたはNEWS APIを使って日本のビジネスニュースを検索するエージェントです。
与えられた企業名でNEWS APIから最新のビジネスニュースを検索し、
タイトル・公開日・URLの配列（TypeScript型: { title: string; date: string; url: string }[]）として返してください。
  `,
}); 
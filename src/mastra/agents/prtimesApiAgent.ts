import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { prtimesKeywordSearch } from '../tools/prTimesKeywordSearch';

export type PressRelease = {
  title: string;
  date: string;
  url: string;
};

export const prtimesApiAgent = new Agent({
  name: 'prtimesApiAgent',
  model: openai('gpt-4.1-mini'),
  tools: { prtimesKeywordSearch },
  instructions: `
  あなたはPR TIMESのAPIを利用してプレスリリースを検索するエージェントです。
  与えられたキーワードで過去半年分のプレスリリースをprtimesKeywordSearchツールで取得してください。
  結果（JSON配列）は必ずそのまま返却して下さい。文章や説明文は不要です。
  `,
});

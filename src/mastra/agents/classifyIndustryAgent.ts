import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { industries } from '../types/Industry';

// 中分類リストをフラットな文字列に整形
const subcategoryList = Object.values(industries)
  .flatMap(cat => Object.entries(cat.subcategories).map(([code, name]) => `${code}: ${name}`))
  .join('\n');

export const classifyIndustryAgent = new Agent({
  name: 'classifyIndustryAgent',
  model: openai('o4-mini-2025-04-16'),
  instructions: `
以下は日本標準産業分類（中分類）の一覧です。各行は「コード: 名称」です。
${subcategoryList}

企業概要: {{input}}

上記の一覧から最も適切な業種を、コードと名称の文字列で厳密に1つ返してください。例: "39: 情報サービス業"
  `,
}); 
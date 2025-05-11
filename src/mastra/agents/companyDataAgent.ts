import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { mcp } from '../mcp';
import { SummarizationMetric } from "@mastra/evals/llm";
import {
  ContentSimilarityMetric,
  ToneConsistencyMetric,
} from "@mastra/evals/nlp";


const model = openai("gpt-4.1-mini");

/**
 * 企業基本情報（コーポレートURL、LP、業種、電話番号、従業員数、設立年月日、概要）を収集するエージェント
 */

/**
 * 企業基本情報の出力型
 */
export type CompanyData = {
  representative: string;
  corporateUrl: string;
  landingPages: string[];
  // industry: string;
  phone: string;
  employees: number;
  founded: string;
  overview: string;
};

export const companyDataAgent = new Agent({
  name: 'CompanyDataAgent',
  model,
  tools: async () => {
    // すべてのツールからperplexity-ask_perplexity_askのみ抽出
    const allTools = await mcp.getTools();
    return {
      "perplexity-ask_perplexity_ask": allTools["perplexity-ask_perplexity_ask"],
    };
  },
  instructions: `
  あなたは企業情報収集エージェントです。
  WEBサイトで次の情報を検索してください。
  - 代表者名
  - コーポレートURL
  - 提供サービス/商品のLPのURL
  - 電話番号
  - 従業員数
  - 設立年月日
  - 企業概要

  検索結果から該当情報を抽出し、TypeScript型 CompanyData のJSONとして、余分な文章なしで返してください。
  `,
  evals: {
    summarization: new SummarizationMetric(model),
    contentSimilarity: new ContentSimilarityMetric(),
    tone: new ToneConsistencyMetric(),
  },
}); 


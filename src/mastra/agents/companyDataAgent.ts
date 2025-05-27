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
type FieldWithSource<T> = {
  value: T;
  source: string[];
};

export type CompanyData = {
  representative: FieldWithSource<string>;
  corporateUrl: FieldWithSource<string>;
  landingPages: FieldWithSource<string[]>;
  phone: FieldWithSource<string>;
  employees: FieldWithSource<number>;
  founded: FieldWithSource<string>;
  overview: FieldWithSource<string>;
};

const allTools = await mcp.getTools();

const filteredTools = Object.fromEntries(
  Object.entries(allTools).filter(([toolName]) => toolName === "perplexity-ask_perplexity_ask"),
);

/**
 * LLMの出力からCompanyDataオブジェクトを抽出する関数
 * @param output LLMからの出力文字列
 * @returns CompanyData型のオブジェクト
 */
export const parseCompanyData = (output: string): CompanyData | null => {
  try {
    // 受け取った文字列をそのままJSONとしてパース
    return JSON.parse(output);
  } catch (error) {
    console.error('JSONパースエラー:', error);
    return null;
  }
};

/**
 * 企業データを収集するエージェント
 */
export const companyDataAgent = new Agent({
  name: 'CompanyDataAgent',
  model,
  tools: filteredTools,
  instructions: 
   `あなたはプロのリサーチャーです。企業名と企業所在地が与えられるので
    企業情報を正確かつ最新の情報源に基づいて収集してください。
    以下の各項目について、内容と情報源のURL（複数可）を必ず収集してください。

    - 代表者名
    - コーポレートURL
    - 提供サービス/商品のLPのURL（複数ある場合はすべて）
    - 電話番号
    - 従業員数（数字のみ）
    - 設立年月日（"YYYY-MM-DD" 形式）
    - 企業概要（事業内容の要約）

    ## 出力形式:

    以下の形式の純粋なJSONオブジェクトのみを返してください。
    コード例やマークダウン記法は使用せず、以下のJSONスキーマに完全に準拠した
    オブジェクトのみを返してください。

    {
      "representative": {
        "value": "代表者名",
        "source": ["情報源URL1", "情報源URL2"]
      },
      "corporateUrl": {
        "value": "企業のURL",
        "source": ["情報源URL1", "情報源URL2"]
      },
      "landingPages": {
        "value": ["LP URL1", "LP URL2"],
        "source": ["情報源URL1", "情報源URL2"]
      },
      "phone": {
        "value": "電話番号",
        "source": ["情報源URL"]
      },
      "employees": {
        "value": 従業員数,
        "source": ["情報源URL"]
      },
      "founded": {
        "value": "YYYY-MM-DD",
        "source": ["情報源URL1", "情報源URL2"]
      },
      "overview": {
        "value": "企業概要",
        "source": ["情報源URL1", "情報源URL2"]
      }
    }
    `,
  evals: {
    summarization: new SummarizationMetric(model),
    contentSimilarity: new ContentSimilarityMetric(),
    tone: new ToneConsistencyMetric(),
  },
});

/**
 * 企業名から企業データを取得する関数
 * Agentを直接呼び出し、CompanyData型のオブジェクトを返す
 * @param companyName 企業名
 * @param location 所在地（オプション）
 * @returns 企業データ
 */
export async function fetchCompanyData(companyName: string, location?: string): Promise<CompanyData | null> {
  const prompt = `企業名: ${companyName}${location ? `\n所在地: ${location}` : ''}`;
  const result = await companyDataAgent.generate(prompt);
  
  if (result && result.text) {
    return parseCompanyData(result.text);
  }
  
  return null;
}


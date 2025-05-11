import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { mcp } from "../mcp";

export interface CompanyCandidate {
  /** 13 桁の法人番号（見つからない場合は空文字列） */
  corporateNumber: string;
  /** 企業名（必須） */
  name: string;
  /** 本店所在地（取れない場合は空文字列） */
  address: string;
}

export const companyIdentifierAgent = new Agent({
  name: "CompanyIdentifierAgent",
  model: openai("gpt-4.1-mini"),

  /** システムプロンプト */
  instructions: `
  あなたは企業情報検索エージェントです。

  (1) 入力で受け取った企業名を調べる時は
      Perplexity MCP サーバーのperplexity_askツール
      を必ず使ってください。

  (2) 具体的な手順は以下の通りです。
      ① perplexity_ask で <企業名> の法人番号・企業名・所在地を教えてください を検索
      ② 検索結果から法人番号・企業名・所在地を抽出

  (3) ツール呼び出しは内部処理としてのみ使い、
      ユーザーへの最終出力は必ず下記TypeScript型の配列のみとしてください。
      ツール呼び出し用JSONや中間出力は絶対に返さないこと。

  (4) 最終的に取得した情報を
      ↓ の TypeScript 型そのままの JSON 配列で応答してください。
  type CompanyCandidate = {
    corporateNumber: string; // 13桁 or ""
    name: string;            // 企業名
    address: string;         // 所在地 or ""
  }
  余分な文章は一切付けないこと。`,

  tools: async () => {
    const tools = await mcp.getTools();
    console.log(process.env.HOGE)
    return {
      "perplexity-ask_perplexity_ask": tools["perplexity-ask_perplexity_ask"],
    };
  },
});
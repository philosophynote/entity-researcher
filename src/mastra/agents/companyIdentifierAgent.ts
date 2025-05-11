import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { mcp } from "../mcp";
import { getCompanyCandidates } from "../tools/getCompanyCandidates";

/**
 * 企業候補の型定義
 */
export type CompanyCandidate = {
  corporateNumber: string; // 法人番号
  name: string;            // 企業名
  address: string;         // 所在地
};

// /**
//  * Brave Search MCPサーバーツールを利用して企業候補を取得する
//  */
// const getCompanyCandidates = async (query: string): Promise<CompanyCandidate[]> => {
//   const tools = await mcp.getTools();
//   const braveSearchTool = tools['brave-search_brave_web_search']
//   if (!braveSearchTool) return [];
//   const result = await braveSearchTool.execute({ query });
//   if (!result || !Array.isArray(result.results)) return [];
//   return result.results.map((item: any) => ({
//     corporateNumber: item.corporateNumber ?? '',
//     name: item.name ?? item.title ?? '',
//     address: item.address ?? '',
//   })).filter((c: CompanyCandidate) => c.name);
// };

// @ts-ignore 型定義が追いついていない場合の一時対応
const companyIdentifierAgent = new Agent({
  name: "companyIdentifierAgent",
  instructions: 
  `
  あなたは企業名から法人番号・企業名・所在地を検索するエージェントです。
  WEB検索を行って企業候補を取得してください。
  回答は必ず日本語で行ってください。
  `,
  model: openai("gpt-4o-mini"),
  tools: {
    getCompanyCandidates
  },
});

export default companyIdentifierAgent; 
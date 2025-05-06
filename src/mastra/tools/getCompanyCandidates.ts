import { createTool } from "@mastra/core/tools";
import { mcp } from "../mcp";
import { z } from "zod";

export const getCompanyCandidates = createTool({
  id: "getCompanyCandidates",
  description: "企業名やキーワードから企業候補（法人番号・企業名・所在地）を取得する",
  inputSchema: z.object({
    query: z.string().describe("検索クエリ"),
  }),
  execute: async ({ input }) => {
    const query = input?.query ?? input?.input?.query ?? input?.params?.query;
    const tools = await mcp.getTools();
    const braveSearchTool =
      tools["brave-search_search"] ||
      tools["brave-search_query"] ||
      tools["brave-search_braveSearch"];
    if (!braveSearchTool) return [];
    const result = await braveSearchTool.execute({ query });
    if (!result || !Array.isArray(result.results)) return [];
    return result.results.map((item: any) => ({
      corporateNumber: item.corporateNumber ?? "",
      name: item.name ?? item.title ?? "",
      address: item.address ?? "",
    })).filter((c: any) => c.name);
  },
}); 
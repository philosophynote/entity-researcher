// src/mastra/tools/getCompanyCandidates.ts
import { createTool } from "@mastra/core/tools";
import { mcp } from "../mcp";
import { z } from "zod";

/** 返却レコードの型 */
export type CompanyCandidate = {
  corporateNumber: string; // 法人番号
  name: string;            // 企業名
  address: string;         // 所在地
};

export const getCompanyCandidates = createTool({
  id: "getCompanyCandidates",
  description:
    `
    企業名やキーワードをWEB検索して企業候補（法人番号・企業名・所在地）を取得する
    企業名を調べるときは必ず brave-search_brave_web_search を { "query": "<企業名>" } の形式で呼び出してください。
    `,

  /* 入力スキーマ ---------------------------------------------------- */
  // inputSchema: z.object({
  //   query: z.string(),
  // }),

  /* 出力スキーマ ---------------------------------------------------- */
  outputSchema: z.array(
    z.object({
      corporateNumber: z.string(),
      name: z.string(),
      address: z.string(),
    }),
  ),

  /* 実装 ------------------------------------------------------------ */
  async execute({ context }) {
    const { query } = context as { query: string };        // ← ★ ここ
    if (!query) return []
    // Brave Search MCP ツールを取得
    console.log("mcp.getTools()")
    console.log(await mcp.getTools())
    const braveSearch =
      (await mcp.getTools())["brave-search_brave_web_search"];
    console.log("braveSearch")
    console.log(braveSearch)
    if (!braveSearch) throw new Error("Brave Search tool not found");

    // 必須キーは query だけ
    const res = await braveSearch({ query });   // ← 推奨書式
    console.log("res")
    console.log(res)
    console.log("[getCompanyCandidates] raw res =", JSON.stringify(res, null, 2));

    // Brave Search の実装によっては results か content に返る
    // const results =
    //   res.results ??
    //   JSON.parse(res.content?.[0]?.text ?? "[]");

    return res.results
      .map((r: any) => ({
        corporateNumber: r.corporateNumber ?? "",
        name:            r.name ?? r.title ?? "",
        address:         r.address ?? r.location ?? "",
      }))
      .filter((c: CompanyCandidate) => c.name);
  },
});

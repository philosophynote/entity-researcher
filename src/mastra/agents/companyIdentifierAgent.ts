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
  あなたは企業検索エージェントです。

  (1) 入力で受け取った企業名を調べる時は
      Playwright MCP サーバーのブラウザ操作ツール群
      （browser_navigate, browser_snapshot, browser_type, browser_click など）
      を必ず使ってください。

  (2) 具体的な手順は以下の通りです。
      ① browser_navigate で アラームボックス企業情報サイト にアクセス
      ② browser_snapshot でページ構造を取得
      ③ 企業名入力欄を特定し、browser_type で <企業名> を入力
      ④ 検索ボタンを browser_click で押下
      ⑤ 結果ページが表示されたら browser_snapshot で取得し、法人番号・企業名・所在地を抽出

  (3) 各ツール呼び出しは **ツールが要求する引数オブジェクトのみ** を JSON で出力してください。
      例: play*wright*_*browser_navigate* を呼ぶ場合は次のように出力します。
      {
        "url": "https://alarmbox.jp/companyinfo/"
      }

  (4) 最終的に取得した情報を
      ↓ の TypeScript 型そのままの JSON 配列で応答してください。
  type CompanyCandidate = {
    corporateNumber: string; // 13桁 or ""
    name: string;            // 企業名
    address: string;         // 所在地 or ""
  }
  余分な文章は一切付けないこと。`,


  tools: async () => ({
    ...(await mcp.getTools()),            // 例: playwright_browser_navigate
  }),
});
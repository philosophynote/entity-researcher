import { MCPClient } from "@mastra/mcp";

/**
 * MCP サーバー設定
 * すべて STDIO で起動し、必要に応じて API キーを環境変数で渡す。
 */

// グローバルスコープでシングルトン化
const globalForMcp = globalThis as unknown as { mcp?: MCPClient };

export const mcp =
  globalForMcp.mcp ??
  (globalForMcp.mcp = new MCPClient({
    servers: {
      // ──────────────────────────────────────────────────────────
      // Playwright MCP  ─ ブラウザ自動操作
      // ──────────────────────────────────────────────────────────
      /**
       * @playwright/mcp v0.0.20（2025-05-03 時点の最新版）の
       * headless モードを利用。`-y` を付けて npx の確認を抑止。
       * 画面付きで動かしたい場合は --headless を外す。
       */
      "playwright": {
        command: "npx",
        args: [
          "-y",
          "@playwright/mcp@latest",
          "--headless",
        ],
      },

      // ──────────────────────────────────────────────────────────
      // Brave Search MCP  ─ Web 検索
      // ──────────────────────────────────────────────────────────
      /**
       * Brave Search API キーは .env などで
       *   BRAVE_API_KEY=xxxxxxxxxxxxxxxx
       * を定義しておく。
       *
       * 利用できるリモートツール:
       *   brave_web_search, brave_local_search
       * → 例: await mcp.getTool("brave-search#brave_web_search")
       */
      "brave-search": {
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-brave-search",
          // "--stdio" は明示不要（デフォルトが stdio）
        ],
        env: {
          BRAVE_API_KEY: process.env.BRAVE_API_KEY ?? "",
        },
      },

      // ──────────────────────────────────────────────────────────
      // Perplexity Ask MCP  ─ Sonar API 連携
      // ──────────────────────────────────────────────────────────
      /**
       * Perplexity Sonar API キーは .env で
       *   PERPLEXITY_API_KEY=xxxxxxxxxxxxxxxx
       * を定義。
       *
       * 利用できるリモートツール:
       *   perplexity_ask
       * → 例: await mcp.getTool("perplexity-ask#perplexity_ask")
       */
      "perplexity-ask": {
        command: "npx",
        args: [
          "-y",
          "server-perplexity-ask",
        ],
        env: {
          PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY ?? "",
        },
      },
    },
  }));

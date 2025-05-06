import { MCPClient } from "@mastra/mcp";

export const mcp = new MCPClient({
  servers: {
    // Stdio
    "playwright": {
      command: 'npx',
      args: [
        '@playwright/mcp@latest',
        '--headless'
      ],
    },
    "brave-search": {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: {
        BRAVE_API_KEY: process.env.BRAVE_API_KEY ?? "",
      },
    },
    "perplexity-ask": {
      command: 'npx',
      args: [
        "-y",
        "server-perplexity-ask"
      ],
      env: {
        PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || '',
      },
    },
  },
});
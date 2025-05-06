import { MCPClient } from "@mastra/mcp";

export const mcp = new MCPClient({
  servers: {
    // Stdio
    playwright: {
      command: 'npx',
      args: [
        '@playwright/mcp@latest',
        '--headless'
      ],
    },
  },
});
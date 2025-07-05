import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "computer-control",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

server.tool(
  "typeText",
  "Type a string of text",
  {
    text: z.string().describe("The text to type"),
  },
  async ({ text }) => {
    return {
      content: [
        {
          type: "text",
          text: `Would type: ${text}`,
        },
      ],
    };
  },
);

server.tool(
  "pressKey",
  "Press a key or key combination",
  {
    key: z.string().describe("The key to press (e.g. 'enter', 'tab', 'cmd+t')"),
  },
  async ({ key }) => {
    return {
      content: [
        {
          type: "text",
          text: `Would press key: ${key}`,
        },
      ],
    };
  },
);

server.tool(
  "getWindowList",
  "Get a list of open windows",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: "Would return window list",
        },
      ],
    };
  },
);

server.tool(
  "openApplication",
  "Launch an application by name",
  {
    appName: z.string().describe("The name of the application to open"),
  },
  async ({ appName }) => {
    return {
      content: [
        {
          type: "text",
          text: `Would open application: ${appName}`,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
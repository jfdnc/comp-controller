import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { keyboard, Key } from "@nut-tree-fork/nut-js";

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
    try {
      await keyboard.type(text);
      return {
        content: [
          {
            type: "text",
            text: `Typed: ${text}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error typing text: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "pressKey",
  "Press a key or key combination",
  {
    key: z.string().describe("The key to press (e.g. 'enter', 'tab', 'cmd+t')"),
  },
  async ({ key }) => {
    try {
      if (key === "enter") {
        await keyboard.pressKey(Key.Enter);
      } else if (key === "tab") {
        await keyboard.pressKey(Key.Tab);
      } else if (key === "cmd+t") {
        await keyboard.pressKey(Key.LeftCmd, Key.T);
      } else {
        await keyboard.pressKey(Key[key] || key);
      }
      return {
        content: [
          {
            type: "text",
            text: `Pressed key: ${key}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error pressing key: ${error.message}`,
          },
        ],
      };
    }
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
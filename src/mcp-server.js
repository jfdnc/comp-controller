import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { keyboard, Key, getWindows } from "@nut-tree-fork/nut-js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
import { KeyboardShortcutService } from "./services/keyboard-shortcuts.js";

const shortcutService = new KeyboardShortcutService();

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
  "executeAction",
  "Execute a semantic keyboard action",
  {
    action: z.string().describe("Semantic action to execute (e.g. 'open spotlight', 'copy', 'new tab', 'save', 'find')"),
  },
  async ({ action }) => {
    try {
      await shortcutService.executeShortcut(action);
      return {
        content: [
          {
            type: "text",
            text: `Executed action: ${action}`,
          },
        ],
      };
    } catch (error) {
      const availableActions = shortcutService.getAvailableActions();
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}. Available actions: ${availableActions.join(', ')}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "pressKey",
  "Press a raw key or key combination",
  {
    key: z.string().describe("The key to press (e.g. 'enter', 'tab', 'escape')"),
  },
  async ({ key }) => {
    try {
      if (key === "enter") {
        await keyboard.pressKey(Key.Enter);
      } else if (key === "tab") {
        await keyboard.pressKey(Key.Tab);
      } else if (key === "escape") {
        await keyboard.pressKey(Key.Escape);
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
  "getAvailableActions",
  "Get a list of all available semantic keyboard actions",
  {},
  async () => {
    const actions = shortcutService.getAvailableActions();
    return {
      content: [
        {
          type: "text",
          text: `Available actions: ${actions.join(', ')}`,
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
    try {
      const windows = await getWindows();
      const windowList = await Promise.all(
        windows.map(async (window, index) => {
          const title = await window.getTitle();
          const region = await window.getRegion();
          return `${index + 1}. "${title}" (${region.width}x${region.height} at ${region.left},${region.top})`;
        })
      );
      
      return {
        content: [
          {
            type: "text",
            text: windowList.length > 0 
              ? `Open windows:\n${windowList.join('\n')}`
              : "No windows found",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting window list: ${error.message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "openApplication",
  "Launch an application by name",
  {
    appName: z.string().describe("The name of the application to open (e.g. 'Chrome', 'TextEdit', 'Finder')"),
  },
  async ({ appName }) => {
    try {
      if (process.platform === 'darwin') {
        // On macOS, use the 'open' command
        await execAsync(`open -a "${appName}"`);
        return {
          content: [
            {
              type: "text",
              text: `Launched application: ${appName}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Application launching not implemented for platform: ${process.platform}`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error launching application "${appName}": ${error.message}`,
          },
        ],
      };
    }
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
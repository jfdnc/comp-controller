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
  "executeSequence",
  "Execute a sequence of actions with guaranteed ordering and proper awaiting",
  {
    actions: z.array(z.object({
      tool: z.string().describe("The tool name to execute"),
      args: z.record(z.any()).describe("Arguments for the tool")
    })).describe("Array of actions to execute in sequence")
  },
  async ({ actions }) => {
    const results = [];
    
    try {
      for (const action of actions) {
        let result;
        
        switch (action.tool) {
          case "typeText":
            await keyboard.type(action.args.text);
            result = `Typed: ${action.args.text}`;
            break;
            
          case "pressKey":
            if (action.args.key === "enter") {
              await keyboard.pressKey(Key.Enter);
            } else if (action.args.key === "tab") {
              await keyboard.pressKey(Key.Tab);
            } else if (action.args.key === "escape") {
              await keyboard.pressKey(Key.Escape);
            } else {
              await keyboard.pressKey(Key[action.args.key] || action.args.key);
            }
            result = `Pressed key: ${action.args.key}`;
            break;
            
          case "executeAction":
            await shortcutService.executeShortcut(action.args.action);
            result = `Executed action: ${action.args.action}`;
            break;
            
          case "openApplication":
            if (process.platform === 'darwin') {
              await execAsync(`open -a "${action.args.appName}"`);
              result = `Launched application: ${action.args.appName}`;
            } else {
              result = `Application launching not implemented for platform: ${process.platform}`;
            }
            break;
            
          default:
            result = `Unknown tool: ${action.tool}`;
        }
        
        results.push(`${action.tool}: ${result}`);
      }
      
      return {
        content: [
          {
            type: "text",
            text: `Executed ${actions.length} actions:\n${results.join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error in sequence at step ${results.length + 1}: ${error.message}`,
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

server.tool(
  "focusWindow",
  "Focus a window by title or partial title match",
  {
    windowTitle: z.string().describe("The window title or partial title to focus (e.g. 'Chrome', 'TextEdit', 'Untitled')"),
  },
  async ({ windowTitle }) => {
    try {
      const windows = await getWindows();
      
      // Find window by exact or partial title match
      let targetWindow = null;
      for (const window of windows) {
        const title = await window.getTitle();
        if (title === windowTitle || title.includes(windowTitle)) {
          targetWindow = window;
          break;
        }
      }
      
      if (!targetWindow) {
        const windowTitles = await Promise.all(
          windows.map(async (window) => await window.getTitle())
        );
        return {
          content: [
            {
              type: "text",
              text: `Window not found: "${windowTitle}". Available windows: ${windowTitles.filter(t => t.length > 0).join(', ')}`,
            },
          ],
        };
      }
      
      await targetWindow.focus();
      const focusedTitle = await targetWindow.getTitle();
      
      return {
        content: [
          {
            type: "text",
            text: `Focused window: "${focusedTitle}"`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error focusing window: ${error.message}`,
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
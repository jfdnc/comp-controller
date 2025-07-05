import { z } from "zod";
import { keyboard, Key } from "@nut-tree-fork/nut-js";
import { KeyboardShortcutService } from "../services/keyboard-shortcuts.js";
import { exec } from "child_process";
import { promisify } from "util";

const shortcutService = new KeyboardShortcutService();
const execAsync = promisify(exec);

export const executeSequenceTool = {
  name: "executeSequence",
  description: "Execute a sequence of actions with guaranteed ordering and proper awaiting",
  schema: {
    actions: z.array(z.object({
      tool: z.string().describe("The tool name to execute"),
      args: z.record(z.any()).describe("Arguments for the tool")
    })).describe("Array of actions to execute in sequence")
  },
  handler: async ({ actions }) => {
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
};
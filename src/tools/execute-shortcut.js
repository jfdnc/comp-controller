import { z } from "zod";
import { KeyboardShortcutService } from "../services/keyboard-shortcuts.js";
import { getAvailableActions } from "./get-available-actions.js";

const shortcutService = new KeyboardShortcutService();

export async function executeAction(action) {
  await shortcutService.executeShortcut(action);
}

export const executeActionTool = {
  name: "executeAction",
  description: "Execute a semantic keyboard action",
  schema: {
    action: z.string().describe("Semantic action to execute (e.g. 'open spotlight', 'copy', 'new tab', 'save', 'find')"),
  },
  handler: async ({ action }) => {
    try {
      await executeAction(action);
      return {
        content: [
          {
            type: "text",
            text: `Executed action: ${action}`,
          },
        ],
      };
    } catch (error) {
      const availableActions = getAvailableActions();
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
};
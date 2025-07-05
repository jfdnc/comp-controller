import { z } from "zod";
import { KeyboardShortcutService } from "../services/keyboard-shortcuts.js";
import { getAvailableShortcuts } from "./get-available-shortcuts.js";

const shortcutService = new KeyboardShortcutService();

/**
 * Execute a semantic keyboard shortcut
 * @param {string} shortcut - The semantic name of the shortcut to execute
 * @returns {Promise<void>}
 */
export async function executeShortcut(shortcut) {
  await shortcutService.executeShortcut(shortcut);
}

/**
 * MCP tool definition for executing semantic keyboard shortcuts
 */
export const executeShortcutTool = {
  name: "executeShortcut",
  description: "Execute a semantic keyboard shortcut",
  schema: {
    shortcut: z.string().describe("Semantic shortcut to execute (e.g. 'open spotlight', 'copy', 'new tab', 'save', 'find')"),
  },
  /**
   * MCP handler for executing semantic keyboard shortcuts
   * @param {Object} params - Handler parameters
   * @param {string} params.shortcut - The semantic shortcut to execute
   * @returns {Promise<Object>} MCP response object
   */
  handler: async ({ shortcut }) => {
    try {
      await executeShortcut(shortcut);
      return {
        content: [
          {
            type: "text",
            text: `Executed shortcut: ${shortcut}`,
          },
        ],
      };
    } catch (error) {
      const availableShortcuts = getAvailableShortcuts();
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}. Available shortcuts: ${availableShortcuts.join(', ')}`,
          },
        ],
      };
    }
  },
};
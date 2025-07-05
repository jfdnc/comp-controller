import { z } from "zod";
import { KeyboardShortcutService } from "../services/keyboard-shortcuts.js";

const shortcutService = new KeyboardShortcutService();

/**
 * Get all available semantic keyboard shortcuts for the current platform
 * @returns {string[]} Array of available semantic shortcut names
 */
export function getAvailableShortcuts() {
  return shortcutService.getAvailableActions();
}

/**
 * MCP tool definition for getting available semantic keyboard shortcuts
 */
export const getAvailableShortcutsTool = {
  name: "getAvailableShortcuts",
  description: "Get a list of all available semantic keyboard shortcuts",
  schema: {},
  /**
   * MCP handler for getting available shortcuts
   * @returns {Promise<Object>} MCP response object with available shortcuts
   */
  handler: async () => {
    const shortcuts = getAvailableShortcuts();
    return {
      content: [
        {
          type: "text",
          text: `Available shortcuts: ${shortcuts.join(', ')}`,
        },
      ],
    };
  },
};
import { z } from "zod";
import { keyboard, Key } from "@nut-tree-fork/nut-js";

/**
 * Presses a single key or key combination using the system keyboard
 * Handles common key mappings and falls back to Key enum lookup
 * @param {string} key - The key identifier to press (e.g., 'enter', 'tab', 'escape')
 * @returns {Promise<void>}
 * @throws {Error} When nut.js keyboard operations fail or key is invalid
 */
export async function pressKey(key) {
  if (key === "enter") {
    await keyboard.pressKey(Key.Enter);
  } else if (key === "tab") {
    await keyboard.pressKey(Key.Tab);
  } else if (key === "escape") {
    await keyboard.pressKey(Key.Escape);
  } else {
    await keyboard.pressKey(Key[key] || key);
  }
}

/**
 * MCP tool definition for pressing raw keys
 * Provides direct key press functionality without semantic interpretation
 */
export const pressKeyTool = {
  name: "pressKey",
  description: "Press a raw key or key combination",
  schema: {
    key: z.string().describe("The key to press (e.g. 'enter', 'tab', 'escape')"),
  },
  /**
   * MCP handler for the pressKey tool
   * @param {Object} params - Tool parameters
   * @param {string} params.key - The key identifier to press
   * @returns {Promise<Object>} MCP response object with success/error message
   */
  handler: async ({ key }) => {
    try {
      await pressKey(key);
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
};
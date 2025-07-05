import { z } from "zod";
import { keyboard } from "@nut-tree-fork/nut-js";

/**
 * Types the specified text string using the system keyboard
 * @param {string} text - The text string to type
 * @returns {Promise<void>}
 * @throws {Error} When nut.js keyboard operations fail
 */
export async function typeText(text) {
  await keyboard.type(text);
}

/**
 * MCP tool definition for typing text strings
 * Provides schema validation and error handling for the typeText function
 */
export const typeTextTool = {
  name: "typeText",
  description: "Type a string of text",
  schema: {
    text: z.string().describe("The text to type"),
  },
  /**
   * MCP handler for the typeText tool
   * @param {Object} params - Tool parameters
   * @param {string} params.text - The text to type
   * @returns {Promise<Object>} MCP response object with success/error message
   */
  handler: async ({ text }) => {
    try {
      await typeText(text);
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
};
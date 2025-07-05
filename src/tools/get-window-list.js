import { z } from "zod";
import { getWindows } from "@nut-tree-fork/nut-js";

/**
 * Retrieves a list of all currently open windows with their details
 * @returns {Promise<string>} Formatted string containing window information including titles, dimensions, and positions
 * @throws {Error} When nut.js window operations fail
 */
export async function getWindowList() {
  const windows = await getWindows();
  const windowList = await Promise.all(
    windows.map(async (window, index) => {
      const title = await window.getTitle();
      const region = await window.getRegion();
      return `${index + 1}. "${title}" (${region.width}x${region.height} at ${region.left},${region.top})`;
    })
  );
  
  return windowList.length > 0 
    ? `Open windows:\n${windowList.join('\n')}`
    : "No windows found";
}

/**
 * MCP tool definition for listing open windows
 * Provides visibility into current system state for window management operations
 */
export const getWindowListTool = {
  name: "getWindowList",
  description: "Get a list of open windows",
  schema: {},
  /**
   * MCP handler for the getWindowList tool
   * @returns {Promise<Object>} MCP response object with formatted window list or error message
   */
  handler: async () => {
    try {
      const result = await getWindowList();
      return {
        content: [
          {
            type: "text",
            text: result,
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
};
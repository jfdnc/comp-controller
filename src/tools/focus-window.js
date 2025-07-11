import { z } from "zod";
import { getWindows } from "@nut-tree-fork/nut-js";

/**
 * Focuses a window by finding it via exact or partial title match
 * @param {string} windowTitle - The window title or partial title to search for
 * @returns {Promise<string>} The actual title of the focused window
 * @throws {Error} When no matching window is found or focus operation fails
 */
export async function focusWindow(windowTitle) {
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
    throw new Error(`Window not found: "${windowTitle}". Available windows: ${windowTitles.filter(t => t.length > 0).join(', ')}`);
  }
  
  await targetWindow.focus();
  const focusedTitle = await targetWindow.getTitle();
  return focusedTitle;
}

/**
 * MCP tool definition for focusing windows
 * Enables switching focus to specific windows by title matching
 */
export const focusWindowTool = {
  name: "focusWindow",
  description: "Focus a window by title or partial title match",
  schema: {
    windowTitle: z.string().describe("The window title or partial title to focus (e.g. 'Chrome', 'TextEdit', 'Untitled')"),
  },
  /**
   * MCP handler for the focusWindow tool
   * @param {Object} params - Tool parameters
   * @param {string} params.windowTitle - The window title or partial title to focus
   * @returns {Promise<Object>} MCP response object with focused window title or error with available windows
   */
  handler: async ({ windowTitle }) => {
    try {
      const focusedTitle = await focusWindow(windowTitle);
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
};
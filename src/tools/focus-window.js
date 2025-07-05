import { z } from "zod";
import { getWindows } from "@nut-tree-fork/nut-js";

export const focusWindowTool = {
  name: "focusWindow",
  description: "Focus a window by title or partial title match",
  schema: {
    windowTitle: z.string().describe("The window title or partial title to focus (e.g. 'Chrome', 'TextEdit', 'Untitled')"),
  },
  handler: async ({ windowTitle }) => {
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
};
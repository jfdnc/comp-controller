import { z } from "zod";
import { getWindows } from "@nut-tree-fork/nut-js";

export const getWindowListTool = {
  name: "getWindowList",
  description: "Get a list of open windows",
  schema: {},
  handler: async () => {
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
};
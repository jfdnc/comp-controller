import { z } from "zod";
import { keyboard, Key } from "@nut-tree-fork/nut-js";

export const pressKeyTool = {
  name: "pressKey",
  description: "Press a raw key or key combination",
  schema: {
    key: z.string().describe("The key to press (e.g. 'enter', 'tab', 'escape')"),
  },
  handler: async ({ key }) => {
    try {
      if (key === "enter") {
        await keyboard.pressKey(Key.Enter);
      } else if (key === "tab") {
        await keyboard.pressKey(Key.Tab);
      } else if (key === "escape") {
        await keyboard.pressKey(Key.Escape);
      } else {
        await keyboard.pressKey(Key[key] || key);
      }
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
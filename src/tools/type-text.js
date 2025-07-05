import { z } from "zod";
import { keyboard } from "@nut-tree-fork/nut-js";

export async function typeText(text) {
  await keyboard.type(text);
}

export const typeTextTool = {
  name: "typeText",
  description: "Type a string of text",
  schema: {
    text: z.string().describe("The text to type"),
  },
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
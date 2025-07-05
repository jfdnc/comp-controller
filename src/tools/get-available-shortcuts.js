import { z } from "zod";
import { KeyboardShortcutService } from "../services/keyboard-shortcuts.js";

const shortcutService = new KeyboardShortcutService();

export function getAvailableActions() {
  return shortcutService.getAvailableActions();
}

export const getAvailableActionsTool = {
  name: "getAvailableActions",
  description: "Get a list of all available semantic keyboard actions",
  schema: {},
  handler: async () => {
    const actions = getAvailableActions();
    return {
      content: [
        {
          type: "text",
          text: `Available actions: ${actions.join(', ')}`,
        },
      ],
    };
  },
};
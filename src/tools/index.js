// Tool registry
export { typeTextTool, typeText } from './type-text.js';
export { pressKeyTool, pressKey } from './press-key.js';
export { executeShortcutTool, executeShortcut } from './execute-shortcut.js';
export { getAvailableShortcutsTool, getAvailableShortcuts } from './get-available-shortcuts.js';
export { getWindowListTool, getWindowList } from './get-window-list.js';
export { openApplicationTool, openApplication } from './open-application.js';
export { focusWindowTool, focusWindow } from './focus-window.js';
export { executeToolSequenceTool, executeToolSequence } from './execute-tool-sequence.js';

// Enhanced tool registry mapping tool names to their MCP tools and business functions
export const TOOL_REGISTRY = {
  typeText: { tool: typeTextTool, func: typeText },
  pressKey: { tool: pressKeyTool, func: pressKey },
  executeShortcut: { tool: executeShortcutTool, func: executeShortcut },
  getAvailableShortcuts: { tool: getAvailableShortcutsTool, func: getAvailableShortcuts },
  getWindowList: { tool: getWindowListTool, func: getWindowList },
  openApplication: { tool: openApplicationTool, func: openApplication },
  focusWindow: { tool: focusWindowTool, func: focusWindow },
  executeToolSequence: { tool: executeToolSequenceTool, func: executeToolSequence },
};

// Extract just the business functions for sequence execution
export const TOOL_FUNCTIONS = Object.fromEntries(
  Object.entries(TOOL_REGISTRY).map(([name, {func}]) => [name, func])
);

// Helper function to register all tools with a server
export function registerAllTools(server) {
  const tools = Object.values(TOOL_REGISTRY).map(({tool}) => tool);

  tools.forEach(tool => {
    server.tool(
      tool.name,
      tool.description,
      tool.schema,
      tool.handler
    );
  });
}
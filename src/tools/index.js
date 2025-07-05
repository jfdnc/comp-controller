// Tool registry
export { typeTextTool } from './type-text.js';
export { pressKeyTool } from './press-key.js';
export { executeActionTool } from './execute-action.js';
export { getAvailableActionsTool } from './get-available-actions.js';
export { getWindowListTool } from './get-window-list.js';
export { openApplicationTool } from './open-application.js';
export { focusWindowTool } from './focus-window.js';
export { executeSequenceTool } from './execute-sequence.js';

// Helper function to register all tools with a server
export function registerAllTools(server) {
  const tools = [
    typeTextTool,
    executeActionTool,
    pressKeyTool,
    getAvailableActionsTool,
    getWindowListTool,
    openApplicationTool,
    focusWindowTool,
    executeSequenceTool,
  ];

  tools.forEach(tool => {
    server.tool(
      tool.name,
      tool.description,
      tool.schema,
      tool.handler
    );
  });
}
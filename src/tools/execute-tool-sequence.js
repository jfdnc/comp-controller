import { z } from "zod";
import { TOOL_FUNCTIONS } from "./index.js";

export async function executeSequence(actions) {
  const results = [];
  
  for (const action of actions) {
    const func = TOOL_FUNCTIONS[action.tool];
    if (!func) {
      throw new Error(`Unknown tool: ${action.tool}. Available tools: ${Object.keys(TOOL_FUNCTIONS).join(', ')}`);
    }
    
    // Execute the function with the provided args
    const functionResult = await func(action.args);
    
    // Generate result message - use function result if it's a string, otherwise create generic message
    let result;
    if (typeof functionResult === 'string') {
      // Functions like focusWindow return descriptive strings
      result = functionResult;
    } else if (Array.isArray(functionResult)) {
      // Functions like getAvailableActions return arrays
      result = `Retrieved ${functionResult.length} items`;
    } else if (functionResult === undefined || functionResult === null) {
      // Most action functions don't return values, create descriptive message
      const firstArgValue = Object.values(action.args)[0];
      if (firstArgValue) {
        result = `${action.tool}: ${firstArgValue}`;
      } else {
        result = `Executed ${action.tool}`;
      }
    } else {
      result = `${action.tool} completed`;
    }
    
    results.push(result);
  }
  
  return results;
}

export const executeSequenceTool = {
  name: "executeSequence",
  description: "Execute a sequence of actions with guaranteed ordering and proper awaiting",
  schema: {
    actions: z.array(z.object({
      tool: z.string().describe("The tool name to execute"),
      args: z.record(z.any()).describe("Arguments for the tool")
    })).describe("Array of actions to execute in sequence")
  },
  handler: async ({ actions }) => {
    try {
      const results = await executeSequence(actions);
      return {
        content: [
          {
            type: "text",
            text: `Executed ${actions.length} actions:\n${results.join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error in sequence: ${error.message}`,
          },
        ],
      };
    }
  },
};
import { z } from "zod";
import { TOOL_FUNCTIONS } from "./index.js";

/**
 * Execute a sequence of tool actions with guaranteed ordering and proper awaiting
 * @param {Array<Object>} actions - Array of action objects with tool and args properties
 * @param {string} actions[].tool - The name of the tool to execute
 * @param {Object} actions[].args - Arguments to pass to the tool
 * @returns {Promise<string[]>} Array of result messages from each executed action
 * @throws {Error} If any tool in the sequence is unknown
 */
export async function executeToolSequence(actions) {
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

/**
 * MCP tool definition for executing sequences of tool actions
 */
export const executeToolSequenceTool = {
  name: "executeToolSequence",
  description: "Execute a sequence of tool actions with guaranteed ordering and proper awaiting",
  schema: {
    actions: z.array(z.object({
      tool: z.string().describe("The tool name to execute"),
      args: z.record(z.any()).describe("Arguments for the tool")
    })).describe("Array of actions to execute in sequence")
  },
  /**
   * MCP handler for executing tool sequences
   * @param {Object} params - Handler parameters
   * @param {Array<Object>} params.actions - Array of tool actions to execute
   * @returns {Promise<Object>} MCP response object
   */
  handler: async ({ actions }) => {
    try {
      const results = await executeToolSequence(actions);
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
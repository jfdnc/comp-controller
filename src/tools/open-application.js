import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Launches an application by name using platform-specific commands
 * Currently supports macOS via the 'open' command
 * @param {string} appName - The name of the application to launch (e.g., 'Chrome', 'TextEdit')
 * @returns {Promise<void>}
 * @throws {Error} When the platform is unsupported or application launch fails
 */
export async function openApplication(appName) {
  if (process.platform === 'darwin') {
    // On macOS, use the 'open' command
    await execAsync(`open -a "${appName}"`);
  } else {
    throw new Error(`Application launching not implemented for platform: ${process.platform}`);
  }
}

/**
 * MCP tool definition for launching applications
 * Provides cross-platform application launching capabilities
 */
export const openApplicationTool = {
  name: "openApplication",
  description: "Launch an application by name",
  schema: {
    appName: z.string().describe("The name of the application to open (e.g. 'Chrome', 'TextEdit', 'Finder')"),
  },
  /**
   * MCP handler for the openApplication tool
   * @param {Object} params - Tool parameters
   * @param {string} params.appName - The name of the application to launch
   * @returns {Promise<Object>} MCP response object with success/error message
   */
  handler: async ({ appName }) => {
    try {
      await openApplication(appName);
      return {
        content: [
          {
            type: "text",
            text: `Launched application: ${appName}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error launching application "${appName}": ${error.message}`,
          },
        ],
      };
    }
  },
};
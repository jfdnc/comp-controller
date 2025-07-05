import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function openApplication(appName) {
  if (process.platform === 'darwin') {
    // On macOS, use the 'open' command
    await execAsync(`open -a "${appName}"`);
  } else {
    throw new Error(`Application launching not implemented for platform: ${process.platform}`);
  }
}

export const openApplicationTool = {
  name: "openApplication",
  description: "Launch an application by name",
  schema: {
    appName: z.string().describe("The name of the application to open (e.g. 'Chrome', 'TextEdit', 'Finder')"),
  },
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
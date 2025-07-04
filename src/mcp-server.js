import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { mouse, keyboard, screen, straightTo, centerOf, getWindows, getActiveWindow, Region } from "@nut-tree-fork/nut-js";

class ComputerControlMCPServer {
  constructor() {
    this.server = new Server({
      name: "computer-control",
      version: "1.0.0",
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "takeScreenshot",
            description: "Take a screenshot of the current screen",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "clickAt",
            description: "Click at specific coordinates",
            inputSchema: {
              type: "object",
              properties: {
                x: {
                  type: "number",
                  description: "X coordinate",
                },
                y: {
                  type: "number",
                  description: "Y coordinate",
                },
              },
              required: ["x", "y"],
            },
          },
          {
            name: "typeText",
            description: "Type text at the current cursor position",
            inputSchema: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "Text to type",
                },
              },
              required: ["text"],
            },
          },
          {
            name: "pressKey",
            description: "Press a specific key",
            inputSchema: {
              type: "object",
              properties: {
                key: {
                  type: "string",
                  description: "Key to press (e.g., 'return', 'tab', 'escape')",
                },
              },
              required: ["key"],
            },
          },
          {
            name: "getWindowList",
            description: "Get list of open windows",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "openApplication",
            description: "Open an application by name",
            inputSchema: {
              type: "object",
              properties: {
                appName: {
                  type: "string",
                  description: "Name of the application to open",
                },
              },
              required: ["appName"],
            },
          },
          {
            name: "getMousePosition",
            description: "Get current mouse cursor position",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "wait",
            description: "Wait for a specified amount of time",
            inputSchema: {
              type: "object",
              properties: {
                ms: {
                  type: "number",
                  description: "Milliseconds to wait",
                },
              },
              required: ["ms"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "takeScreenshot":
            return await this.takeScreenshot();
          case "clickAt":
            return await this.clickAt(args.x, args.y);
          case "typeText":
            return await this.typeText(args.text);
          case "pressKey":
            return await this.pressKey(args.key);
          case "getWindowList":
            return await this.getWindowList();
          case "openApplication":
            return await this.openApplication(args.appName);
          case "getMousePosition":
            return await this.getMousePosition();
          case "wait":
            return await this.wait(args.ms);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async takeScreenshot() {
    try {
      const os = await import('os');
      const path = await import('path');
      const fs = await import('fs');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `screenshot-${Date.now()}.png`);
      
      // Use macOS screencapture command for reliable screenshot
      await execAsync(`screencapture -x "${tempFile}"`);
      
      const screenshotBuffer = await fs.promises.readFile(tempFile);
      const base64 = screenshotBuffer.toString('base64');
      
      // Clean up temp file
      await fs.promises.unlink(tempFile);
      
      return {
        content: [
          {
            type: "text",
            text: `Screenshot captured (${base64.length} bytes)`,
          },
          {
            type: "image",
            data: base64,
            mimeType: "image/png",
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  }

  async clickAt(x, y) {
    try {
      // Validate coordinates
      if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error(`Invalid coordinates: x=${x} (${typeof x}), y=${y} (${typeof y})`);
      }
      
      if (isNaN(x) || isNaN(y)) {
        throw new Error(`NaN coordinates: x=${x}, y=${y}`);
      }
      
      console.log(`🎯 Clicking at coordinates (${x}, ${y})`);
      await mouse.move(straightTo({ x, y }));
      await mouse.leftClick();
      return {
        content: [
          {
            type: "text",
            text: `Clicked at coordinates (${x}, ${y})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to click at (${x}, ${y}): ${error.message}`);
    }
  }

  async typeText(text) {
    try {
      await keyboard.type(text);
      return {
        content: [
          {
            type: "text",
            text: `Typed text: "${text}"`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to type text: ${error.message}`);
    }
  }

  async pressKey(keyName) {
    try {
      const keyMap = {
        'return': 'return',
        'enter': 'return',
        'tab': 'tab',
        'escape': 'escape',
        'space': 'space',
        'backspace': 'backspace',
        'delete': 'delete',
        'up': 'up',
        'down': 'down',
        'left': 'left',
        'right': 'right',
        'cmd': 'cmd',
        'ctrl': 'ctrl',
        'alt': 'alt',
        'shift': 'shift',
      };

      const key = keyMap[keyName.toLowerCase()] || keyName;
      await keyboard.pressKey(key);
      return {
        content: [
          {
            type: "text",
            text: `Pressed key: ${keyName}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to press key ${keyName}: ${error.message}`);
    }
  }

  async getWindowList() {
    try {
      const windows = await getWindows();
      const windowList = windows.map((window, index) => ({
        id: index,
        title: window.title || 'Unknown',
        bounds: window.bounds || {},
      }));

      return {
        content: [
          {
            type: "text",
            text: `Found ${windowList.length} windows: ${JSON.stringify(windowList, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get window list: ${error.message}`);
    }
  }

  async openApplication(appName) {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // Open application and bring it to foreground
      await execAsync(`open -a "${appName}"`);
      
      // Wait a moment for the app to launch
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use osascript to activate the application and bring it to front
      try {
        await execAsync(`osascript -e 'tell application "${appName}" to activate'`);
      } catch (activateError) {
        // If osascript fails, continue anyway
        console.log('Could not activate application via osascript:', activateError.message);
      }
      
      return {
        content: [
          {
            type: "text",
            text: `Opened and activated application: ${appName}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to open application ${appName}: ${error.message}`);
    }
  }

  async getMousePosition() {
    try {
      const position = await mouse.getPosition();
      return {
        content: [
          {
            type: "text",
            text: `Mouse position: (${position.x}, ${position.y})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get mouse position: ${error.message}`);
    }
  }

  async wait(ms) {
    try {
      await new Promise(resolve => setTimeout(resolve, ms));
      return {
        content: [
          {
            type: "text",
            text: `Waited ${ms}ms`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to wait: ${error.message}`);
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Computer Control MCP Server started");
  }
}

export default ComputerControlMCPServer;

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ComputerControlMCPServer();
  server.start().catch(console.error);
}
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { mouse, keyboard, screen, straightTo, centerOf, getWindows, getActiveWindow, Region, clipboard, Button, Key, sleep } from "@nut-tree-fork/nut-js";

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

    // Coordinate system cache
    this.coordinateCache = {
      nutjsWidth: null,
      nutjsHeight: null,
      screenshotWidth: null,
      screenshotHeight: null,
      scaleX: null,
      scaleY: null,
      lastUpdated: null
    };

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Screen Operations
          {
            name: "takeScreenshot",
            description: "Take a screenshot of the current screen",
            inputSchema: {
              type: "object",
              properties: {
                addMetadata: {
                  type: "boolean",
                  description: "Add coordinate metadata overlay to help with accuracy (default: false)"
                }
              },
              required: [],
            },
          },
          {
            name: "captureRegion",
            description: "Capture a specific region of the screen",
            inputSchema: {
              type: "object",
              properties: {
                x: { type: "number", description: "X coordinate of top-left corner" },
                y: { type: "number", description: "Y coordinate of top-left corner" },
                width: { type: "number", description: "Width of region" },
                height: { type: "number", description: "Height of region" },
              },
              required: ["x", "y", "width", "height"],
            },
          },
          {
            name: "getScreenSize",
            description: "Get screen width and height",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "getColorAt",
            description: "Get the color at specific coordinates",
            inputSchema: {
              type: "object",
              properties: {
                x: { type: "number", description: "X coordinate" },
                y: { type: "number", description: "Y coordinate" },
              },
              required: ["x", "y"],
            },
          },
          // Mouse Operations
          {
            name: "clickAt",
            description: "Click at specific coordinates with left mouse button",
            inputSchema: {
              type: "object",
              properties: {
                x: { type: "number", description: "X coordinate" },
                y: { type: "number", description: "Y coordinate" },
              },
              required: ["x", "y"],
            },
          },
          {
            name: "rightClickAt",
            description: "Right-click at specific coordinates",
            inputSchema: {
              type: "object",
              properties: {
                x: { type: "number", description: "X coordinate" },
                y: { type: "number", description: "Y coordinate" },
              },
              required: ["x", "y"],
            },
          },
          {
            name: "doubleClickAt",
            description: "Double-click at specific coordinates",
            inputSchema: {
              type: "object",
              properties: {
                x: { type: "number", description: "X coordinate" },
                y: { type: "number", description: "Y coordinate" },
              },
              required: ["x", "y"],
            },
          },
          {
            name: "dragMouse",
            description: "Drag from one point to another",
            inputSchema: {
              type: "object",
              properties: {
                fromX: { type: "number", description: "Starting X coordinate" },
                fromY: { type: "number", description: "Starting Y coordinate" },
                toX: { type: "number", description: "Ending X coordinate" },
                toY: { type: "number", description: "Ending Y coordinate" },
              },
              required: ["fromX", "fromY", "toX", "toY"],
            },
          },
          {
            name: "scroll",
            description: "Scroll in a direction",
            inputSchema: {
              type: "object",
              properties: {
                direction: { type: "string", enum: ["up", "down", "left", "right"], description: "Direction to scroll" },
                amount: { type: "number", description: "Number of scroll steps (default: 3)" },
              },
              required: ["direction"],
            },
          },
          {
            name: "moveMouse",
            description: "Move mouse to specific coordinates without clicking",
            inputSchema: {
              type: "object",
              properties: {
                x: { type: "number", description: "X coordinate" },
                y: { type: "number", description: "Y coordinate" },
              },
              required: ["x", "y"],
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
          // Keyboard Operations
          {
            name: "typeText",
            description: "Type text at the current cursor position",
            inputSchema: {
              type: "object",
              properties: {
                text: { type: "string", description: "Text to type" },
              },
              required: ["text"],
            },
          },
          {
            name: "pressKey",
            description: "Press a specific key or key combination",
            inputSchema: {
              type: "object",
              properties: {
                key: { type: "string", description: "Key to press (e.g., 'return', 'tab', 'escape', 'cmd+c')" },
              },
              required: ["key"],
            },
          },
          {
            name: "pressKeys",
            description: "Press multiple keys simultaneously (key combination)",
            inputSchema: {
              type: "object",
              properties: {
                keys: { type: "array", items: { type: "string" }, description: "Array of keys to press together" },
              },
              required: ["keys"],
            },
          },
          // Window Management
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
            name: "getActiveWindow",
            description: "Get information about the currently active window",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "focusWindow",
            description: "Focus a window by title or partial title match",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Window title or partial title to focus" },
              },
              required: ["title"],
            },
          },
          {
            name: "moveWindow",
            description: "Move a window to new coordinates",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Window title" },
                x: { type: "number", description: "New X position" },
                y: { type: "number", description: "New Y position" },
              },
              required: ["title", "x", "y"],
            },
          },
          {
            name: "resizeWindow",
            description: "Resize a window",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Window title" },
                width: { type: "number", description: "New width" },
                height: { type: "number", description: "New height" },
              },
              required: ["title", "width", "height"],
            },
          },
          // Clipboard Operations
          {
            name: "setClipboard",
            description: "Set text content to clipboard",
            inputSchema: {
              type: "object",
              properties: {
                text: { type: "string", description: "Text to copy to clipboard" },
              },
              required: ["text"],
            },
          },
          {
            name: "getClipboard",
            description: "Get current clipboard text content",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          // Application Control
          {
            name: "openApplication",
            description: "Open an application by name",
            inputSchema: {
              type: "object",
              properties: {
                appName: { type: "string", description: "Name of the application to open" },
              },
              required: ["appName"],
            },
          },
          // Utility
          {
            name: "wait",
            description: "Wait for a specified amount of time",
            inputSchema: {
              type: "object",
              properties: {
                ms: { type: "number", description: "Milliseconds to wait" },
              },
              required: ["ms"],
            },
          },
          {
            name: "debugCoordinates",
            description: "Debug coordinate system and display scaling",
            inputSchema: {
              type: "object",
              properties: {
                x: { type: "number", description: "X coordinate to test" },
                y: { type: "number", description: "Y coordinate to test" },
              },
              required: ["x", "y"],
            },
          },
          {
            name: "analyzeCoordinateSystem",
            description: "Comprehensive analysis of coordinate system scaling and mapping",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "createCoordinateTestImage",
            description: "Create a test screenshot with coordinate markers and grid for LLM verification",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "testMouseAccuracy",
            description: "Test mouse accuracy by clicking at known screen positions and reporting results",
            inputSchema: {
              type: "object",
              properties: {
                testPoints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      x: { type: "number" },
                      y: { type: "number" },
                      label: { type: "string" }
                    }
                  },
                  description: "Array of test points with x, y coordinates and labels"
                }
              },
              required: [],
            },
          },
          // Hotkey Navigation Tools
          {
            name: "focusAddressBar",
            description: "Focus the address/URL bar in web browsers (Cmd+L)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "switchTab",
            description: "Switch between browser tabs",
            inputSchema: {
              type: "object",
              properties: {
                direction: {
                  type: "string",
                  enum: ["next", "previous"],
                  description: "Direction to switch tabs (next = Cmd+Shift+], previous = Cmd+Shift+[)"
                }
              },
              required: ["direction"],
            },
          },
          {
            name: "navigateBack",
            description: "Navigate back in browser history (Cmd+Left Arrow)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "navigateForward",
            description: "Navigate forward in browser history (Cmd+Right Arrow)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "refreshPage",
            description: "Refresh/reload the current page (Cmd+R)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "newTab",
            description: "Open a new tab (Cmd+T)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "closeTab",
            description: "Close current tab (Cmd+W)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "selectAll",
            description: "Select all content (Cmd+A)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "copy",
            description: "Copy selected content (Cmd+C)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "paste",
            description: "Paste from clipboard (Cmd+V)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "undo",
            description: "Undo last action (Cmd+Z)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "redo",
            description: "Redo last undone action (Cmd+Shift+Z)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "find",
            description: "Open find dialog (Cmd+F)",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "switchApplication",
            description: "Switch between applications (Cmd+Tab) or windows (Cmd+`)",
            inputSchema: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["application", "window"],
                  description: "Switch between applications (Cmd+Tab) or windows within app (Cmd+`)"
                }
              },
              required: ["type"],
            },
          },
          {
            name: "executeHotkey",
            description: "Execute a custom hotkey combination",
            inputSchema: {
              type: "object",
              properties: {
                keys: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of keys to press simultaneously (e.g., ['cmd', 'shift', 'n'])"
                },
                description: {
                  type: "string",
                  description: "Description of what this hotkey does"
                }
              },
              required: ["keys"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Screen Operations
          case "takeScreenshot":
            return await this.takeScreenshot(args.addMetadata);
          case "captureRegion":
            return await this.captureRegion(args.x, args.y, args.width, args.height);
          case "getScreenSize":
            return await this.getScreenSize();
          case "getColorAt":
            return await this.getColorAt(args.x, args.y);
          // Mouse Operations
          case "clickAt":
            return await this.clickAt(args.x, args.y);
          case "rightClickAt":
            return await this.rightClickAt(args.x, args.y);
          case "doubleClickAt":
            return await this.doubleClickAt(args.x, args.y);
          case "dragMouse":
            return await this.dragMouse(args.fromX, args.fromY, args.toX, args.toY);
          case "scroll":
            return await this.scroll(args.direction, args.amount);
          case "moveMouse":
            return await this.moveMouse(args.x, args.y);
          case "getMousePosition":
            return await this.getMousePosition();
          // Keyboard Operations
          case "typeText":
            return await this.typeText(args.text);
          case "pressKey":
            return await this.pressKey(args.key);
          case "pressKeys":
            return await this.pressKeys(args.keys);
          // Window Management
          case "getWindowList":
            return await this.getWindowList();
          case "getActiveWindow":
            return await this.getActiveWindow();
          case "focusWindow":
            return await this.focusWindow(args.title);
          case "moveWindow":
            return await this.moveWindow(args.title, args.x, args.y);
          case "resizeWindow":
            return await this.resizeWindow(args.title, args.width, args.height);
          // Clipboard Operations
          case "setClipboard":
            return await this.setClipboard(args.text);
          case "getClipboard":
            return await this.getClipboard();
          // Application Control
          case "openApplication":
            return await this.openApplication(args.appName);
          // Utility
          case "wait":
            return await this.wait(args.ms);
          case "debugCoordinates":
            return await this.debugCoordinates(args.x, args.y);
          case "analyzeCoordinateSystem":
            return await this.analyzeCoordinateSystem();
          case "createCoordinateTestImage":
            return await this.createCoordinateTestImage();
          case "testMouseAccuracy":
            return await this.testMouseAccuracy(args.testPoints);
          // Hotkey Navigation
          case "focusAddressBar":
            return await this.focusAddressBar();
          case "switchTab":
            return await this.switchTab(args.direction);
          case "navigateBack":
            return await this.navigateBack();
          case "navigateForward":
            return await this.navigateForward();
          case "refreshPage":
            return await this.refreshPage();
          case "newTab":
            return await this.newTab();
          case "closeTab":
            return await this.closeTab();
          case "selectAll":
            return await this.selectAll();
          case "copy":
            return await this.copy();
          case "paste":
            return await this.paste();
          case "undo":
            return await this.undo();
          case "redo":
            return await this.redo();
          case "find":
            return await this.find();
          case "switchApplication":
            return await this.switchApplication(args.type);
          case "executeHotkey":
            return await this.executeHotkey(args.keys, args.description);
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

  async takeScreenshot(addMetadata = false) {
    try {
      const os = await import('os');
      const path = await import('path');
      const fs = await import('fs');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const tempDir = os.tmpdir();
      const rawFile = path.join(tempDir, `screenshot-raw-${Date.now()}.png`);
      const finalFile = path.join(tempDir, `screenshot-final-${Date.now()}.png`);
      
      // Get coordinate system info
      const coords = await this.ensureCoordinateSystem();
      
      // Take raw screenshot
      await execAsync(`screencapture -x -t png "${rawFile}"`);
      
      let screenshotFile = rawFile;
      
      // Add coordinate metadata overlay if requested
      if (addMetadata) {
        try {
          const width = coords.screenshotWidth;
          const height = coords.screenshotHeight;
          
          // Create metadata overlay
          let convertCmd = `convert "${rawFile}" `;
          
          // Add subtle coordinate markers at corners and center
          const markers = [
            { x: 20, y: 30, label: '(0,0)' },
            { x: width - 80, y: 30, label: `(${width},0)` },
            { x: 20, y: height - 10, label: `(0,${height})` },
            { x: width - 120, y: height - 10, label: `(${width},${height})` },
            { x: Math.floor(width/2) - 40, y: Math.floor(height/2), label: `CENTER(${Math.floor(width/2)},${Math.floor(height/2)})` }
          ];
          
          // Add semi-transparent background and coordinate text
          markers.forEach(marker => {
            convertCmd += `-stroke none -fill 'rgba(0,0,0,0.7)' -draw "rectangle ${marker.x-2},${marker.y-12} ${marker.x + marker.label.length*8},${marker.y+2}" `;
            convertCmd += `-stroke white -fill white -pointsize 12 -draw "text ${marker.x},${marker.y} '${marker.label}'" `;
          });
          
          // Add coordinate system info at top
          const infoText = `Screenshot: ${width}x${height} | Mouse: ${coords.nutjsWidth}x${coords.nutjsHeight} | Scale: ${coords.scaleX.toFixed(2)}`;
          convertCmd += `-stroke none -fill 'rgba(0,0,0,0.8)' -draw "rectangle 0,0 ${infoText.length*7},20" `;
          convertCmd += `-stroke yellow -fill yellow -pointsize 14 -draw "text 5,15 '${infoText}'" `;
          
          convertCmd += `"${finalFile}"`;
          
          await execAsync(convertCmd);
          screenshotFile = finalFile;
          console.log(`📷 Added coordinate metadata overlay`);
        } catch (overlayError) {
          console.log('Could not add metadata overlay:', overlayError.message);
          screenshotFile = rawFile;
        }
      }
      
      const screenshotBuffer = await fs.promises.readFile(screenshotFile);
      const base64 = screenshotBuffer.toString('base64');
      
      // Clean up temp files
      await fs.promises.unlink(rawFile).catch(() => {});
      await fs.promises.unlink(finalFile).catch(() => {});
      
      console.log(`📷 Screenshot: ${base64.length} bytes, dimensions: ${coords.screenshotWidth}x${coords.screenshotHeight}, mouse space: ${coords.nutjsWidth}x${coords.nutjsHeight}`);
      
      return {
        content: [
          {
            type: "text",
            text: `Screenshot captured (${base64.length} bytes)\n` +
                  `Screenshot dimensions: ${coords.screenshotWidth}x${coords.screenshotHeight}\n` +
                  `Mouse coordinate space: ${coords.nutjsWidth}x${coords.nutjsHeight}\n` +
                  `Scaling factors: X=${coords.scaleX.toFixed(3)}, Y=${coords.scaleY.toFixed(3)}` +
                  (addMetadata ? '\n\nCoordinate metadata overlay added to image.' : ''),
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
      
      // Normalize coordinates from screenshot space to mouse space
      const normalizedCoords = await this.normalizeCoordinates(x, y);
      
      console.log(`🎯 Clicking at screenshot coordinates (${x}, ${y}) -> mouse coordinates (${normalizedCoords.x.toFixed(1)}, ${normalizedCoords.y.toFixed(1)})`);
      
      await mouse.move(straightTo(normalizedCoords));
      
      // Verify we moved to the right place
      const finalPos = await mouse.getPosition();
      console.log(`🎯 Mouse final position: (${finalPos.x}, ${finalPos.y})`);
      
      await mouse.leftClick();
      return {
        content: [
          {
            type: "text",
            text: `Clicked at screenshot coordinates (${x}, ${y}) -> mouse coordinates (${normalizedCoords.x.toFixed(1)}, ${normalizedCoords.y.toFixed(1)})`,
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
        'return': Key.Return,
        'enter': Key.Return,
        'tab': Key.Tab,
        'escape': Key.Escape,
        'space': Key.Space,
        'backspace': Key.Backspace,
        'delete': Key.Delete,
        'up': Key.Up,
        'down': Key.Down,
        'left': Key.Left,
        'right': Key.Right,
        'cmd': Key.LeftCmd,
        'ctrl': Key.LeftControl,
        'alt': Key.LeftAlt,
        'shift': Key.LeftShift,
        'f1': Key.F1, 'f2': Key.F2, 'f3': Key.F3, 'f4': Key.F4,
        'f5': Key.F5, 'f6': Key.F6, 'f7': Key.F7, 'f8': Key.F8,
        'f9': Key.F9, 'f10': Key.F10, 'f11': Key.F11, 'f12': Key.F12,
      };

      // Handle key combinations like "cmd+c", "ctrl+v"
      if (keyName.includes('+')) {
        const keys = keyName.split('+').map(k => k.trim().toLowerCase());
        const mappedKeys = keys.map(key => keyMap[key] || key);
        await keyboard.pressKey(...mappedKeys);
        return {
          content: [
            {
              type: "text",
              text: `Pressed key combination: ${keyName}`,
            },
          ],
        };
      }

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
      await sleep(ms);
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

  // Additional Screen Operations
  async captureRegion(x, y, width, height) {
    try {
      const os = await import('os');
      const path = await import('path');
      const fs = await import('fs');
      
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `region-${Date.now()}.png`);
      
      const region = new Region(x, y, width, height);
      await screen.captureRegion(tempFile, region);
      
      const screenshotBuffer = await fs.promises.readFile(tempFile);
      const base64 = screenshotBuffer.toString('base64');
      
      await fs.promises.unlink(tempFile);
      
      return {
        content: [
          {
            type: "text",
            text: `Region captured: ${width}x${height} at (${x}, ${y})`,
          },
          {
            type: "image",
            data: base64,
            mimeType: "image/png",
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to capture region: ${error.message}`);
    }
  }

  async getScreenSize() {
    try {
      const width = await screen.width();
      const height = await screen.height();
      return {
        content: [
          {
            type: "text",
            text: `Screen size: ${width}x${height}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get screen size: ${error.message}`);
    }
  }

  async getColorAt(x, y) {
    try {
      const normalizedCoords = await this.normalizeCoordinates(x, y);
      const color = await screen.colorAt(normalizedCoords);
      
      console.log(`🎨 Getting color at screenshot coordinates (${x}, ${y}) -> mouse coordinates (${normalizedCoords.x.toFixed(1)}, ${normalizedCoords.y.toFixed(1)})`);
      
      return {
        content: [
          {
            type: "text",
            text: `Color at screenshot coordinates (${x}, ${y}): RGB(${color.R}, ${color.G}, ${color.B}, ${color.A})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get color at (${x}, ${y}): ${error.message}`);
    }
  }

  // Additional Mouse Operations
  async rightClickAt(x, y) {
    try {
      if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error(`Invalid coordinates: x=${x} (${typeof x}), y=${y} (${typeof y})`);
      }
      
      const normalizedCoords = await this.normalizeCoordinates(x, y);
      console.log(`🎯 Right-clicking at screenshot coordinates (${x}, ${y}) -> mouse coordinates (${normalizedCoords.x.toFixed(1)}, ${normalizedCoords.y.toFixed(1)})`);
      
      await mouse.move(straightTo(normalizedCoords));
      await mouse.rightClick();
      return {
        content: [
          {
            type: "text",
            text: `Right-clicked at screenshot coordinates (${x}, ${y}) -> mouse coordinates (${normalizedCoords.x.toFixed(1)}, ${normalizedCoords.y.toFixed(1)})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to right-click at (${x}, ${y}): ${error.message}`);
    }
  }

  async doubleClickAt(x, y) {
    try {
      if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error(`Invalid coordinates: x=${x} (${typeof x}), y=${y} (${typeof y})`);
      }
      
      const normalizedCoords = await this.normalizeCoordinates(x, y);
      console.log(`🎯 Double-clicking at screenshot coordinates (${x}, ${y}) -> mouse coordinates (${normalizedCoords.x.toFixed(1)}, ${normalizedCoords.y.toFixed(1)})`);
      
      await mouse.move(straightTo(normalizedCoords));
      await mouse.doubleClick(Button.LEFT);
      return {
        content: [
          {
            type: "text",
            text: `Double-clicked at screenshot coordinates (${x}, ${y}) -> mouse coordinates (${normalizedCoords.x.toFixed(1)}, ${normalizedCoords.y.toFixed(1)})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to double-click at (${x}, ${y}): ${error.message}`);
    }
  }

  async dragMouse(fromX, fromY, toX, toY) {
    try {
      const fromCoords = await this.normalizeCoordinates(fromX, fromY);
      const toCoords = await this.normalizeCoordinates(toX, toY);
      
      console.log(`🎯 Dragging from screenshot (${fromX}, ${fromY}) -> mouse (${fromCoords.x.toFixed(1)}, ${fromCoords.y.toFixed(1)}) to screenshot (${toX}, ${toY}) -> mouse (${toCoords.x.toFixed(1)}, ${toCoords.y.toFixed(1)})`);
      
      const path = [fromCoords, toCoords];
      await mouse.drag(path);
      return {
        content: [
          {
            type: "text",
            text: `Dragged from screenshot (${fromX}, ${fromY}) to (${toX}, ${toY})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to drag mouse: ${error.message}`);
    }
  }

  async scroll(direction, amount = 3) {
    try {
      console.log(`🎯 Scrolling ${direction} by ${amount} steps`);
      switch (direction.toLowerCase()) {
        case 'up':
          await mouse.scrollUp(amount);
          break;
        case 'down':
          await mouse.scrollDown(amount);
          break;
        case 'left':
          await mouse.scrollLeft(amount);
          break;
        case 'right':
          await mouse.scrollRight(amount);
          break;
        default:
          throw new Error(`Invalid scroll direction: ${direction}`);
      }
      return {
        content: [
          {
            type: "text",
            text: `Scrolled ${direction} by ${amount} steps`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to scroll ${direction}: ${error.message}`);
    }
  }

  async moveMouse(x, y) {
    try {
      if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error(`Invalid coordinates: x=${x} (${typeof x}), y=${y} (${typeof y})`);
      }
      
      const normalizedCoords = await this.normalizeCoordinates(x, y);
      console.log(`🎯 Moving mouse to screenshot coordinates (${x}, ${y}) -> mouse coordinates (${normalizedCoords.x.toFixed(1)}, ${normalizedCoords.y.toFixed(1)})`);
      
      await mouse.move(straightTo(normalizedCoords));
      return {
        content: [
          {
            type: "text",
            text: `Moved mouse to screenshot coordinates (${x}, ${y}) -> mouse coordinates (${normalizedCoords.x.toFixed(1)}, ${normalizedCoords.y.toFixed(1)})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to move mouse to (${x}, ${y}): ${error.message}`);
    }
  }

  // Additional Keyboard Operations
  async pressKeys(keys) {
    try {
      const keyMap = {
        'return': Key.Return,
        'enter': Key.Return,
        'tab': Key.Tab,
        'escape': Key.Escape,
        'space': Key.Space,
        'backspace': Key.Backspace,
        'delete': Key.Delete,
        'up': Key.Up,
        'down': Key.Down,
        'left': Key.Left,
        'right': Key.Right,
        'cmd': Key.LeftCmd,
        'ctrl': Key.LeftControl,
        'alt': Key.LeftAlt,
        'shift': Key.LeftShift,
        'a': Key.A, 'b': Key.B, 'c': Key.C, 'd': Key.D, 'e': Key.E,
        'f': Key.F, 'g': Key.G, 'h': Key.H, 'i': Key.I, 'j': Key.J,
        'k': Key.K, 'l': Key.L, 'm': Key.M, 'n': Key.N, 'o': Key.O,
        'p': Key.P, 'q': Key.Q, 'r': Key.R, 's': Key.S, 't': Key.T,
        'u': Key.U, 'v': Key.V, 'w': Key.W, 'x': Key.X, 'y': Key.Y, 'z': Key.Z,
      };

      const mappedKeys = keys.map(key => keyMap[key.toLowerCase()] || key);
      await keyboard.pressKey(...mappedKeys);
      return {
        content: [
          {
            type: "text",
            text: `Pressed key combination: ${keys.join('+')}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to press keys ${keys.join('+')}: ${error.message}`);
    }
  }

  // Window Management
  async getActiveWindow() {
    try {
      const activeWindow = await getActiveWindow();
      const region = await activeWindow.getRegion();
      const title = await activeWindow.getTitle();
      
      return {
        content: [
          {
            type: "text",
            text: `Active window: "${title}" at (${region.left}, ${region.top}) size ${region.width}x${region.height}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get active window: ${error.message}`);
    }
  }

  async focusWindow(title) {
    try {
      const windows = await getWindows();
      const targetWindow = windows.find(window => 
        window.title && window.title.toLowerCase().includes(title.toLowerCase())
      );
      
      if (!targetWindow) {
        throw new Error(`Window with title containing "${title}" not found`);
      }
      
      await targetWindow.focus();
      return {
        content: [
          {
            type: "text",
            text: `Focused window: "${targetWindow.title}"`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to focus window "${title}": ${error.message}`);
    }
  }

  async moveWindow(title, x, y) {
    try {
      const windows = await getWindows();
      const targetWindow = windows.find(window => 
        window.title && window.title.toLowerCase().includes(title.toLowerCase())
      );
      
      if (!targetWindow) {
        throw new Error(`Window with title containing "${title}" not found`);
      }
      
      await targetWindow.move({ x, y });
      return {
        content: [
          {
            type: "text",
            text: `Moved window "${targetWindow.title}" to (${x}, ${y})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to move window "${title}": ${error.message}`);
    }
  }

  async resizeWindow(title, width, height) {
    try {
      const windows = await getWindows();
      const targetWindow = windows.find(window => 
        window.title && window.title.toLowerCase().includes(title.toLowerCase())
      );
      
      if (!targetWindow) {
        throw new Error(`Window with title containing "${title}" not found`);
      }
      
      await targetWindow.resize({ width, height });
      return {
        content: [
          {
            type: "text",
            text: `Resized window "${targetWindow.title}" to ${width}x${height}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to resize window "${title}": ${error.message}`);
    }
  }

  // Clipboard Operations
  async setClipboard(text) {
    try {
      await clipboard.setContent(text);
      return {
        content: [
          {
            type: "text",
            text: `Copied text to clipboard: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to set clipboard: ${error.message}`);
    }
  }

  async getClipboard() {
    try {
      const content = await clipboard.getContent();
      return {
        content: [
          {
            type: "text",
            text: `Clipboard content: "${content}"`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get clipboard: ${error.message}`);
    }
  }

  async debugCoordinates(x, y) {
    try {
      // Get comprehensive coordinate system info
      const screenWidth = await screen.width();
      const screenHeight = await screen.height();
      const currentMousePos = await mouse.getPosition();
      
      // Move to the test coordinates and check where we actually end up
      await mouse.move(straightTo({ x, y }));
      const actualPos = await mouse.getPosition();
      
      // Get color at that position
      const color = await screen.colorAt({ x: actualPos.x, y: actualPos.y });
      
      // Get display scale information from system
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      let displayInfo = 'Unknown';
      try {
        const result = await execAsync('system_profiler SPDisplaysDataType | grep Resolution');
        displayInfo = result.stdout.trim();
      } catch (e) {
        // Ignore if command fails
      }
      
      return {
        content: [
          {
            type: "text",
            text: `Coordinate Debug:\n` +
                  `Requested: (${x}, ${y})\n` +
                  `Actual mouse position: (${actualPos.x}, ${actualPos.y})\n` +
                  `Screen dimensions (nut-js): ${screenWidth}x${screenHeight}\n` +
                  `Color at position: RGB(${color.R}, ${color.G}, ${color.B})\n` +
                  `Display info: ${displayInfo}\n` +
                  `Original mouse position: (${currentMousePos.x}, ${currentMousePos.y})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to debug coordinates: ${error.message}`);
    }
  }

  async analyzeCoordinateSystem() {
    try {
      const os = await import('os');
      const path = await import('path');
      const fs = await import('fs');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // 1. Get nut-js reported screen dimensions
      const nutjsWidth = await screen.width();
      const nutjsHeight = await screen.height();
      
      // 2. Take a screenshot and analyze its actual dimensions
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `analysis-${Date.now()}.png`);
      
      await execAsync(`screencapture -x -t png "${tempFile}"`);
      
      // Use imagemagick or similar to get actual image dimensions
      let actualWidth, actualHeight;
      try {
        const result = await execAsync(`sips -g pixelWidth -g pixelHeight "${tempFile}"`);
        const lines = result.stdout.split('\n');
        actualWidth = parseInt(lines.find(line => line.includes('pixelWidth'))?.split(':')[1]?.trim() || '0');
        actualHeight = parseInt(lines.find(line => line.includes('pixelHeight'))?.split(':')[1]?.trim() || '0');
      } catch (e) {
        // Fallback: read image header manually
        const buffer = await fs.promises.readFile(tempFile);
        // PNG width/height are at bytes 16-19 and 20-23 respectively (big endian)
        actualWidth = buffer.readUInt32BE(16);
        actualHeight = buffer.readUInt32BE(20);
      }
      
      // 3. Test coordinate mapping at key points
      const testPoints = [
        { x: 0, y: 0, desc: "Top-left corner" },
        { x: Math.floor(nutjsWidth / 2), y: Math.floor(nutjsHeight / 2), desc: "Center" },
        { x: nutjsWidth - 1, y: nutjsHeight - 1, desc: "Bottom-right corner" },
        { x: Math.floor(nutjsWidth / 4), y: Math.floor(nutjsHeight / 4), desc: "Quarter point" }
      ];
      
      const originalPos = await mouse.getPosition();
      const testResults = [];
      
      for (const point of testPoints) {
        try {
          await mouse.move(straightTo({ x: point.x, y: point.y }));
          const actualPos = await mouse.getPosition();
          testResults.push({
            requested: point,
            actual: actualPos,
            diff: { x: actualPos.x - point.x, y: actualPos.y - point.y }
          });
          await sleep(100); // Small delay between tests
        } catch (e) {
          testResults.push({
            requested: point,
            error: e.message
          });
        }
      }
      
      // Restore original mouse position
      await mouse.move(straightTo(originalPos));
      
      // 4. Calculate scaling factors
      const scaleX = actualWidth / nutjsWidth;
      const scaleY = actualHeight / nutjsHeight;
      
      // 5. Get system display information
      let displayInfo = 'Unknown';
      try {
        const result = await execAsync('system_profiler SPDisplaysDataType | head -20');
        displayInfo = result.stdout;
      } catch (e) {
        displayInfo = 'Could not retrieve display info';
      }
      
      // Clean up
      await fs.promises.unlink(tempFile);
      
      const analysis = {
        nutjsDimensions: { width: nutjsWidth, height: nutjsHeight },
        screenshotDimensions: { width: actualWidth, height: actualHeight },
        scalingFactors: { x: scaleX, y: scaleY },
        testResults,
        displayInfo: displayInfo.substring(0, 500)
      };
      
      return {
        content: [
          {
            type: "text",
            text: `Coordinate System Analysis:\n\n` +
                  `nut-js Screen Dimensions: ${nutjsWidth} x ${nutjsHeight}\n` +
                  `Screenshot Dimensions: ${actualWidth} x ${actualHeight}\n` +
                  `Scaling Factors: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}\n\n` +
                  `Test Results:\n` +
                  testResults.map((result, i) => 
                    `${i + 1}. ${testPoints[i].desc}: ` +
                    (result.error ? `ERROR: ${result.error}` :
                    `Requested (${result.requested.x}, ${result.requested.y}) -> ` +
                    `Actual (${result.actual.x}, ${result.actual.y}) ` +
                    `Diff (${result.diff.x}, ${result.diff.y})`)
                  ).join('\n') +
                  `\n\nDisplay Info:\n${analysis.displayInfo}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze coordinate system: ${error.message}`);
    }
  }

  async createCoordinateTestImage() {
    try {
      const os = await import('os');
      const path = await import('path');
      const fs = await import('fs');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // Get current dimensions
      const coords = await this.ensureCoordinateSystem();
      
      // Take a screenshot first
      const tempDir = os.tmpdir();
      const screenshotFile = path.join(tempDir, `test-screenshot-${Date.now()}.png`);
      const annotatedFile = path.join(tempDir, `test-annotated-${Date.now()}.png`);
      
      await execAsync(`screencapture -x -t png "${screenshotFile}"`);
      
      // Create an annotated version with coordinate grid and markers
      // Using ImageMagick convert command to add grid and labels
      const gridSize = 100;
      const width = coords.screenshotWidth;
      const height = coords.screenshotHeight;
      
      // Add coordinate grid and corner markers
      let convertCmd = `convert "${screenshotFile}" `;
      
      // Add grid lines every 100px
      for (let x = 0; x < width; x += gridSize) {
        convertCmd += `-stroke red -strokewidth 1 -draw "line ${x},0 ${x},${height}" `;
      }
      for (let y = 0; y < height; y += gridSize) {
        convertCmd += `-stroke red -strokewidth 1 -draw "line 0,${y} ${width},${y}" `;
      }
      
      // Add corner markers and coordinates
      const markers = [
        { x: 50, y: 50, label: '(50,50)' },
        { x: width - 100, y: 50, label: `(${width-100},50)` },
        { x: 50, y: height - 50, label: `(50,${height-50})` },
        { x: width - 100, y: height - 50, label: `(${width-100},${height-50})` },
        { x: Math.floor(width/2), y: Math.floor(height/2), label: `CENTER(${Math.floor(width/2)},${Math.floor(height/2)})` }
      ];
      
      markers.forEach(marker => {
        // Add circle marker
        convertCmd += `-stroke yellow -strokewidth 3 -fill none -draw "circle ${marker.x},${marker.y} ${marker.x+10},${marker.y}" `;
        // Add text label
        convertCmd += `-stroke black -strokewidth 1 -fill yellow -pointsize 16 -draw "text ${marker.x+15},${marker.y-5} '${marker.label}'" `;
      });
      
      convertCmd += `"${annotatedFile}"`;
      
      try {
        await execAsync(convertCmd);
        
        // Read the annotated file
        const annotatedBuffer = await fs.promises.readFile(annotatedFile);
        const annotatedBase64 = annotatedBuffer.toString('base64');
        
        // Clean up files
        await fs.promises.unlink(screenshotFile).catch(() => {});
        await fs.promises.unlink(annotatedFile).catch(() => {});
        
        return {
          content: [
            {
              type: "text",
              text: `Test image created with coordinate grid and markers:\n` +
                    `Screenshot dimensions: ${width}x${height}\n` +
                    `Mouse coordinate space: ${coords.nutjsWidth}x${coords.nutjsHeight}\n` +
                    `Scaling factors: X=${coords.scaleX.toFixed(3)}, Y=${coords.scaleY.toFixed(3)}\n\n` +
                    `Markers placed at:\n` +
                    markers.map(m => `- ${m.label}`).join('\n') + '\n\n' +
                    `Grid lines every ${gridSize} pixels in screenshot coordinates.`,
            },
            {
              type: "image",
              data: annotatedBase64,
              mimeType: "image/png",
            },
          ],
        };
      } catch (convertError) {
        // Fallback without ImageMagick
        const screenshotBuffer = await fs.promises.readFile(screenshotFile);
        const screenshotBase64 = screenshotBuffer.toString('base64');
        
        await fs.promises.unlink(screenshotFile).catch(() => {});
        
        return {
          content: [
            {
              type: "text",
              text: `Test screenshot created (ImageMagick not available for grid overlay):\n` +
                    `Screenshot dimensions: ${width}x${height}\n` +
                    `Mouse coordinate space: ${coords.nutjsWidth}x${coords.nutjsHeight}\n` +
                    `Scaling factors: X=${coords.scaleX.toFixed(3)}, Y=${coords.scaleY.toFixed(3)}\n\n` +
                    `Test coordinates to try:\n` +
                    markers.map(m => `- ${m.label}`).join('\n'),
            },
            {
              type: "image",
              data: screenshotBase64,
              mimeType: "image/png",
            },
          ],
        };
      }
    } catch (error) {
      throw new Error(`Failed to create coordinate test image: ${error.message}`);
    }
  }

  async testMouseAccuracy(testPoints = []) {
    try {
      const originalPos = await mouse.getPosition();
      const results = [];
      
      // Default test points if none provided
      if (!testPoints || testPoints.length === 0) {
        const coords = await this.ensureCoordinateSystem();
        testPoints = [
          { x: 100, y: 100, label: "Top-left quadrant" },
          { x: coords.screenshotWidth - 100, y: 100, label: "Top-right quadrant" },
          { x: coords.screenshotWidth / 2, y: coords.screenshotHeight / 2, label: "Center" },
          { x: 100, y: coords.screenshotHeight - 100, label: "Bottom-left quadrant" },
          { x: coords.screenshotWidth - 100, y: coords.screenshotHeight - 100, label: "Bottom-right quadrant" }
        ];
      }
      
      for (const point of testPoints) {
        try {
          console.log(`\n🎯 Testing point: ${point.label} at screenshot coordinates (${point.x}, ${point.y})`);
          
          // Normalize coordinates
          const normalizedCoords = await this.normalizeCoordinates(point.x, point.y);
          console.log(`📏 Normalized to mouse coordinates: (${normalizedCoords.x.toFixed(1)}, ${normalizedCoords.y.toFixed(1)})`);
          
          // Move mouse
          await mouse.move(straightTo(normalizedCoords));
          
          // Get actual position
          const actualPos = await mouse.getPosition();
          console.log(`📍 Actual mouse position: (${actualPos.x}, ${actualPos.y})`);
          
          // Calculate accuracy
          const diffX = actualPos.x - normalizedCoords.x;
          const diffY = actualPos.y - normalizedCoords.y;
          const distance = Math.sqrt(diffX * diffX + diffY * diffY);
          
          results.push({
            label: point.label,
            requested: { x: point.x, y: point.y },
            normalized: { x: normalizedCoords.x, y: normalizedCoords.y },
            actual: { x: actualPos.x, y: actualPos.y },
            error: { x: diffX, y: diffY, distance: distance.toFixed(2) }
          });
          
          await sleep(500); // Pause between tests
        } catch (e) {
          results.push({
            label: point.label,
            requested: { x: point.x, y: point.y },
            error: e.message
          });
        }
      }
      
      // Restore original position
      await mouse.move(straightTo(originalPos));
      
      const report = results.map((result, i) => 
        `${i + 1}. ${result.label}:\n` +
        `   Screenshot coords: (${result.requested.x}, ${result.requested.y})\n` +
        (result.error && typeof result.error === 'string' ? 
          `   ERROR: ${result.error}` :
          `   Normalized coords: (${result.normalized.x.toFixed(1)}, ${result.normalized.y.toFixed(1)})\n` +
          `   Actual position: (${result.actual.x}, ${result.actual.y})\n` +
          `   Error: (${result.error.x.toFixed(1)}, ${result.error.y.toFixed(1)}) distance: ${result.error.distance}px`
        )
      ).join('\n\n');
      
      return {
        content: [
          {
            type: "text",
            text: `Mouse Accuracy Test Results:\n\n${report}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to test mouse accuracy: ${error.message}`);
    }
  }

  // Hotkey Navigation Methods
  async focusAddressBar() {
    try {
      await keyboard.pressKey(Key.LeftCmd, Key.L);
      console.log('🔄 Pressed Cmd+L to focus address bar');
      return {
        content: [{
          type: "text",
          text: "Focused address bar (Cmd+L)",
        }],
      };
    } catch (error) {
      throw new Error(`Failed to focus address bar: ${error.message}`);
    }
  }

  async switchTab(direction) {
    try {
      if (direction === "next") {
        await keyboard.pressKey(Key.LeftCmd, Key.LeftShift, Key.RightBracket);
        console.log('🔄 Pressed Cmd+Shift+] to switch to next tab');
      } else {
        await keyboard.pressKey(Key.LeftCmd, Key.LeftShift, Key.LeftBracket);
        console.log('🔄 Pressed Cmd+Shift+[ to switch to previous tab');
      }
      return {
        content: [{
          type: "text",
          text: `Switched to ${direction} tab`,
        }],
      };
    } catch (error) {
      throw new Error(`Failed to switch tab: ${error.message}`);
    }
  }

  async navigateBack() {
    try {
      await keyboard.pressKey(Key.LeftCmd, Key.Left);
      console.log('🔄 Pressed Cmd+Left to navigate back');
      return {
        content: [{
          type: "text",
          text: "Navigated back (Cmd+Left)",
        }],
      };
    } catch (error) {
      throw new Error(`Failed to navigate back: ${error.message}`);
    }
  }

  async navigateForward() {
    try {
      await keyboard.pressKey(Key.LeftCmd, Key.Right);
      console.log('🔄 Pressed Cmd+Right to navigate forward');
      return {
        content: [{
          type: "text",
          text: "Navigated forward (Cmd+Right)",
        }],
      };
    } catch (error) {
      throw new Error(`Failed to navigate forward: ${error.message}`);
    }
  }

  async refreshPage() {
    try {
      await keyboard.pressKey(Key.LeftCmd, Key.R);
      console.log('🔄 Pressed Cmd+R to refresh page');
      return {
        content: [{
          type: "text",
          text: "Refreshed page (Cmd+R)",
        }],
      };
    } catch (error) {
      throw new Error(`Failed to refresh page: ${error.message}`);
    }
  }

  async newTab() {
    try {
      await keyboard.pressKey(Key.LeftCmd, Key.T);
      console.log('🔄 Pressed Cmd+T to open new tab');
      return {
        content: [{
          type: "text",
          text: "Opened new tab (Cmd+T)",
        }],
      };
    } catch (error) {
      throw new Error(`Failed to open new tab: ${error.message}`);
    }
  }

  async closeTab() {
    try {
      await keyboard.pressKey(Key.LeftCmd, Key.W);
      console.log('🔄 Pressed Cmd+W to close tab');
      return {
        content: [{
          type: "text",
          text: "Closed tab (Cmd+W)",
        }],
      };
    } catch (error) {
      throw new Error(`Failed to close tab: ${error.message}`);
    }
  }

  async selectAll() {
    try {
      await keyboard.pressKey(Key.LeftCmd, Key.A);
      console.log('🔄 Pressed Cmd+A to select all');
      return {
        content: [{
          type: "text",
          text: "Selected all (Cmd+A)",
        }],
      };
    } catch (error) {
      throw new Error(`Failed to select all: ${error.message}`);
    }
  }

  async copy() {
    try {
      await keyboard.pressKey(Key.LeftCmd, Key.C);
      console.log('🔄 Pressed Cmd+C to copy');
      return {
        content: [{
          type: "text",
          text: "Copied to clipboard (Cmd+C)",
        }],
      };
    } catch (error) {
      throw new Error(`Failed to copy: ${error.message}`);
    }
  }

  async paste() {
    try {
      await keyboard.pressKey(Key.LeftCmd, Key.V);
      console.log('🔄 Pressed Cmd+V to paste');
      return {
        content: [{
          type: "text",
          text: "Pasted from clipboard (Cmd+V)",
        }],
      };
    } catch (error) {
      throw new Error(`Failed to paste: ${error.message}`);
    }
  }

  async undo() {
    try {
      await keyboard.pressKey(Key.LeftCmd, Key.Z);
      console.log('🔄 Pressed Cmd+Z to undo');
      return {
        content: [{
          type: "text",
          text: "Undid last action (Cmd+Z)",
        }],
      };
    } catch (error) {
      throw new Error(`Failed to undo: ${error.message}`);
    }
  }

  async redo() {
    try {
      await keyboard.pressKey(Key.LeftCmd, Key.LeftShift, Key.Z);
      console.log('🔄 Pressed Cmd+Shift+Z to redo');
      return {
        content: [{
          type: "text",
          text: "Redid last action (Cmd+Shift+Z)",
        }],
      };
    } catch (error) {
      throw new Error(`Failed to redo: ${error.message}`);
    }
  }

  async find() {
    try {
      await keyboard.pressKey(Key.LeftCmd, Key.F);
      console.log('🔄 Pressed Cmd+F to open find dialog');
      return {
        content: [{
          type: "text",
          text: "Opened find dialog (Cmd+F)",
        }],
      };
    } catch (error) {
      throw new Error(`Failed to open find dialog: ${error.message}`);
    }
  }

  async switchApplication(type) {
    try {
      if (type === "application") {
        await keyboard.pressKey(Key.LeftCmd, Key.Tab);
        console.log('🔄 Pressed Cmd+Tab to switch applications');
        return {
          content: [{
            type: "text",
            text: "Switched applications (Cmd+Tab)",
          }],
        };
      } else {
        await keyboard.pressKey(Key.LeftCmd, Key.Grave);
        console.log('🔄 Pressed Cmd+` to switch windows');
        return {
          content: [{
            type: "text",
            text: "Switched windows (Cmd+`)",
          }],
        };
      }
    } catch (error) {
      throw new Error(`Failed to switch ${type}: ${error.message}`);
    }
  }

  async executeHotkey(keys, description = "Custom hotkey") {
    try {
      const keyMap = {
        'cmd': Key.LeftCmd,
        'ctrl': Key.LeftControl,
        'alt': Key.LeftAlt,
        'shift': Key.LeftShift,
        'tab': Key.Tab,
        'return': Key.Return,
        'enter': Key.Return,
        'space': Key.Space,
        'escape': Key.Escape,
        'backspace': Key.Backspace,
        'delete': Key.Delete,
        'up': Key.Up,
        'down': Key.Down,
        'left': Key.Left,
        'right': Key.Right,
        'f1': Key.F1, 'f2': Key.F2, 'f3': Key.F3, 'f4': Key.F4,
        'f5': Key.F5, 'f6': Key.F6, 'f7': Key.F7, 'f8': Key.F8,
        'f9': Key.F9, 'f10': Key.F10, 'f11': Key.F11, 'f12': Key.F12,
        '[': Key.LeftBracket,
        ']': Key.RightBracket,
        // Letters
        'a': Key.A, 'b': Key.B, 'c': Key.C, 'd': Key.D, 'e': Key.E,
        'f': Key.F, 'g': Key.G, 'h': Key.H, 'i': Key.I, 'j': Key.J,
        'k': Key.K, 'l': Key.L, 'm': Key.M, 'n': Key.N, 'o': Key.O,
        'p': Key.P, 'q': Key.Q, 'r': Key.R, 's': Key.S, 't': Key.T,
        'u': Key.U, 'v': Key.V, 'w': Key.W, 'x': Key.X, 'y': Key.Y, 'z': Key.Z,
      };

      const mappedKeys = keys.map(key => {
        const mapped = keyMap[key.toLowerCase()];
        if (!mapped) {
          throw new Error(`Unknown key: ${key}`);
        }
        return mapped;
      });

      await keyboard.pressKey(...mappedKeys);
      console.log(`🔄 Executed hotkey: ${keys.join('+')} - ${description}`);
      
      return {
        content: [{
          type: "text",
          text: `Executed hotkey: ${keys.join('+')} - ${description}`,
        }],
      };
    } catch (error) {
      throw new Error(`Failed to execute hotkey ${keys.join('+')}: ${error.message}`);
    }
  }

  // Coordinate system management
  async ensureCoordinateSystem() {
    // Cache for 5 minutes
    const cacheValidMs = 5 * 60 * 1000;
    const now = Date.now();
    
    if (this.coordinateCache.lastUpdated && 
        (now - this.coordinateCache.lastUpdated) < cacheValidMs &&
        this.coordinateCache.scaleX !== null) {
      return this.coordinateCache;
    }

    try {
      const os = await import('os');
      const path = await import('path');
      const fs = await import('fs');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // Get nut-js dimensions
      const nutjsWidth = await screen.width();
      const nutjsHeight = await screen.height();
      
      // Take a quick screenshot to get actual dimensions
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `coord-check-${Date.now()}.png`);
      
      await execAsync(`screencapture -x -t png "${tempFile}"`);
      
      // Get actual screenshot dimensions
      let screenshotWidth, screenshotHeight;
      try {
        const buffer = await fs.promises.readFile(tempFile);
        screenshotWidth = buffer.readUInt32BE(16);
        screenshotHeight = buffer.readUInt32BE(20);
      } catch (e) {
        // Fallback to nut-js dimensions if we can't read the file
        screenshotWidth = nutjsWidth;
        screenshotHeight = nutjsHeight;
      }
      
      await fs.promises.unlink(tempFile).catch(() => {});
      
      // Calculate scaling factors
      const scaleX = screenshotWidth / nutjsWidth;
      const scaleY = screenshotHeight / nutjsHeight;
      
      // Update cache
      this.coordinateCache = {
        nutjsWidth,
        nutjsHeight,
        screenshotWidth,
        screenshotHeight,
        scaleX,
        scaleY,
        lastUpdated: now
      };
      
      console.log(`📏 Coordinate system: nut-js(${nutjsWidth}x${nutjsHeight}) -> screenshot(${screenshotWidth}x${screenshotHeight}) scale(${scaleX.toFixed(2)}, ${scaleY.toFixed(2)})`);
      
      return this.coordinateCache;
    } catch (error) {
      console.error('Failed to determine coordinate system, using 1:1 mapping:', error.message);
      // Fallback to 1:1 mapping
      const nutjsWidth = await screen.width();
      const nutjsHeight = await screen.height();
      
      this.coordinateCache = {
        nutjsWidth,
        nutjsHeight,
        screenshotWidth: nutjsWidth,
        screenshotHeight: nutjsHeight,
        scaleX: 1,
        scaleY: 1,
        lastUpdated: now
      };
      
      return this.coordinateCache;
    }
  }

  // Convert screenshot coordinates to mouse coordinates
  async normalizeCoordinates(screenshotX, screenshotY) {
    const coords = await this.ensureCoordinateSystem();
    
    // Convert from screenshot coordinate space to mouse coordinate space
    const mouseX = screenshotX / coords.scaleX;
    const mouseY = screenshotY / coords.scaleY;
    
    // Clamp to valid ranges
    const clampedX = Math.max(0, Math.min(mouseX, coords.nutjsWidth - 1));
    const clampedY = Math.max(0, Math.min(mouseY, coords.nutjsHeight - 1));
    
    console.log(`📏 Coordinate transform: screenshot(${screenshotX}, ${screenshotY}) -> mouse(${clampedX.toFixed(1)}, ${clampedY.toFixed(1)})`);
    
    return { x: clampedX, y: clampedY };
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
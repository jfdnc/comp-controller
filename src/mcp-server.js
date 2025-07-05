import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { mouse, keyboard, screen, straightTo, centerOf, getWindows, getActiveWindow, Region, clipboard, Button, Key } from "@nut-tree-fork/nut-js";
import { createErrorResponse, createSuccessResponse, createValidationError, createSystemError } from "./utils/error-responses.js";
import { ConfigurationManager } from "./config/configuration-manager.js";

class ComputerControlMCPServer {
  constructor(config = null) {
    // Only create ConfigurationManager if we actually need it
    // For the MCP server, we'll use default values
    this.config = config;
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
    this.setupNutConfig();
  }

  setupNutConfig() {
    // Configure nut-js timing and behavior
    // Use config if available, otherwise use sensible defaults
    const nutjsConfig = this.config ? this.config.getSection('nutjs') : {
      mouseAutoDelayMs: 100,
      mouseSpeed: 1000,
      keyboardAutoDelayMs: 100,
      screenAutoHighlight: false,
      screenConfidence: 0.8
    };
    
    mouse.config.autoDelayMs = nutjsConfig.mouseAutoDelayMs;
    mouse.config.mouseSpeed = nutjsConfig.mouseSpeed;
    keyboard.config.autoDelayMs = nutjsConfig.keyboardAutoDelayMs;
    screen.config.autoHighlight = nutjsConfig.screenAutoHighlight;
    screen.config.confidence = nutjsConfig.screenConfidence;
    
    if (this.config && this.config.isDebugEnabled()) {
      console.log('🔧 NutJS Configuration:', nutjsConfig);
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
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
          // Mouse Operations
          case "clickAt":
            return await this.clickAt(args.x, args.y);
          case "rightClickAt":
            return await this.rightClickAt(args.x, args.y);
          case "doubleClickAt":
            return await this.doubleClickAt(args.x, args.y);
          case "scroll":
            return await this.scroll(args.direction, args.amount);
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
          // Clipboard Operations
          case "setClipboard":
            return await this.setClipboard(args.text);
          case "getClipboard":
            return await this.getClipboard();
          // Application Control
          case "openApplication":
            return await this.openApplication(args.appName);
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
            { x: Math.floor(width / 2) - 40, y: Math.floor(height / 2), label: `CENTER(${Math.floor(width / 2)},${Math.floor(height / 2)})` }
          ];

          // Add semi-transparent background and coordinate text
          markers.forEach(marker => {
            convertCmd += `-stroke none -fill 'rgba(0,0,0,0.7)' -draw "rectangle ${marker.x - 2},${marker.y - 12} ${marker.x + marker.label.length * 8},${marker.y + 2}" `;
            convertCmd += `-stroke white -fill white -pointsize 12 -draw "text ${marker.x},${marker.y} '${marker.label}'" `;
          });

          // Add coordinate system info at top
          const infoText = `Screenshot: ${width}x${height} | Mouse: ${coords.nutjsWidth}x${coords.nutjsHeight} | Scale: ${coords.scaleX.toFixed(2)}`;
          convertCmd += `-stroke none -fill 'rgba(0,0,0,0.8)' -draw "rectangle 0,0 ${infoText.length * 7},20" `;
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
      await fs.promises.unlink(rawFile).catch(() => { });
      await fs.promises.unlink(finalFile).catch(() => { });

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
        return createValidationError('coordinates', `x=${x}, y=${y}`, 'numbers');
      }

      if (isNaN(x) || isNaN(y)) {
        return createValidationError('coordinates', `x=${x}, y=${y}`, 'valid numbers (not NaN)');
      }

      // Normalize coordinates from screenshot space to mouse space
      const normalizedCoords = await this.normalizeCoordinates(x, y);

      console.log(`🎯 Clicking at screenshot coordinates (${x}, ${y}) -> mouse coordinates (${normalizedCoords.x.toFixed(1)}, ${normalizedCoords.y.toFixed(1)})`);

      await mouse.move(straightTo(normalizedCoords));

      // Verify we moved to the right place
      const finalPos = await mouse.getPosition();
      console.log(`🎯 Mouse final position: (${finalPos.x}, ${finalPos.y})`);

      await mouse.leftClick();
      return createSuccessResponse(
        `Clicked at screenshot coordinates (${x}, ${y}) -> mouse coordinates (${normalizedCoords.x.toFixed(1)}, ${normalizedCoords.y.toFixed(1)})`
      );
    } catch (error) {
      console.error(`❌ Error clicking at (${x}, ${y}):`, error.message);
      return createSystemError(`clickAt(${x}, ${y})`, error);
    }
  }

  async typeText(text) {
    try {
      console.log(`🔄 Attempting to type text: "${text}"`);

      // Validate input
      if (!text || typeof text !== 'string') {
        return createValidationError('text', text, 'non-empty string');
      }

      // Simple, reliable typing
      await keyboard.type(text);

      console.log(`✅ Text typed successfully: "${text}"`);
      return createSuccessResponse(`Typed text: "${text}"`);
    } catch (error) {
      console.error(`❌ Error typing text "${text}":`, error.message);
      return createSystemError('typeText', error);
    }
  }

  async pressKey(keyName) {
    try {
      console.log(`🔄 Attempting to press key: "${keyName}"`);

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
        console.log(`🎹 Key combination detected: ${JSON.stringify(keys)}`);

        const mappedKeys = keys.map(key => {
          const mapped = keyMap[key];
          if (!mapped) {
            console.warn(`⚠️  Unknown key in combination: "${key}"`);
          }
          return mapped || key;
        });

        console.log(`🎹 Sending key combination: ${keys.join('+')}`);
        await keyboard.pressKey(...mappedKeys);
        console.log(`✅ Key combination sent: ${keys.join('+')}`);

        return {
          content: [
            {
              type: "text",
              text: `Pressed key combination: ${keyName}`,
            },
          ],
        };
      }

      const key = keyMap[keyName.toLowerCase()];
      if (!key) {
        console.warn(`⚠️  Unknown key: "${keyName}", attempting to send as-is`);
      }

      const finalKey = key || keyName;
      console.log(`🎹 Sending single key: "${keyName}" -> ${finalKey}`);
      await keyboard.pressKey(finalKey);

      // nut-js will handle timing automatically

      console.log(`✅ Key sent successfully: "${keyName}"`);
      return {
        content: [
          {
            type: "text",
            text: `Pressed key: ${keyName}`,
          },
        ],
      };
    } catch (error) {
      console.error(`❌ Error pressing key "${keyName}":`, error);
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

      console.log(`🔄 Opening application: ${appName}`);

      // Check if the application is already running
      try {
        const windows = await getWindows();
        const existingWindow = windows.find(window =>
          window.title && window.title.toLowerCase().includes(appName.toLowerCase().replace(' ', ''))
        );

        if (existingWindow) {
          console.log(`📝 ${appName} is already running, focusing existing window`);
          await existingWindow.focus();
          return {
            content: [{
              type: "text",
              text: `Focused existing ${appName} window`,
            }],
          };
        }
      } catch (e) {
        console.log('Could not check for existing windows, proceeding with launch');
      }

      // Open application and bring it to foreground
      await execAsync(`open -a "${appName}"`);
      console.log(`🔄 Launched ${appName}`);

      // Wait for the app to launch - using a Promise for app startup
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Use osascript to activate the application and bring it to front
      try {
        await execAsync(`osascript -e 'tell application "${appName}" to activate'`);
        console.log(`🔄 Activated ${appName} via osascript`);
      } catch (activateError) {
        console.log('Could not activate application via osascript:', activateError.message);
      }

      // Brief additional wait for app readiness
      await new Promise(resolve => setTimeout(resolve, 500));

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



  // Additional Screen Operations



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





  // Hotkey Navigation Methods
  async focusAddressBar() {
    try {
      console.log('🔄 Focusing address bar...');

      // First, ensure Chrome is focused by trying to focus a Chrome window
      try {
        const windows = await getWindows();
        const chromeWindow = windows.find(window =>
          window.title && (
            window.title.toLowerCase().includes('chrome') ||
            window.title.toLowerCase().includes('google chrome') ||
            window.title.includes(' - Google Chrome')
          )
        );

        if (chromeWindow) {
          console.log(`📝 Found Chrome window: "${chromeWindow.title}"`);
          await chromeWindow.focus();
          // nut-js autoDelay will handle timing
        } else {
          console.log('📝 No Chrome window found, sending keys to active window');
        }
      } catch (e) {
        console.log('📝 Could not focus Chrome window, proceeding with active window');
      }

      console.log('🎹 Sending Cmd+L to focus address bar');
      await keyboard.pressKey(Key.LeftCmd, Key.L);

      console.log('✅ Address bar focus command sent');
      return {
        content: [{
          type: "text",
          text: "Focused address bar (Cmd+L)",
        }],
      };
    } catch (error) {
      console.error('❌ Error focusing address bar:', error);
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

      await fs.promises.unlink(tempFile).catch(() => { });

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
    // Add uncaught exception handlers to prevent crashes
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      console.error('Stack:', error.stack);
      // Don't exit, try to continue
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit, try to continue
    });

    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error("Computer Control MCP Server started");
    } catch (error) {
      console.error("❌ Failed to start MCP server:", error);
      throw error;
    }
  }
}

export default ComputerControlMCPServer;

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    // Load environment variables when running as standalone
    try {
      const dotenv = await import('dotenv');
      dotenv.config();
    } catch (e) {
      // dotenv not available, continue without it
    }
    
    // Create server without configuration dependencies for standalone mode
    const server = new ComputerControlMCPServer();
    server.start().catch(console.error);
  })();
}
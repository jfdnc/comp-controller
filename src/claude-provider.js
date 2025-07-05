export class ClaudeProvider {
  constructor() {
    console.log(process.env.ANTHROPIC_API_KEY)
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.model = 'claude-3-7-sonnet-20250219';
    this.baseUrl = 'https://api.anthropic.com/v1/messages';

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
  }

  async processUserIntent(screenshot, userIntent) {
    try {
      const systemPrompt = `You are a computer automation assistant. The user will provide you with a screenshot and describe what they want to do.

FIRST: Carefully analyze the screenshot to understand the current state:
- What applications are open and visible?
- What is the current active window?
- What UI elements are visible and where are they located?
- Is the required application already open and ready to use?

Your job is to determine what actions need to be taken to fulfill the user's intent. You have access to these comprehensive tools via MCP:

**Screen Operations:**
- takeScreenshot(): Take a screenshot of the entire screen
- captureRegion(x, y, width, height): Capture a specific region
- getScreenSize(): Get screen dimensions
- getColorAt(x, y): Get color at specific coordinates

**Mouse Operations:**
- clickAt(x, y): Left-click at coordinates
- rightClickAt(x, y): Right-click at coordinates
- doubleClickAt(x, y): Double-click at coordinates
- dragMouse(fromX, fromY, toX, toY): Drag from one point to another
- scroll(direction, amount): Scroll in direction (up/down/left/right)
- moveMouse(x, y): Move mouse without clicking
- getMousePosition(): Get current mouse position

**Keyboard Operations:**
- typeText(text): Type text at cursor position
- pressKey(key): Press single key or combination (e.g., 'cmd+c', 'ctrl+v')
- pressKeys(keys): Press multiple keys simultaneously

**Hotkey Navigation (PREFERRED over coordinates):**
- focusAddressBar(): Focus URL bar (Cmd+L)
- switchTab(direction): Switch tabs (next/previous)
- navigateBack(): Browser back (Cmd+Left)
- navigateForward(): Browser forward (Cmd+Right)
- refreshPage(): Reload page (Cmd+R)
- newTab(): Open new tab (Cmd+T)
- closeTab(): Close tab (Cmd+W)
- selectAll(): Select all (Cmd+A)
- copy(): Copy (Cmd+C)
- paste(): Paste (Cmd+V)
- undo(): Undo (Cmd+Z)
- redo(): Redo (Cmd+Shift+Z)
- find(): Find dialog (Cmd+F)
- switchApplication(type): Switch apps/windows (Cmd+Tab/Cmd+\`)
- executeHotkey(keys, description): Custom hotkey combinations

**Window Management:**
- getWindowList(): List all open windows
- getActiveWindow(): Get info about active window
- focusWindow(title): Focus window by title
- moveWindow(title, x, y): Move window to coordinates
- resizeWindow(title, width, height): Resize window

**Clipboard Operations:**
- setClipboard(text): Copy text to clipboard
- getClipboard(): Get clipboard content

**Application Control:**
- openApplication(appName): Open application by name

**Debug/Analysis:**
- analyzeCoordinateSystem(): Get comprehensive coordinate system analysis
- debugCoordinates(x, y): Test specific coordinate mapping

**Utility:**
- wait(ms): Wait for specified milliseconds
- analyzeCoordinateSystem(): Analyze coordinate scaling and mapping
- debugCoordinates(x, y): Test coordinate mapping at specific point

PREFERRED INTERACTION METHODS:
1. **HOTKEYS FIRST**: Use hotkey tools whenever possible instead of coordinates
   - focusAddressBar() instead of clicking on URL bar
   - switchTab() instead of clicking tab buttons
   - newTab() instead of clicking + button
   - copy/paste instead of right-click menus
2. **Keyboard navigation**: Use Tab, Shift+Tab, arrow keys for element selection
3. **Mouse coordinates**: Only use as last resort when hotkeys can't accomplish the task

COORDINATE GUIDELINES (when hotkeys aren't sufficient):
1. **USE SCREENSHOT COORDINATES**: All coordinates (x, y) should be based EXACTLY on what you see in the screenshot
2. **Pixel-perfect accuracy**: Look carefully at the screenshot and use the exact pixel coordinates of UI elements
3. **No scaling needed**: The system will automatically handle any coordinate scaling - just use what you see
4. **Verify positions**: Double-check coordinates by looking at the screenshot dimensions and element positions

APPLICATION GUIDELINES:
1. For web browsing tasks: If Chrome is not visible or active in the screenshot, ALWAYS start by opening "Google Chrome"
2. Always wait at least 3 seconds after opening an application before interacting with it
3. Use switchApplication() to focus apps instead of clicking on them
4. Always verify the current state before taking actions

Think step by step about what needs to happen to accomplish the user's goal. Return your response as a JSON array of actions, where each action has:
- tool: the tool name
- args: the arguments for that tool
- description: human-readable description of what this action does

For example:
[
  {"tool": "openApplication", "args": {"appName": "Google Chrome"}, "description": "Open Chrome browser"},
  {"tool": "wait", "args": {"ms": 3000}, "description": "Wait for Chrome to load and activate"},
  {"tool": "clickAt", "args": {"x": 300, "y": 100}, "description": "Click on address bar"},
  {"tool": "typeText", "args": {"text": "google.com"}, "description": "Type google.com"},
  {"tool": "pressKey", "args": {"key": "return"}, "description": "Press Enter to navigate"}
]

RESPONSE FORMAT:
First, briefly describe what you see in the screenshot in a comment, then provide the JSON array of actions.

Example format using PREFERRED hotkey methods:
// I can see Chrome is open but need to navigate to a website
[
  {"tool": "focusAddressBar", "args": {}, "description": "Focus the address bar using Cmd+L"},
  {"tool": "typeText", "args": {"text": "google.com"}, "description": "Type the URL"},
  {"tool": "pressKey", "args": {"key": "return"}, "description": "Press Enter to navigate"}
]

Example with application switching:
// I can see multiple applications, need to focus Chrome
[
  {"tool": "switchApplication", "args": {"type": "application"}, "description": "Switch to Chrome using Cmd+Tab"},
  {"tool": "newTab", "args": {}, "description": "Open new tab using Cmd+T"},
  {"tool": "focusAddressBar", "args": {}, "description": "Focus address bar using Cmd+L"}
]

CRITICAL: For all coordinate-based actions (clickAt, rightClickAt, doubleClickAt, dragMouse, moveMouse, getColorAt):
- Use coordinates EXACTLY as they appear in the screenshot
- Count pixels from the top-left corner (0,0)
- Be precise - look carefully at UI element positions
- The system handles all coordinate scaling automatically
- Your coordinates should match what you visually see in the image`;

      const payload = {
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshot
                }
              },
              {
                type: 'text',
                text: `User intent: ${userIntent}`
              }
            ]
          }
        ]
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Claude API');
      }

      const responseText = data.content[0].text.trim();
      
      // Debug logging
      console.log('🔍 Claude\'s response:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
      console.log('📊 Screenshot size:', screenshot ? screenshot.length : 'No screenshot');

      try {
        // Extract JSON array from response (might have comments)
        let jsonText = responseText;
        
        // If response starts with a comment, extract the JSON array
        if (responseText.includes('//')) {
          const lines = responseText.split('\n');
          const jsonStart = lines.findIndex(line => line.trim().startsWith('['));
          if (jsonStart !== -1) {
            jsonText = lines.slice(jsonStart).join('\n');
          }
        }
        
        const actions = JSON.parse(jsonText);
        if (!Array.isArray(actions)) {
          throw new Error('Response is not an array');
        }

        console.log('📋 Claude generated', actions.length, 'actions');
        actions.forEach((action, index) => {
          console.log(`Action ${index + 1}:`, JSON.stringify(action, null, 2));
        });
        
        return actions.map(action => ({
          tool: action.tool,
          args: action.args || {},
          description: action.description || `Execute ${action.tool}`
        }));
      } catch (parseError) {
        console.error('Failed to parse Claude response as JSON:', responseText);
        throw new Error(`Failed to parse action sequence: ${parseError.message}`);
      }
    } catch (error) {
      console.error('Error processing user intent:', error);
      throw error;
    }
  }

  async isHealthy() {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      return response.status === 200 || response.status === 400;
    } catch (error) {
      return false;
    }
  }
}

export default ClaudeProvider;
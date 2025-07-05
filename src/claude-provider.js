import { ConfigurationManager } from './config/configuration-manager.js';

export class ClaudeProvider {
  constructor(config = null) {
    this.config = config || new ConfigurationManager();
    this.apiKey = this.config.get('anthropic.apiKey');
    this.model = this.config.get('anthropic.model');
    this.baseUrl = this.config.get('anthropic.baseUrl');
    this.maxTokens = this.config.get('anthropic.maxTokens');
    this.timeout = this.config.get('anthropic.timeout');

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


**Mouse Operations:**
- clickAt(x, y): Left-click at coordinates
- rightClickAt(x, y): Right-click at coordinates
- doubleClickAt(x, y): Double-click at coordinates
- scroll(direction, amount): Scroll in direction (up/down/left/right)

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

**Clipboard Operations:**
- setClipboard(text): Copy text to clipboard
- getClipboard(): Get clipboard content

**Application Control:**
- openApplication(appName): Open application by name

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
2. Applications will be ready automatically - no manual waits needed
3. Use switchApplication() to focus apps instead of clicking on them
4. Always verify the current state before taking actions
5. NEVER use wait() - all tools handle timing automatically

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

Example with application opening:
// Need to open Chrome and navigate
[
  {"tool": "openApplication", "args": {"appName": "Google Chrome"}, "description": "Open Chrome browser"},
  {"tool": "focusAddressBar", "args": {}, "description": "Focus address bar using Cmd+L"},
  {"tool": "typeText", "args": {"text": "reuters.com"}, "description": "Type the URL"},
  {"tool": "pressKey", "args": {"key": "return"}, "description": "Navigate to site"}
]

NOTE: No wait() calls needed - all tools handle timing and readiness automatically.

CRITICAL: For all coordinate-based actions (clickAt, rightClickAt, doubleClickAt, dragMouse, moveMouse, getColorAt):
- Use coordinates EXACTLY as they appear in the screenshot
- Count pixels from the top-left corner (0,0)
- Be precise - look carefully at UI element positions
- The system handles all coordinate scaling automatically
- Your coordinates should match what you visually see in the image`;

      const payload = {
        model: this.model,
        max_tokens: this.maxTokens,
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

      // Enhanced Claude decision logging
      console.log(`\n${'='.repeat(60)}`);
      console.log('🤖 CLAUDE DECISION LOG');
      console.log(`${'='.repeat(60)}`);
      console.log('📊 Screenshot size:', screenshot ? `${screenshot.length} bytes` : 'No screenshot');
      console.log('💬 User intent:', userIntent);
      console.log('⏱️  Timestamp:', new Date().toISOString());

      // Extract and display Claude's reasoning
      let claudeReasoning = '';
      if (responseText.includes('//')) {
        const lines = responseText.split('\n');
        const reasoningLines = lines.filter(line => line.trim().startsWith('//')).slice(0, 3);
        claudeReasoning = reasoningLines.map(line => line.replace('//', '').trim()).join(' ');
      }

      if (claudeReasoning) {
        console.log('🧠 Claude\'s analysis:', claudeReasoning);
      }

      console.log('📝 Claude\'s full response:');
      console.log(responseText);
      console.log(`${'='.repeat(60)}\n`);

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

        console.log(`\n📋 CLAUDE ACTION PLAN - ${actions.length} actions generated:`);
        actions.forEach((action, index) => {
          console.log(`\n${index + 1}. ${action.tool.toUpperCase()}`);
          console.log(`   Description: ${action.description}`);
          if (Object.keys(action.args || {}).length > 0) {
            console.log(`   Arguments: ${JSON.stringify(action.args, null, 6)}`);
          }
        });
        console.log('');

        return actions.map(action => ({
          tool: action.tool,
          args: action.args || {},
          description: action.description || `Execute ${action.tool}`
        }));
      } catch (parseError) {
        console.error('\n❌ CLAUDE RESPONSE PARSING FAILED:');
        console.error('Raw response:', responseText);
        console.error('Parse error:', parseError.message);
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
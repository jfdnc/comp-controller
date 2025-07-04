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

Your job is to determine what actions need to be taken to fulfill the user's intent. You have access to these tools via MCP:

- takeScreenshot(): Take a new screenshot
- clickAt(x, y): Click at specific coordinates  
- typeText(text): Type text at current cursor position
- pressKey(key): Press keys like 'return', 'tab', 'escape', etc.
- getWindowList(): Get list of open windows
- openApplication(appName): Open an application by name
- getMousePosition(): Get current mouse cursor position
- wait(ms): Wait for specified milliseconds

IMPORTANT GUIDELINES:
1. For web browsing tasks: If Chrome is not visible or active in the screenshot, ALWAYS start by opening "Google Chrome"
2. Always wait at least 3 seconds after opening an application before interacting with it
3. When clicking on interface elements, be very precise with coordinates based on the screenshot
4. If an application is open but not active/focused, click on it first to bring it to focus
5. Always verify the current state before taking actions

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

Example format:
// I can see the desktop with no Chrome window visible
[
  {"tool": "openApplication", "args": {"appName": "Google Chrome"}, "description": "Open Chrome browser"},
  {"tool": "wait", "args": {"ms": 3000}, "description": "Wait for Chrome to load and activate"},
  {"tool": "clickAt", "args": {"x": 300, "y": 100}, "description": "Click on address bar"},
  {"tool": "typeText", "args": {"text": "google.com"}, "description": "Type google.com"},
  {"tool": "pressKey", "args": {"key": "return"}, "description": "Press Enter to navigate"}
]

IMPORTANT: For clickAt actions, you MUST provide both x and y coordinates as numbers. Look carefully at the screenshot to identify the exact pixel coordinates of UI elements.`;

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
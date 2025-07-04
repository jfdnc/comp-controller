Create a voice-controlled computer automation system with the following requirements:

## Project Structure
computer-control/
├── package.json
├── src/
│   ├── main.js              # Entry point, process coordination
│   ├── mcp-server.js        # MCP server wrapping nut.js
│   ├── mcp-client.js        # MCP client + Claude integration
│   ├── claude-provider.js   # Anthropic API integration
│   ├── action-queue.js      # Debug stepping queue system
│   └── audio-stub.js        # Future speech integration placeholder
└── README.md

## Dependencies (package.json)
{
  "name": "computer-control",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@nut-tree/nut-js": "^4.x",
    "@modelcontextprotocol/sdk": "latest"
  }
}

## Core Functionality

### MCP Server (mcp-server.js)
Expose these tools via MCP protocol:
- takeScreenshot() - Returns base64 screenshot
- clickAt(x, y) - Click coordinates
- typeText(text) - Type string
- pressKey(key) - Press key (enter, tab, etc)
- getWindowList() - List open windows
- openApplication(appName) - Launch app by name
- getMousePosition() - Current cursor location

### Claude Integration (claude-provider.js)
- Use Anthropic API with Claude Sonnet 4
- Send screenshot + user intent as prompt
- Parse tool calls from response
- Return structured action list

### Action Queue System (action-queue.js)
- Queue multiple actions from Claude response
- Execute one action at a time
- Terminal prompt for "next" or "abort"
- Show current action + remaining queue
- Safety abort at any step

### Main Process (main.js)
- Start MCP server on stdio
- Terminal readline interface for user input
- Coordinate screenshot → Claude → action queue → execution
- Handle Ctrl+C gracefully

## User Flow
1. Terminal prompts: "Enter command: "
2. User types intent: "open chrome and go to google.com"
3. System takes screenshot, sends to Claude with intent
4. Claude returns action sequence via MCP tools
5. Actions queue up, user prompted: "Execute action 1/3: openApplication('chrome')? (y/n/abort): "
6. Step through each action with confirmation
7. Return to input prompt when complete

## Technical Requirements
- Use MCP SDK stdio transport
- nut.js for all system control
- Node.js fetch for Anthropic API
- Terminal-only interface (no GUI)
- Environment variable ANTHROPIC_API_KEY required
- macOS accessibility permissions handling

## Audio Stub (audio-stub.js)
Create placeholder class:
class AudioManager {
  async startListening() { /* TODO */ }
  async stopListening() { /* TODO */ }
  onSpeechResult(callback) { /* TODO */ }
}

## Error Handling
- Graceful MCP connection failures
- Anthropic API rate limiting/errors
- nut.js permission errors
- Invalid action parameters

## Example Terminal Session
Computer Control Started. Press Ctrl+C to exit.
Enter command: open chrome
Taking screenshot...
Asking Claude for actions...
Action queue (2 actions):
1. openApplication('chrome')
2. wait(2000)

Execute action 1/2: openApplication('chrome')? (y/n/abort): y
✓ Action completed
Execute action 2/2: wait(2000)? (y/n/abort): y
✓ Action completed
All actions complete.

Enter command: 

Build this as a working prototype focusing on the action queue debug system and MCP integration. Make it easily extensible for future audio and UI features.
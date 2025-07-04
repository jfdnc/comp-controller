# Computer Control

A voice-controlled computer automation system using MCP (Model Context Protocol) and Claude AI.

## Features

- 🎯 Natural language computer control
- 🔧 MCP server/client architecture for system automation
- 🤖 Claude AI integration for intelligent action planning
- 🎮 Step-by-step action queue with user confirmation
- 🎤 Audio input support (coming soon)
- 🖥️ Cross-platform system control via nut.js

## Prerequisites

- Node.js 18+ 
- macOS (with accessibility permissions)
- Anthropic API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd computer-control
```

2. Install dependencies:
```bash
npm install
```

3. Set up your Anthropic API key:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

## Usage

### Basic Usage

Start the application:
```bash
npm start
```

The system will:
1. Connect to the MCP server
2. Verify Claude API connectivity
3. Present a command prompt

### Example Commands

- `"open chrome and go to google.com"`
- `"take a screenshot"`
- `"click on the search button"`
- `"type 'hello world'"`

### Action Queue Flow

When you enter a command:
1. System takes a screenshot
2. Claude analyzes the screen and your intent
3. Claude returns a sequence of actions
4. You're prompted to confirm each action: `(y/n/s/abort)`
   - `y` - Execute the action
   - `n/s` - Skip this action
   - `abort` - Stop the entire queue

## Architecture

### Components

- **main.js** - Entry point and process coordinator
- **mcp-server.js** - MCP server wrapping nut.js functionality
- **mcp-client.js** - MCP client for communicating with the server
- **claude-provider.js** - Anthropic API integration
- **action-queue.js** - Debug stepping system for actions
- **audio-stub.js** - Placeholder for future speech integration

### Available Tools

The MCP server exposes these tools:
- `takeScreenshot()` - Capture screen
- `clickAt(x, y)` - Click coordinates
- `typeText(text)` - Type text
- `pressKey(key)` - Press keys (return, tab, etc.)
- `getWindowList()` - List open windows
- `openApplication(appName)` - Launch applications
- `getMousePosition()` - Get cursor position
- `wait(ms)` - Wait for specified time

## macOS Permissions

You'll need to grant accessibility permissions:

1. Go to System Preferences → Security & Privacy → Privacy
2. Select "Accessibility" from the left sidebar
3. Click the lock and enter your password
4. Add Terminal (or your Node.js runtime) to the list
5. Restart the application

## Development

### Running in Development Mode

```bash
npm run dev
```

### Project Structure

```
computer-control/
├── package.json
├── src/
│   ├── main.js              # Entry point
│   ├── mcp-server.js        # MCP server
│   ├── mcp-client.js        # MCP client
│   ├── claude-provider.js   # Claude integration
│   ├── action-queue.js      # Action queue system
│   └── audio-stub.js        # Audio placeholder
└── README.md
```

## Environment Variables

- `ANTHROPIC_API_KEY` - Required for Claude API access

## Error Handling

The system includes comprehensive error handling for:
- MCP connection failures
- Claude API errors and rate limiting
- nut.js permission errors
- Invalid action parameters

## Future Features

- 🎤 Voice input with speech-to-text
- 🎛️ GUI control panel with on/off switch
- 🔊 Text-to-speech responses
- 📱 Mobile companion app
- 🔒 Enhanced security and permission management

## Troubleshooting

### Common Issues

1. **"MCP server connection failed"**
   - Ensure all dependencies are installed
   - Check that Node.js version is 18+

2. **"Claude API not accessible"**
   - Verify your `ANTHROPIC_API_KEY` is set correctly
   - Check your internet connection

3. **"Permission denied" errors**
   - Grant accessibility permissions in macOS System Preferences
   - Restart the application after granting permissions

4. **Actions not executing**
   - Check macOS accessibility permissions
   - Ensure the target application is in focus

### Getting Help

- Check the console output for detailed error messages
- Ensure all environment variables are set correctly
- Verify system permissions are granted

## License

MIT License - see LICENSE file for details
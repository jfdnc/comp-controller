## Session Context

This testing guide was created to provide manual testing methods for our MCP server and tools. Since our tools perform actual computer control (typing, clicking, opening apps), automated tests would be disruptive during development, so we needed reliable manual testing procedures instead.

---

# MCP Server Testing

## Quick Test
```bash
# Test server/client connection
node -e "
import('./src/mcp-client.js').then(async ({MCPClient}) => {
  const client = new MCPClient();
  await client.connectToServer('./src/mcp-server.js');
  console.log('Tools:', client.getTools().map(t => t.name));
  await client.callTool('typeText', {text: 'hello'});
  await client.cleanup();
});"
```

## Manual Tool Testing
```bash
# Test individual tools
node -e "
import('./src/mcp-client.js').then(async ({MCPClient}) => {
  const client = new MCPClient();
  await client.connectToServer('./src/mcp-server.js');
  
  // Test each tool
  await client.callTool('typeText', {text: 'test'});
  await client.callTool('pressKey', {key: 'enter'});
  await client.callTool('getWindowList');
  await client.callTool('openApplication', {appName: 'TextEdit'});
  
  await client.cleanup();
});"
```

## Using MCP Inspector
```bash
# Install and run inspector
npx @modelcontextprotocol/inspector node src/mcp-server.js
```

## Direct Server Test
```bash
# Run server directly (will wait for stdio input)
node src/mcp-server.js
```

**Note**: Requires macOS accessibility permissions for keyboard/app control.
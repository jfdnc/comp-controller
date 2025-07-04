import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class MCPClient {
  constructor() {
    this.client = null;
    this.transport = null;
    this.connected = false;
  }

  async connect() {
    try {
      this.transport = new StdioClientTransport({
        command: 'node',
        args: ['src/mcp-server.js'],
        cwd: process.cwd()
      });

      this.client = new Client({
        name: "computer-control-client",
        version: "1.0.0"
      }, {
        capabilities: {}
      });

      await this.client.connect(this.transport);
      this.connected = true;
      
      console.log('✅ Connected to MCP server');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error);
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.client && this.connected) {
        await this.client.close();
      }
      
      this.connected = false;
      console.log('MCP client disconnected');
    } catch (error) {
      console.error('Error disconnecting MCP client:', error);
    }
  }

  async listTools() {
    if (!this.connected || !this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.listTools();
      return response.tools;
    } catch (error) {
      console.error('Error listing tools:', error);
      throw error;
    }
  }

  async callTool(name, args = {}) {
    if (!this.connected || !this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.callTool({
        name,
        arguments: args
      });

      return response;
    } catch (error) {
      console.error(`Error calling tool ${name}:`, error);
      throw error;
    }
  }

  async takeScreenshot() {
    const result = await this.callTool('takeScreenshot');
    
    if (result.isError) {
      throw new Error(result.content[0]?.text || 'Failed to take screenshot');
    }

    const imageContent = result.content.find(item => item.type === 'image');
    if (!imageContent) {
      throw new Error('No image data in screenshot response');
    }

    return imageContent.data;
  }

  async clickAt(x, y) {
    return await this.callTool('clickAt', { x, y });
  }

  async typeText(text) {
    return await this.callTool('typeText', { text });
  }

  async pressKey(key) {
    return await this.callTool('pressKey', { key });
  }

  async getWindowList() {
    return await this.callTool('getWindowList');
  }

  async openApplication(appName) {
    return await this.callTool('openApplication', { appName });
  }

  async getMousePosition() {
    return await this.callTool('getMousePosition');
  }

  async wait(ms) {
    return await this.callTool('wait', { ms });
  }

  isConnected() {
    return this.connected;
  }

  async healthCheck() {
    try {
      const tools = await this.listTools();
      return tools && tools.length > 0;
    } catch (error) {
      return false;
    }
  }
}

export default MCPClient;
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

class MCPClient {
  constructor() {
    this.mcp = new Client({
      name: "computer-control-client",
      version: "1.0.0"
    }, {
      capabilities: {}
    });
    this.transport = null;
    this.tools = [];
  }

  async connectToServer(serverScriptPath) {
    try {
      this.transport = new StdioClientTransport({
        command: process.execPath,
        args: [serverScriptPath],
      });
      
      await this.mcp.connect(this.transport);

      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        };
      });
      
      console.log(
        "Connected to server with tools:",
        this.tools.map(({ name }) => name)
      );
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  async callTool(toolName, toolArgs = {}) {
    try {
      const result = await this.mcp.callTool({
        name: toolName,
        arguments: toolArgs,
      });
      return result;
    } catch (e) {
      console.log(`Failed to call tool ${toolName}:`, e);
      throw e;
    }
  }

  async cleanup() {
    if (this.mcp) {
      await this.mcp.close();
    }
  }

  getTools() {
    return this.tools;
  }
}

export { MCPClient };
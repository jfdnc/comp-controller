#!/usr/bin/env node

import dotenv from 'dotenv';
import readline from 'readline';
import { MCPClient } from './mcp-client.js';
import { ClaudeProvider } from './claude-provider.js';
import { ActionQueue } from './action-queue.js';
import { AudioManager } from './audio-stub.js';

dotenv.config();

class ComputerControlApp {
  constructor() {
    this.mcpClient = new MCPClient();
    this.claudeProvider = new ClaudeProvider();
    this.actionQueue = new ActionQueue(this.mcpClient);
    this.audioManager = new AudioManager();
    this.running = false;
    this.rl = null;
  }

  async initialize() {
    console.log('🚀 Computer Control Starting...');

    try {
      console.log('🔌 Connecting to MCP server...');
      const connected = await this.mcpClient.connect();
      if (!connected) {
        throw new Error('Failed to connect to MCP server');
      }

      console.log('🔍 Verifying Claude API...');
      const healthy = await this.claudeProvider.isHealthy();
      if (!healthy) {
        throw new Error('Claude API is not accessible. Please check your ANTHROPIC_API_KEY.');
      }

      console.log('✅ All systems ready');
      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      return false;
    }
  }

  async start() {
    const initialized = await this.initialize();
    if (!initialized) {
      process.exit(1);
    }

    this.running = true;
    this.setupSignalHandlers();

    process.stdin.setRawMode(false);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    console.log('\n🎯 Computer Control Ready!');
    console.log('💡 Type your command or press Ctrl+C to exit');
    console.log('📝 Example: "open chrome and go to google.com"');
    console.log('🔊 Voice input coming soon...\n');

    await this.runMainLoop();
  }

  async runMainLoop() {
    while (this.running) {
      try {
        const command = await this.promptForCommand();
        if (!command.trim()) continue;

        if (command.toLowerCase() === 'exit' || command.toLowerCase() === 'quit') {
          break;
        }

        await this.processCommand(command);
      } catch (error) {
        console.error('❌ Error processing command:', error.message);
        console.log('');
      }
    }

    await this.shutdown();
  }

  async promptForCommand() {
    return new Promise((resolve) => {
      this.rl.question('Enter command: ', (answer) => {
        resolve(answer);
      });
    });
  }

  async processCommand(userIntent) {
    console.log(`\n🎯 Processing: "${userIntent}"`);

    try {
      console.log('📸 Taking screenshot...');
      const screenshot = await this.mcpClient.takeScreenshot();

      console.log('🤖 Asking Claude for action plan...');
      const actions = await this.claudeProvider.processUserIntent(screenshot, userIntent);

      if (!actions || actions.length === 0) {
        console.log('🤷 No actions needed for this request');
        return;
      }

      console.log('📋 Setting up action queue...');
      await this.actionQueue.addActions(actions);

      console.log('🎬 Starting action execution...');
      const success = await this.actionQueue.executeQueue();

      if (success) {
        console.log('🎉 Command completed successfully!');
      } else {
        console.log('⚠️  Command was interrupted or failed');
      }
    } catch (error) {
      console.error('❌ Failed to process command:', error.message);
    }

    console.log('');
  }

  setupSignalHandlers() {
    const handleShutdown = async (signal) => {
      console.log(`\n📨 Received ${signal}, shutting down gracefully...`);
      this.running = false;
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);

    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      this.shutdown().then(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown().then(() => process.exit(1));
    });
  }

  async shutdown() {
    console.log('🔄 Shutting down...');

    try {
      if (this.rl) {
        this.rl.close();
      }

      if (this.actionQueue) {
        this.actionQueue.close();
      }

      if (this.mcpClient) {
        await this.mcpClient.disconnect();
      }

      if (this.audioManager) {
        await this.audioManager.stopListening();
      }

      console.log('✅ Shutdown complete');
    } catch (error) {
      console.error('❌ Error during shutdown:', error.message);
    }
  }

  async listAvailableTools() {
    try {
      const tools = await this.mcpClient.listTools();
      console.log('🔧 Available tools:');
      tools.forEach((tool, index) => {
        console.log(`${index + 1}. ${tool.name} - ${tool.description}`);
      });
    } catch (error) {
      console.error('❌ Failed to list tools:', error.message);
    }
  }

  async getSystemStatus() {
    const status = {
      mcpConnected: this.mcpClient.isConnected(),
      claudeHealthy: await this.claudeProvider.isHealthy(),
      audioReady: false,
      queueStatus: this.actionQueue.getStatus()
    };

    console.log('📊 System Status:', JSON.stringify(status, null, 2));
    return status;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = new ComputerControlApp();
  app.start().catch(console.error);
}

export default ComputerControlApp;
import readline from 'readline';
import { ConfigurationManager } from './config/configuration-manager.js';
import { keyboard, Key } from "@nut-tree-fork/nut-js";

export class ActionQueue {
  constructor(mcpClient, config = null) {
    this.mcpClient = mcpClient;
    this.config = config || new ConfigurationManager();
    this.queue = [];
    this.currentIndex = 0;
    this.aborted = false;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
  }

  async addActions(actions) {
    this.queue = [...actions];
    this.currentIndex = 0;
    this.aborted = false;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 ACTION QUEUE SETUP - ${this.queue.length} actions`);
    console.log(`${'='.repeat(60)}`);
    this.queue.forEach((action, index) => {
      console.log(`${index + 1}. ${action.tool} - ${action.description}`);
      if (Object.keys(action.args || {}).length > 0) {
        console.log(`   Args: ${JSON.stringify(action.args)}`);
      }
    });
    console.log(`${'='.repeat(60)}\n`);
  }

  async executeQueue() {
    if (this.queue.length === 0) {
      console.log('No actions to execute.');
      return true;
    }

    // Reset execution state
    this.aborted = false;
    this.currentIndex = 0;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎬 ACTION EXECUTION LOG - ${this.queue.length} actions queued`);
    console.log(`${'='.repeat(60)}`);

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < this.queue.length; i++) {
      // Check if execution was aborted (with async safety)
      if (this.aborted) {
        console.log('\n🛑 Execution aborted by user or system');
        break;
      }

      this.currentIndex = i;
      const action = this.queue[i];

      // Additional abort check with small delay to allow for async abort signals
      await new Promise(resolve => setTimeout(resolve, 1));
      if (this.aborted) {
        console.log('\n🛑 Execution aborted before action execution');
        break;
      }

      // Validate action structure
      if (!action || !action.tool) {
        console.error(`❌ [${i + 1}/${this.queue.length}] INVALID ACTION: Missing tool name`);
        failureCount++;
        continue;
      }

      try {
        console.log(`\n📝 [${i + 1}/${this.queue.length}] STARTING: ${action.tool}`);
        console.log(`💬 Description: ${action.description || 'No description'}`);
        console.log(`🔧 Tool: ${action.tool}`);
        console.log(`📦 Arguments: ${JSON.stringify(action.args || {}, null, 2)}`);
        console.log(`⏱️  Timestamp: ${new Date().toISOString()}`);

        const startTime = Date.now();

        // Execute action with timeout protection and proper cleanup
        const timeoutMs = this.config.get('actionQueue.defaultTimeoutMs');
        let timeoutId;
        let actionCompleted = false;

        const result = await Promise.race([
          this.executeAction(action).then(result => {
            actionCompleted = true;
            if (timeoutId) clearTimeout(timeoutId);
            return result;
          }).catch(error => {
            actionCompleted = true;
            if (timeoutId) clearTimeout(timeoutId);
            throw error;
          }),
          new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              if (!actionCompleted) {
                const timeoutError = new Error(`Action ${action.tool} timed out after ${timeoutMs}ms`);
                timeoutError.actionTool = action.tool;
                timeoutError.isTimeout = true;
                reject(timeoutError);
              }
            }, timeoutMs);
          })
        ]);

        const duration = Date.now() - startTime;

        console.log(`✅ [${i + 1}/${this.queue.length}] COMPLETED: ${action.tool} (${duration}ms)`);
        if (result && result.content && result.content[0] && result.content[0].text) {
          console.log(`📝 Result: ${result.content[0].text}`);
        }

        successCount++;

        // Small delay between actions to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, this.config.get('actionQueue.actionDelayMs')));

      } catch (error) {
        console.error(`❌ [${i + 1}/${this.queue.length}] FAILED: ${action.tool}`);
        console.error(`🚫 Error: ${error.message}`);
        console.error(`📎 Stack: ${error.stack?.split('\n')[1] || 'No stack trace'}`);

        // Log additional error context if available
        if (error.actionTool) {
          console.error(`🔧 Failed Tool: ${error.actionTool}`);
        }
        if (error.isTimeout) {
          console.error(`⏰ Error Type: Timeout`);
        }
        if (error.originalError) {
          console.error(`🔗 Original Error: ${error.originalError.message}`);
        }

        failureCount++;

        // Enhanced critical action handling
        if (this.isCriticalAction(action)) {
          console.log('⚠️  Critical action failed, stopping execution');
          console.log(`💥 Critical failure details: ${error.message}`);
          this.aborted = true;
          break;
        }

        // Check for connection errors that might affect subsequent actions
        if (error.message.includes('not connected') || error.message.includes('health check failed')) {
          console.log('🔌 Connection issue detected, stopping execution to prevent cascade failures');
          this.aborted = true;
          break;
        }

        console.log('⏭️  Continuing with next action...');
        continue;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 EXECUTION COMPLETED!`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📊 Success Rate: ${Math.round((successCount / this.queue.length) * 100)}%`);
    console.log(`${'='.repeat(60)}\n`);

    return !this.aborted && failureCount === 0;
  }

  async promptForAction(action, currentNum, totalNum) {
    const question = `Execute action ${currentNum}/${totalNum}: ${action.description}? (y/n/s/abort): `;

    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        const response = answer.toLowerCase().trim();

        switch (response) {
          case 'y':
          case 'yes':
            resolve('execute');
            break;
          case 'n':
          case 'no':
          case 's':
          case 'skip':
            resolve('skip');
            break;
          case 'abort':
          case 'a':
            resolve('abort');
            break;
          default:
            console.log('Please enter y (yes), n/s (skip), or abort');
            resolve(this.promptForAction(action, currentNum, totalNum));
        }
      });
    });
  }

  async promptForError(error, currentNum, totalNum) {
    const question = `Action ${currentNum}/${totalNum} failed. Continue with next action? (y/n/abort): `;

    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        const response = answer.toLowerCase().trim();

        switch (response) {
          case 'y':
          case 'yes':
            resolve('continue');
            break;
          case 'n':
          case 'no':
          case 's':
          case 'skip':
            resolve('skip');
            break;
          case 'abort':
          case 'a':
            resolve('abort');
            break;
          default:
            console.log('Please enter y (continue), n/s (skip remaining), or abort');
            resolve(this.promptForError(error, currentNum, totalNum));
        }
      });
    });
  }

  async executeAction(action) {
    // Special handling for typeText to bypass MCP crashes
    if (action.tool === 'typeText') {
      return await this.executeTypeTextDirect(action);
    }

    if (!this.mcpClient) {
      throw new Error('MCP client not available');
    }

    // Validate MCP client connection with health check
    if (!this.mcpClient.isConnected()) {
      throw new Error('MCP client is not connected');
    }

    // Additional connection health check for critical actions
    if (this.isCriticalAction(action)) {
      try {
        const healthCheck = await this.mcpClient.healthCheck();
        if (!healthCheck) {
          throw new Error('MCP client failed health check');
        }
      } catch (healthError) {
        throw new Error(`MCP health check failed: ${healthError.message}`);
      }
    }

    let result;
    try {
      // Execute the tool call with proper async handling
      result = await this.mcpClient.callTool(action.tool, action.args || {});
    } catch (error) {
      // Enhance error with context and action details
      const enhancedError = new Error(`MCP tool call failed for ${action.tool}: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.actionTool = action.tool;
      enhancedError.actionArgs = action.args;
      throw enhancedError;
    }

    // Check for explicit error response
    if (result && result.isError) {
      const errorMessage = result.content && result.content[0] && result.content[0].text
        ? result.content[0].text
        : 'Unknown MCP error';
      const toolError = new Error(`Tool execution error: ${errorMessage}`);
      toolError.mcpResult = result;
      toolError.actionTool = action.tool;
      throw toolError;
    }

    // Validate result structure
    if (!result) {
      throw new Error(`Tool ${action.tool} returned null/undefined result`);
    }

    return result;
  }

  async executeTypeTextDirect(action) {
    try {
      const text = action.args?.text;
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input: must be a non-empty string');
      }

      console.log(`🎹 Direct typing: "${text}"`);
      
      // Longer delay to ensure address bar is fully focused and ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Configure keyboard for more reliable typing
      const originalDelay = keyboard.config.autoDelayMs;
      keyboard.config.autoDelayMs = 50; // Faster typing
      
      try {
        // Clear any existing content first with Cmd+A then type
        await keyboard.pressKey(Key.LeftCmd, Key.A);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Type the text
        await keyboard.type(text);
        
        console.log(`✅ Successfully typed: "${text}"`);
      } finally {
        // Restore original keyboard delay
        keyboard.config.autoDelayMs = originalDelay;
      }
      
      return {
        content: [{ type: "text", text: `Typed text: "${text}"` }],
      };
    } catch (error) {
      console.error(`❌ Direct typing failed:`, error.message);
      throw new Error(`Failed to type text: ${error.message}`);
    }
  }

  // Helper method to determine if an action is critical
  isCriticalAction(action) {
    // Define actions that if they fail, should stop execution
    const criticalActions = ['openApplication', 'focusAddressBar'];
    return criticalActions.includes(action.tool);
  }

  // Method to abort execution with async safety
  abort() {
    this.aborted = true;
    console.log('🛑 Action queue execution aborted');

    // Give time for any in-progress actions to see the abort signal
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('🛑 Abort signal propagated');
        resolve();
      }, 50);
    });
  }

  // Method to safely abort and wait for current action to complete
  async abortGracefully() {
    console.log('🛑 Graceful abort requested...');
    this.aborted = true;

    // Wait for current action to complete or timeout
    const maxWaitMs = 5000;
    const startTime = Date.now();

    while (this.currentIndex < this.queue.length && (Date.now() - startTime) < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('🛑 Graceful abort completed');
    return true;
  }

  getStatus() {
    return {
      total: this.queue.length,
      current: this.currentIndex + 1,
      remaining: this.queue.length - this.currentIndex - 1,
      completed: this.currentIndex,
      aborted: this.aborted
    };
  }

  getRemainingActions() {
    return this.queue.slice(this.currentIndex);
  }

  clear() {
    this.queue = [];
    this.currentIndex = 0;
    this.aborted = false;
  }

  close() {
    this.rl.close();
  }
}

export default ActionQueue;
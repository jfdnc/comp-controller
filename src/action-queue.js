import readline from 'readline';

export class ActionQueue {
  constructor(mcpClient) {
    this.mcpClient = mcpClient;
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
    
    console.log(`\nAction queue (${this.queue.length} actions):`);
    this.queue.forEach((action, index) => {
      console.log(`${index + 1}. ${action.description}`);
    });
    console.log('');
  }

  async executeQueue() {
    if (this.queue.length === 0) {
      console.log('No actions to execute.');
      return true;
    }

    for (let i = 0; i < this.queue.length; i++) {
      this.currentIndex = i;
      const action = this.queue[i];
      
      try {
        console.log(`🔄 Executing action ${i + 1}/${this.queue.length}: ${action.description}`);
        await this.executeAction(action);
        console.log(`✅ Action ${i + 1} completed successfully`);
      } catch (error) {
        console.error(`❌ Action ${i + 1} failed: ${error.message}`);
        console.log('⏭️  Continuing with next action...');
        continue;
      }
    }

    console.log('🎉 All actions completed!');
    return true;
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
    if (!this.mcpClient) {
      throw new Error('MCP client not available');
    }

    const result = await this.mcpClient.callTool(action.tool, action.args);
    
    if (result.isError) {
      throw new Error(result.content[0]?.text || 'Unknown error');
    }
    
    return result;
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
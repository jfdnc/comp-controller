/**
 * Screenshot Service - Platform-agnostic screenshot functionality
 */

export class ScreenshotService {
  constructor() {
    this.platform = process.platform;
  }

  /**
   * Take a screenshot and return as base64
   * @returns {Promise<string>} Base64 encoded screenshot
   */
  async takeScreenshot() {
    try {
      switch (this.platform) {
        case 'darwin':
          return await this._takeMacOSScreenshot();
        case 'win32':
          return await this._takeWindowsScreenshot();
        case 'linux':
          return await this._takeLinuxScreenshot();
        default:
          throw new Error(`Unsupported platform: ${this.platform}`);
      }
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  }

  /**
   * Take screenshot on macOS using screencapture
   * @private
   */
  async _takeMacOSScreenshot() {
    const os = await import('os');
    const path = await import('path');
    const fs = await import('fs');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `screenshot-${Date.now()}.png`);

    try {
      // Take screenshot using macOS screencapture
      await execAsync(`screencapture -x -t png "${tempFile}"`);

      const screenshotBuffer = await fs.promises.readFile(tempFile);
      const base64 = screenshotBuffer.toString('base64');

      return base64;
    } finally {
      // Always clean up temp file
      try {
        await fs.promises.unlink(tempFile);
      } catch (cleanupError) {
        console.warn('Failed to cleanup screenshot temp file:', cleanupError.message);
      }
    }
  }

  /**
   * Take screenshot on Windows using PowerShell
   * @private
   */
  async _takeWindowsScreenshot() {
    // TODO: Implement Windows screenshot
    throw new Error('Windows screenshots not implemented yet');
  }

  /**
   * Take screenshot on Linux using gnome-screenshot
   * @private
   */
  async _takeLinuxScreenshot() {
    // TODO: Implement Linux screenshot
    throw new Error('Linux screenshots not implemented yet');
  }

  /**
   * Get screenshot metadata (dimensions, etc.)
   * @returns {Promise<Object>} Screenshot metadata
   */
  async getScreenshotInfo() {
    // TODO: Implement screenshot info extraction
    return {
      platform: this.platform,
      timestamp: new Date().toISOString()
    };
  }
}
/**
 * Configuration Manager - Centralized configuration handling
 */

export class ConfigurationManager {
  constructor() {
    this.config = this._loadConfiguration();
    this._validateConfiguration();
  }

  /**
   * Load configuration from environment and defaults
   * @private
   */
  _loadConfiguration() {
    return {
      // API Configuration
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219',
        baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1/messages',
        maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 4096,
        timeout: parseInt(process.env.ANTHROPIC_TIMEOUT_MS) || 30000
      },

      // NutJS Configuration
      nutjs: {
        mouseSpeed: parseInt(process.env.NUTJS_MOUSE_SPEED) || 1000,
        mouseAutoDelayMs: parseInt(process.env.NUTJS_MOUSE_DELAY) || 100,
        keyboardAutoDelayMs: parseInt(process.env.NUTJS_KEYBOARD_DELAY) || 100,
        screenConfidence: parseFloat(process.env.NUTJS_SCREEN_CONFIDENCE) || 0.8,
        screenAutoHighlight: process.env.NUTJS_AUTO_HIGHLIGHT === 'true' || false
      },

      // Action Queue Configuration
      actionQueue: {
        defaultTimeoutMs: parseInt(process.env.ACTION_TIMEOUT_MS) || 30000,
        retryAttempts: parseInt(process.env.ACTION_RETRY_ATTEMPTS) || 2,
        retryDelayMs: parseInt(process.env.ACTION_RETRY_DELAY_MS) || 500,
        actionDelayMs: parseInt(process.env.ACTION_DELAY_MS) || 100
      },

      // Screenshot Configuration
      screenshot: {
        format: process.env.SCREENSHOT_FORMAT || 'png',
        quality: parseInt(process.env.SCREENSHOT_QUALITY) || 90,
        tempDir: process.env.SCREENSHOT_TEMP_DIR || null, // null = use system temp
        cleanup: process.env.SCREENSHOT_CLEANUP !== 'false'
      },

      // Logging Configuration
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableTimestamps: process.env.LOG_TIMESTAMPS !== 'false',
        enableColors: process.env.LOG_COLORS !== 'false'
      },

      // Development Configuration
      development: {
        isDevelopment: process.env.NODE_ENV === 'development',
        enableDebug: process.env.DEBUG === 'true',
        verboseLogging: process.env.VERBOSE === 'true'
      }
    };
  }

  /**
   * Validate required configuration
   * @private
   */
  _validateConfiguration() {
    const required = [
      { path: 'anthropic.apiKey', name: 'ANTHROPIC_API_KEY' }
    ];

    for (const req of required) {
      const value = this._getNestedValue(this.config, req.path);
      if (!value) {
        throw new Error(`Required configuration missing: ${req.name}`);
      }
    }

    // Validate API key format (basic check)
    if (this.config.anthropic.apiKey && !this.config.anthropic.apiKey.startsWith('sk-ant-')) {
      console.warn('⚠️  API key format may be invalid (should start with sk-ant-)');
    }
  }

  /**
   * Get nested configuration value
   * @private
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get configuration value by path
   * @param {string} path - Dot notation path (e.g., 'anthropic.apiKey')
   * @returns {any} Configuration value
   */
  get(path) {
    return this._getNestedValue(this.config, path);
  }

  /**
   * Get all configuration
   * @returns {Object} Complete configuration object
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Get configuration for a specific section
   * @param {string} section - Configuration section name
   * @returns {Object} Section configuration
   */
  getSection(section) {
    return { ...this.config[section] };
  }

  /**
   * Update configuration value (runtime only, not persisted)
   * @param {string} path - Dot notation path
   * @param {any} value - New value
   */
  set(path, value) {
    const keys = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Check if running in development mode
   * @returns {boolean}
   */
  isDevelopment() {
    return this.config.development.isDevelopment;
  }

  /**
   * Check if debug mode is enabled
   * @returns {boolean}
   */
  isDebugEnabled() {
    return this.config.development.enableDebug;
  }
}
import { keyboard, Key } from "@nut-tree-fork/nut-js";

/**
 * Mapping of semantic shortcut names to their macOS key combinations
 * @type {Object<string, Key[]>}
 */
const MACOS_SHORTCUTS = {
  "open spotlight": [Key.LeftCmd, Key.Space],
  "open finder": [Key.LeftCmd, Key.Space],
  "new tab": [Key.LeftCmd, Key.T],
  "close tab": [Key.LeftCmd, Key.W],
  "close window": [Key.LeftCmd, Key.Q],
  "copy": [Key.LeftCmd, Key.C],
  "paste": [Key.LeftCmd, Key.V],
  "cut": [Key.LeftCmd, Key.X],
  "undo": [Key.LeftCmd, Key.Z],
  "redo": [Key.LeftCmd, Key.LeftShift, Key.Z],
  "select all": [Key.LeftCmd, Key.A],
  "save": [Key.LeftCmd, Key.S],
  "find": [Key.LeftCmd, Key.F],
  "refresh": [Key.LeftCmd, Key.R],
  "switch app": [Key.LeftCmd, Key.Tab],
  "minimize": [Key.LeftCmd, Key.M],
  "hide": [Key.LeftCmd, Key.H],
  "screenshot": [Key.LeftCmd, Key.LeftShift, Key.Num3],
  "screenshot selection": [Key.LeftCmd, Key.LeftShift, Key.Num4],
  "force quit": [Key.LeftCmd, Key.LeftAlt, Key.Escape],
  "show desktop": [Key.F11],
  "mission control": [Key.LeftControl, Key.Up],
  "app exposé": [Key.LeftControl, Key.Down],
  "focus url bar": [Key.LeftCmd, Key.L],
};

/**
 * Platform-specific shortcut mappings
 * @type {Object<string, Object<string, Key[]>>}
 */
const PLATFORM_SHORTCUTS = {
  darwin: MACOS_SHORTCUTS,
};

/**
 * Service for executing semantic keyboard shortcuts based on platform
 */
export class KeyboardShortcutService {
  /**
   * Initialize the keyboard shortcut service for the current platform
   */
  constructor() {
    this.platform = process.platform;
    this.shortcuts = PLATFORM_SHORTCUTS[this.platform] || {};
  }

  /**
   * Execute a semantic keyboard shortcut
   * @param {string} semanticShortcut - The semantic name of the shortcut to execute
   * @returns {Promise<Key[]>} The key combination that was pressed
   * @throws {Error} If the semantic shortcut is not recognized
   */
  async executeShortcut(semanticShortcut) {
    const shortcut = this.shortcuts[semanticShortcut.toLowerCase()];

    if (!shortcut) {
      throw new Error(`Unknown semantic shortcut: ${semanticShortcut}`);
    }

    await keyboard.pressKey(...shortcut);
    return shortcut;
  }

  /**
   * Get all available semantic shortcuts for the current platform
   * @returns {string[]} Array of available semantic shortcut names
   */
  getAvailableActions() {
    return Object.keys(this.shortcuts);
  }

  /**
   * Check if a semantic shortcut exists for the current platform
   * @param {string} semanticShortcut - The semantic name to check
   * @returns {boolean} True if the shortcut exists, false otherwise
   */
  hasShortcut(semanticShortcut) {
    return this.shortcuts.hasOwnProperty(semanticShortcut.toLowerCase());
  }
}
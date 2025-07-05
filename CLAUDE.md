# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a voice-controlled computer automation system that uses the Model Context Protocol (MCP) to expose nut.js automation capabilities to Large Language Models. The system allows LLMs to control the computer through semantic actions, raw keyboard/mouse input, window management, and application launching.

## Development Commands

```bash
# Install dependencies
npm install

# Test MCP server manually (see planning-docs/MCP-TESTING.md for methods)
node src/mcp-server.js

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node src/mcp-server.js
```

Note: This project performs actual computer control, so automated testing is avoided to prevent disruption during development. Use manual testing procedures documented in `planning-docs/MCP-TESTING.md`.

## Core Architecture

### MCP Server Structure
- **Entry Point**: `src/mcp-server.js` - Minimal server that registers all tools via the tool registry
- **Tool Registry**: `src/tools/index.js` - Central registry mapping tool names to both MCP tool definitions and tool logic functions
- **Tool Pattern**: Each tool in `src/tools/` exports both a tool logic function and an MCP tool definition

### Tool Categories

**Keyboard Control:**
- `typeText` - Direct text input
- `pressKey` - Raw key presses (enter, tab, escape, etc.)
- `executeShortcut` - Semantic shortcuts (copy, paste, new tab, etc.) mapped per platform

**System Control:**
- `openApplication` - Launch apps by name (macOS via `open -a`)
- `focusWindow` - Focus windows by title matching
- `getWindowList` - List all open windows with details

**Composition:**
- `executeToolSequence` - Execute multiple tools with guaranteed ordering and proper awaiting
- `getAvailableShortcuts` - List platform-specific semantic shortcuts

### Platform Abstraction

**Keyboard Shortcuts**: `src/services/keyboard-shortcuts.js`
- Maps semantic actions ("copy", "new tab") to platform-specific key combinations
- Currently supports macOS, extensible for other platforms
- Separates intent from implementation

### Key Design Patterns

**Tool Registry Pattern**: Adding a new tool requires only updating `TOOL_REGISTRY` in `src/tools/index.js`. This automatically:
- Registers the tool with the MCP server
- Makes it available for sequence execution
- Includes it in tool discovery

**Tool Logic Separation**: Each tool exports:
- A pure tool function (e.g., `typeText(text)`)
- An MCP tool definition with schema validation and error handling
- This enables composition and reuse between tools

**Semantic vs Raw Control**: Tools are organized by abstraction level:
- Raw: `pressKey("enter")` - Direct key presses
- Semantic: `executeShortcut("copy")` - Platform-abstracted actions
- Composition: `executeToolSequence([...])` - Multi-step workflows

### Sequence Execution

The `executeToolSequence` tool solves timing issues inherent in separate MCP tool calls by executing multiple tools within a single JavaScript execution context with proper `await` chaining. This ensures nut.js operations complete in the correct order.

## Dependencies

- **@nut-tree-fork/nut-js**: System automation (keyboard, mouse, window control)
- **@modelcontextprotocol/sdk**: MCP server/client implementation  
- **zod**: Schema validation for tool parameters

## macOS Permissions

Requires macOS accessibility permissions for keyboard and application control. The system will prompt for these on first use.

## Planning Documentation

The `planning-docs/` folder contains architectural decisions and API references created during development. Each document includes session context explaining why it was created.
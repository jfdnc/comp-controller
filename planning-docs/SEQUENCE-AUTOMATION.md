## Session Context

This document was created when we noticed that the executeSequence tool had a manual switch statement requiring updates every time we added a new tool. We brainstormed several approaches to eliminate this maintenance burden and chose the enhanced tool registry pattern to automatically include all tools in sequence execution.

---

# Streamlining executeSequence Tool Registration

## Current Problem

The `executeSequence` tool has a manual switch statement that requires updating every time we add a new tool:

```javascript
switch (action.tool) {
  case "typeText":
    await typeText(action.args.text);
    break;
  case "pressKey":
    await pressKey(action.args.key);
    break;
  // Must manually add each new tool here...
}
```

This creates maintenance burden and potential for errors when tools are added but not included in sequences.

## Solution Options

### Option 1: Function Registry with Metadata
**Auto-register functions with their argument schemas**

```javascript
// In each tool file
export const typeTextMeta = {
  func: typeText,
  argKey: 'text'  // which property from args to pass
};

// In sequence tool
const TOOL_REGISTRY = {
  typeText: typeTextMeta,
  pressKey: pressKeyMeta,
  // Auto-populated from imports
};

export async function executeSequence(actions) {
  for (const action of actions) {
    const toolMeta = TOOL_REGISTRY[action.tool];
    if (!toolMeta) throw new Error(`Unknown tool: ${action.tool}`);
    
    const result = await toolMeta.func(action.args[toolMeta.argKey]);
  }
}
```

**Pros:** Clean, minimal metadata
**Cons:** Still requires manual registration, assumes single-argument functions

### Option 2: Standardized Function Signatures
**Make all tool logic functions accept a single args object**

```javascript
// Standardize all functions to accept args object
export async function typeText(args) {
  await keyboard.type(args.text);
}

export async function pressKey(args) {
  if (args.key === "enter") {
    await keyboard.pressKey(Key.Enter);
  }
  // etc...
}

// In sequence tool
const TOOL_FUNCTIONS = {
  typeText,
  pressKey,
  executeAction,
  openApplication,
  focusWindow
};

export async function executeSequence(actions) {
  for (const action of actions) {
    const func = TOOL_FUNCTIONS[action.tool];
    if (!func) throw new Error(`Unknown tool: ${action.tool}`);
    
    await func(action.args);
  }
}
```

**Pros:** Completely generic, no switch statement, easy to add tools
**Cons:** Changes all function signatures, may be less ergonomic for direct use

### Option 3: Dynamic Import with Convention
**Use naming conventions and dynamic imports**

```javascript
export async function executeSequence(actions) {
  for (const action of actions) {
    try {
      // Import the function dynamically based on tool name
      const module = await import(`./${action.tool.replace(/([A-Z])/g, '-$1').toLowerCase()}.js`);
      const funcName = action.tool;
      
      if (!module[funcName]) {
        throw new Error(`Function ${funcName} not found in ${action.tool} module`);
      }
      
      await module[funcName](action.args);
    } catch (error) {
      throw new Error(`Unknown tool: ${action.tool}`);
    }
  }
}
```

**Pros:** Zero maintenance, auto-discovers tools
**Cons:** Runtime overhead, harder to debug, requires strict naming conventions

### Option 4: Enhanced Tool Registry with Auto-Discovery
**Extend existing tool registry to include tool functions**

```javascript
// In tools/index.js
import { typeTextTool, typeText } from './type-text.js';
import { pressKeyTool, pressKey } from './press-key.js';
// etc...

export const TOOL_REGISTRY = {
  typeText: { tool: typeTextTool, func: typeText },
  pressKey: { tool: pressKeyTool, func: pressKey },
  executeAction: { tool: executeActionTool, func: executeAction },
  openApplication: { tool: openApplicationTool, func: openApplication },
  focusWindow: { tool: focusWindowTool, func: focusWindow },
};

// Helper to get all tool functions
export const TOOL_FUNCTIONS = Object.fromEntries(
  Object.entries(TOOL_REGISTRY).map(([name, {func}]) => [name, func])
);

// In execute-sequence.js
import { TOOL_FUNCTIONS } from './index.js';

export async function executeSequence(actions) {
  for (const action of actions) {
    const func = TOOL_FUNCTIONS[action.tool];
    if (!func) throw new Error(`Unknown tool: ${action.tool}`);
    
    await func(action.args);
  }
}
```

**Pros:** Centralized, maintains existing patterns, easy to extend
**Cons:** Still requires manual registration in one place

### Option 5: Decorator Pattern with Auto-Registration
**Use decorators/metadata to auto-register sequenceable tools**

```javascript
// In each tool file
export const typeText = sequenceable(async (args) => {
  await keyboard.type(args.text);
});

// Helper function that auto-registers
function sequenceable(func) {
  SEQUENCE_REGISTRY.set(func.name, func);
  return func;
}

// In sequence tool
export async function executeSequence(actions) {
  for (const action of actions) {
    const func = SEQUENCE_REGISTRY.get(action.tool);
    if (!func) throw new Error(`Unknown tool: ${action.tool}`);
    
    await func(action.args);
  }
}
```

**Pros:** Auto-registration, explicit opt-in for sequencing
**Cons:** Requires changing all function definitions, more complex

## Recommendation

**Go with Option 4: Enhanced Tool Registry**

### Reasons:
1. **Minimal changes** - Builds on existing patterns
2. **Centralized** - Single place to see all tools and functions
3. **Explicit** - Clear what's available for sequencing
4. **Maintainable** - When you add a tool, you add it once to the registry
5. **Type-safe** - Can add TypeScript later for better DX

### Implementation:
1. Update `tools/index.js` with enhanced registry
2. Export `TOOL_FUNCTIONS` object
3. Update `executeSequence` to use the registry
4. Optional: Add validation that all tools in registry have corresponding functions

### Future Enhancement:
- Add tool metadata (descriptions, argument schemas) to registry
- Auto-generate documentation from registry
- Add tool categorization (keyboard, window, application, etc.)
- Runtime validation that tool functions match expected signatures

This approach balances maintainability with simplicity while keeping the door open for more advanced features later.
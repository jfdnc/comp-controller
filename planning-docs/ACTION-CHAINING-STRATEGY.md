## Session Context

This document was created when we needed to decide how to handle sequential actions from the LLM. The initial plan included an "action queue" system, but after studying nut.js philosophy (breaking tasks into human-like steps) and MCP design patterns, we realized that letting the LLM naturally chain tool calls or providing a sequence execution tool would be more aligned with both frameworks' approaches.

---

# Action Chaining Strategy for LLM-Driven Computer Control

## Current State vs. Nut.js Philosophy

### Current Approach
We have high-level semantic tools:
- `executeAction("copy")` → Cmd+C
- `openApplication("Chrome")` → launch Chrome
- `typeText("hello")` → types text

### Nut.js Philosophy
Break complex tasks into human-like steps:
1. **Identify** the target window
2. **Focus** the window  
3. **Locate** the UI element
4. **Move** mouse to element
5. **Interact** with element (click, type, etc.)

## Proposed Action Chaining Approach

### Option 1: LLM-Native Tool Chaining
**Let the LLM naturally chain our existing MCP tools without an action queue.**

**Pros:**
- Leverages LLM's natural reasoning about sequential steps
- No complex queue management code needed
- LLM can adapt based on intermediate results
- Follows MCP design patterns

**Example LLM Flow:**
```
User: "Open Chrome and navigate to google.com"

LLM reasoning:
1. First I'll open Chrome
2. Wait for it to launch 
3. Focus on Chrome window
4. Use the address bar shortcut
5. Type the URL
6. Press enter

Tool calls:
- openApplication("Chrome") 
- getWindowList() [to verify Chrome opened]
- executeAction("focus url bar")
- typeText("google.com")
- pressKey("enter")
```

### Option 2: Enhanced Granular Tools
**Add more granular tools that align with nut.js building blocks.**

**Additional Tools Needed:**
```javascript
// Window management
focusWindow(windowTitle)
getActiveWindow()
moveWindow(x, y)
resizeWindow(width, height)

// Mouse control  
moveMouseTo(x, y)
clickAt(x, y)
rightClickAt(x, y)
dragFrom(x1, y1, x2, y2)

// Screen analysis
takeScreenshot()
findTextOnScreen(text)
findImageOnScreen(imagePath)
getPixelColor(x, y)

// Coordinate helpers
getWindowBounds(windowTitle)
getCenterOfWindow(windowTitle)
```

**Example Enhanced Flow:**
```
User: "Click the Chrome bookmarks button"

LLM reasoning:
1. Take screenshot to see current state
2. Find Chrome window
3. Focus Chrome window  
4. Look for bookmarks button (star icon)
5. Click at those coordinates

Tool calls:
- takeScreenshot()
- focusWindow("Chrome")
- findImageOnScreen("bookmark_star.png") [returns coordinates]
- clickAt(x, y)
```

### Option 3: Hybrid Approach
**Combine semantic actions with granular tools based on task complexity.**

**Simple tasks:** Use semantic actions
- `executeAction("copy")` 
- `executeAction("new tab")`

**Complex tasks:** Chain granular tools
- Screenshot → analyze → focus → locate → interact

## Recommended Strategy

### Phase 1: Start with Option 1 (LLM-Native Chaining)
**Advantages:**
- Builds on our existing tools
- Minimal additional code needed
- Tests LLM's natural chaining abilities
- Aligns with MCP philosophy of letting LLM orchestrate

**Implementation:**
1. Remove the "action queue" concept entirely
2. Let LLM make sequential MCP tool calls
3. LLM can check results between calls using `getWindowList()`, etc.
4. Handle errors naturally through LLM reasoning

### Phase 2: Add Granular Tools as Needed
Based on what the LLM struggles with in Phase 1, add:
- Mouse control tools (`moveMouseTo`, `clickAt`)
- Screen analysis tools (`takeScreenshot`, `findTextOnScreen`)
- Enhanced window management

### Phase 3: Screen Understanding
Eventually add visual analysis capabilities:
- OCR integration for reading screen text
- Image recognition for finding UI elements
- Coordinate-based interaction

## Key Design Principles

### 1. Human-Like Workflow
Follow the nut.js philosophy: break complex tasks into simple, sequential steps that mirror human interaction patterns.

### 2. LLM-Driven Orchestration
Let the LLM decide the sequence and handle branching logic rather than pre-defining workflows.

### 3. Incremental Granularity
Start with high-level tools, add granular tools only when needed for tasks the LLM can't accomplish.

### 4. Error Recovery
Enable the LLM to:
- Check intermediate results
- Retry failed actions
- Adapt strategy based on current screen state

### 5. Observable State
Provide tools for the LLM to understand current state:
- Window lists
- Screenshots  
- Active window info
- Mouse position

## Next Steps

1. **Remove action queue system** - let LLM chain tools naturally
2. **Test LLM chaining** with current tools on simple multi-step tasks
3. **Identify gaps** where LLM needs more granular control
4. **Add granular tools** incrementally based on actual needs
5. **Eventually add visual analysis** for complex UI interaction

This approach aligns with both nut.js philosophy and MCP design patterns while leveraging the LLM's natural reasoning capabilities.
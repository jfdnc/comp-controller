# Nut.js API Reference

## Main Exports
```javascript
import { 
  keyboard, mouse, screen, clipboard, assert,
  Button, Key, Point, Region, Size, RGBA,
  getWindows, getActiveWindow,
  straightTo, up, down, left, right
} from "@nut-tree-fork/nut-js";
```

## Keyboard API

### Methods
- `keyboard.type(...input)` - Type text or key sequences
- `keyboard.pressKey(...keys)` - Press and hold key combination
- `keyboard.releaseKey(...keys)` - Release key combination

### Config
- `keyboard.config.autoDelayMs` - Delay between key events

### Example
```javascript
await keyboard.type("Hello World!");
await keyboard.pressKey(Key.LeftCmd, Key.C);
await keyboard.releaseKey(Key.LeftCmd, Key.C);
```

## Mouse API

### Methods
- `mouse.setPosition(point)` - Instant move to point
- `mouse.getPosition()` - Get current position
- `mouse.move(path)` - Move along path
- `mouse.leftClick()` - Left click
- `mouse.rightClick()` - Right click
- `mouse.click(button)` - Click specific button
- `mouse.doubleClick(button)` - Double click
- `mouse.pressButton(button)` - Press and hold button
- `mouse.releaseButton(button)` - Release button
- `mouse.drag(path)` - Drag along path
- `mouse.scrollUp/Down/Left/Right(amount)` - Scroll

### Config
- `mouse.config.autoDelayMs` - Delay between mouse events
- `mouse.config.mouseSpeed` - Speed in pixels/second

### Example
```javascript
await mouse.setPosition(new Point(100, 200));
await mouse.leftClick();
await mouse.drag([new Point(100, 200), new Point(200, 300)]);
```

## Screen API

### Methods
- `screen.width/height()` - Get screen dimensions
- `screen.find(searchInput)` - Find single occurrence
- `screen.findAll(searchInput)` - Find all occurrences
- `screen.waitFor(searchInput, timeout)` - Wait for appearance
- `screen.capture(filename)` - Take screenshot
- `screen.grab()` - Get screen image
- `screen.captureRegion(filename, region)` - Screenshot region
- `screen.grabRegion(region)` - Get region image
- `screen.colorAt(point)` - Get pixel color
- `screen.highlight(region)` - Highlight region

### Config
- `screen.config.confidence` - Match confidence (0-1)
- `screen.config.autoHighlight` - Auto highlight results
- `screen.config.highlightDurationMs` - Highlight duration
- `screen.config.resourceDirectory` - Template image path

### Example
```javascript
const region = await screen.find(imageResource("button.png"));
await screen.highlight(region);
```

## Clipboard API

### Methods
- `clipboard.setContent(text)` - Copy text to clipboard
- `clipboard.getContent()` - Get clipboard text

### Example
```javascript
await clipboard.setContent("Hello World!");
const content = await clipboard.getContent();
```

## Window Management

### Functions
- `getWindows()` - Get all windows
- `getActiveWindow()` - Get active window

### Window Methods
- `window.getTitle()` - Get window title
- `window.getRegion()` - Get window region
- `window.move(point)` - Move window
- `window.resize(size)` - Resize window
- `window.focus()` - Focus window
- `window.minimize()` - Minimize window
- `window.restore()` - Restore window

### Example
```javascript
const windows = await getWindows();
const activeWindow = await getActiveWindow();
await activeWindow.focus();
```

## Assert API

### Methods
- `assert.isVisible(searchInput)` - Assert element is visible
- `assert.notVisible(searchInput)` - Assert element is not visible

## Key Enum (Selected)
```javascript
Key.Escape, Key.Tab, Key.Enter, Key.Space, Key.Backspace
Key.LeftShift, Key.RightShift, Key.LeftControl, Key.RightControl
Key.LeftCmd, Key.RightCmd, Key.LeftAlt, Key.RightAlt
Key.Up, Key.Down, Key.Left, Key.Right
Key.F1-F24, Key.A-Z, Key.Num0-Num9
Key.AudioMute, Key.AudioVolUp, Key.AudioVolDown
Key.AudioPlay, Key.AudioStop, Key.AudioPause
```

## Button Enum
```javascript
Button.LEFT, Button.MIDDLE, Button.RIGHT
```

## Utility Classes

### Point
```javascript
const point = new Point(x, y);
```

### Region
```javascript
const region = new Region(left, top, width, height);
```

### Size
```javascript
const size = new Size(width, height);
```

### RGBA
```javascript
const color = new RGBA(r, g, b, a);
```

## Movement Functions
```javascript
straightTo(target) // Direct path to target
up(pixels)         // Move up by pixels
down(pixels)       // Move down by pixels
left(pixels)       // Move left by pixels
right(pixels)      // Move right by pixels
```

## Query Functions
```javascript
singleWord(word)           // Find single word
textLine(line)             // Find text line
windowWithTitle(title)     // Find window by title
pixelWithColor(color)      // Find pixel by color
```

## Image Functions
```javascript
loadImage(path)           // Load image from path
saveImage(params)         // Save image to disk
imageResource(filename)   // Load from resource directory
```

## Notes
- All methods return Promises
- Requires accessibility permissions on macOS
- Screen coordinates start at (0,0) in top-left
- Key combinations: first modifiers, then target key
- Template matching uses confidence threshold (0-1)
- Movement functions return Point arrays for smooth paths
# @nut-tree-fork/nut-js Comprehensive Capabilities Analysis

## Overview
The @nut-tree-fork/nut-js library is a comprehensive computer automation framework that provides native system control capabilities for cross-platform automation. It supports Windows, macOS, and Linux environments with extensive APIs for mouse, keyboard, screen, window management, and more.

## Core Capabilities

### 1. Mouse Operations (`MouseClass`)

#### Basic Mouse Control
- **`getPosition()`** - Returns current mouse cursor position as Point(x, y)
- **`setPosition(target: Point)`** - Instantly teleports mouse to specified coordinates
- **`move(path: Point[], movementType?: EasingFunction)`** - Moves mouse along a path with configurable easing/acceleration

#### Mouse Clicks
- **`leftClick()`** - Performs left mouse button click
- **`rightClick()`** - Performs right mouse button click
- **`click(btn: Button)`** - Clicks specified button (LEFT, MIDDLE, RIGHT)
- **`doubleClick(btn: Button)`** - Performs double-click with specified button

#### Mouse Button Control
- **`pressButton(btn: Button)`** - Presses and holds a mouse button
- **`releaseButton(btn: Button)`** - Releases a previously pressed button
- **`drag(path: Point[])`** - Drags mouse along path (press, move, release)

#### Mouse Scrolling
- **`scrollUp(amount: number)`** - Scrolls up by specified steps
- **`scrollDown(amount: number)`** - Scrolls down by specified steps
- **`scrollLeft(amount: number)`** - Scrolls left by specified steps
- **`scrollRight(amount: number)`** - Scrolls right by specified steps

#### Configuration
- **`config.autoDelayMs`** - Delay between mouse events
- **`config.mouseSpeed`** - Speed in pixels/second for movement

#### Movement Types
- **`linear`** - Linear movement (default)
- **Custom EasingFunction** - Allows custom acceleration curves

### 2. Keyboard Operations (`KeyboardClass`)

#### Text Input
- **`type(...input: StringOrKey)`** - Types text strings or key sequences
  - Supports both strings: `keyboard.type("Hello World")`
  - Supports key sequences: `keyboard.type(Key.A, Key.S, Key.D)`
  - Mixed input: `keyboard.type("Hello", Key.Tab, "World")`

#### Key Combinations
- **`pressKey(...keys: Key[])`** - Presses and holds key combinations
  - Example: `keyboard.pressKey(Key.LeftControl, Key.C)` for Ctrl+C
- **`releaseKey(...keys: Key[])`** - Releases key combinations

#### Available Keys (Complete US 105-key layout)
- **Function Keys**: F1-F24, Escape, Print, ScrollLock, Pause
- **Numbers**: Num0-Num9, NumPad0-NumPad9
- **Letters**: A-Z (uppercase constants)
- **Special Characters**: Minus, Equal, LeftBracket, RightBracket, Backslash, Semicolon, Quote, Comma, Period, Slash, Grave
- **Navigation**: Arrow keys (Up, Down, Left, Right), Home, End, PageUp, PageDown, Insert, Delete
- **Modifiers**: LeftShift, RightShift, LeftControl, RightControl, LeftAlt, RightAlt, LeftSuper, RightSuper, LeftWin, RightWin, LeftCmd, RightCmd, LeftMeta, RightMeta
- **Special**: Space, Tab, Return, Enter, Backspace, CapsLock, NumLock
- **Media Keys**: AudioMute, AudioVolUp, AudioVolDown, AudioPlay, AudioStop, AudioPause, AudioPrev, AudioNext, AudioRewind, AudioForward, AudioRepeat, AudioRandom

#### Configuration
- **`config.autoDelayMs`** - Delay between key events

### 3. Screen Operations (`ScreenClass`)

#### Screen Capture
- **`capture(fileName, fileFormat?, filePath?, prefix?, postfix?)`** - Captures full screen screenshot
  - Supports PNG and JPG formats
  - Configurable file naming and location
- **`captureRegion(fileName, region, fileFormat?, filePath?, prefix?, postfix?)`** - Captures specific screen region
- **`grab()`** - Returns screen content as Image object
- **`grabRegion(region)`** - Returns region content as Image object

#### Screen Information
- **`width()`** - Returns screen width in pixels
- **`height()`** - Returns screen height in pixels

#### Visual Search & Recognition
- **`find(searchInput, params?)`** - Finds single occurrence of image/text/color/window
  - Returns Region, Point, or Window depending on input type
  - Supports confidence thresholds
  - Supports search region limitations
- **`findAll(searchInput, params?)`** - Finds all occurrences of search target
- **`waitFor(searchInput, timeout?, updateInterval?, params?)`** - Waits for element to appear
  - Configurable timeout and retry intervals
  - Useful for waiting for UI changes

#### Search Types
- **Image Search**: Find template images on screen
- **Text Search**: Find text words or lines using OCR
- **Color Search**: Find specific RGBA colors
- **Window Search**: Find windows by title

#### Screen Interaction
- **`colorAt(point)`** - Returns RGBA color at specific coordinates
- **`highlight(region)`** - Highlights screen region with overlay
- **`on(searchInput, callback)`** - Registers callback for when element appears

#### Configuration
- **`config.confidence`** - Matching confidence threshold (0-1)
- **`config.autoHighlight`** - Auto-highlight search results
- **`config.highlightDurationMs`** - Duration for highlights
- **`config.highlightOpacity`** - Opacity of highlight overlay
- **`config.resourceDirectory`** - Path for template images

### 4. Window Management (`Window` class and helpers)

#### Window Discovery
- **`getWindows()`** - Returns array of all open windows
- **`getActiveWindow()`** - Returns currently active window
- **`windowWithTitle(title)`** - Creates window query for finding by title

#### Window Properties
- **`getTitle()`** - Returns window title
- **`getRegion()`** - Returns window position and size as Region

#### Window Control
- **`move(newOrigin: Point)`** - Moves window to new position
- **`resize(newSize: Size)`** - Resizes window
- **`focus()`** - Brings window to front and focuses it
- **`minimize()`** - Minimizes window
- **`restore()`** - Restores minimized window

#### Window Element Interaction
- **`getElements(maxElements?)`** - Returns window's UI elements tree
- **`find(searchInput)`** - Finds UI element within window
- **`findAll(searchInput)`** - Finds all matching UI elements
- **`waitFor(searchInput, timeout?, updateInterval?)`** - Waits for UI element to appear
- **`on(searchInput, callback)`** - Registers callback for UI element events

#### UI Element Properties
- **`type`** - Element type (button, text field, etc.)
- **`region`** - Element position and size
- **`title`** - Element title/label
- **`value`** - Element value/content
- **`isFocused`** - Whether element has focus
- **`selectedText`** - Selected text content
- **`isEnabled`** - Whether element is interactive
- **`role`** - Accessibility role
- **`subRole`** - Accessibility sub-role
- **`children`** - Child elements array

### 5. Clipboard Operations (`ClipboardClass`)

#### Clipboard Access
- **`setContent(text: string)`** - Copies text to system clipboard
- **`getContent()`** - Returns current clipboard text content

### 6. Image Processing and I/O

#### Image Loading and Saving
- **`loadImage(path)`** - Loads image from file path
- **`saveImage(parameters)`** - Saves image to file
- **`imageResource(fileName)`** - Loads image from resource directory
- **`fetchFromUrl(url)`** - Downloads image from URL

#### Image Class Properties
- **`width`** - Image width in pixels
- **`height`** - Image height in pixels
- **`data`** - Raw image data buffer
- **`channels`** - Number of color channels
- **`bitsPerPixel`** - Bits per pixel
- **`colorMode`** - Color mode (RGB/BGR)
- **`pixelDensity`** - Scale factors for high-DPI displays
- **`hasAlphaChannel`** - Whether image has transparency
- **`toRGB()`** - Converts to RGB color mode
- **`toBGR()`** - Converts to BGR color mode

### 7. Utility Functions and Helpers

#### Geometric Helpers
- **`centerOf(region)`** - Returns center point of region
- **`randomPointIn(region)`** - Returns random point within region

#### Movement Helpers
- **`straightTo(target)`** - Creates straight line movement path
- **`up(pixels)`** - Creates upward movement path
- **`down(pixels)`** - Creates downward movement path
- **`left(pixels)`** - Creates leftward movement path
- **`right(pixels)`** - Creates rightward movement path

#### Timing Utilities
- **`sleep(ms)`** - Async sleep/delay function
- **`busyWaitForNanoSeconds(duration)`** - High-precision busy wait

#### Query Builders
- **`singleWord(word)`** - Creates word search query
- **`textLine(line)`** - Creates line search query
- **`pixelWithColor(color)`** - Creates color search query

### 8. Testing and Assertion (`AssertClass`)

#### Visual Assertions
- **`isVisible(searchInput, searchRegion?, confidence?)`** - Asserts element is visible
- **`notVisible(searchInput, searchRegion?, confidence?)`** - Asserts element is not visible

#### Jest Integration
- **`jestMatchers`** - Custom Jest matchers for UI testing
  - `toBeAt(point)` - Assert element is at specific position
  - `toBeIn(region)` - Assert element is within region
  - `toHaveColor(color)` - Assert pixel has specific color
  - `toShow(searchInput)` - Assert element is visible on screen

### 9. Advanced Features

#### Event Hooks
- **Screen hooks**: `screen.on(searchInput, callback)` - Triggered when element appears
- **Window hooks**: `window.on(searchInput, callback)` - Triggered for window element events

#### Search Parameters
- **`confidence`** - Matching confidence threshold
- **`searchRegion`** - Limit search to specific area
- **`maxResults`** - Maximum number of results to return

#### Configuration Management
- **`providerRegistry`** - Plugin system for custom providers
- **`useLogger()`** - Custom logging configuration
- **`useConsoleLogger()`** - Enable console logging

## Data Types and Structures

### Core Types
- **`Point`** - {x: number, y: number} coordinate pair
- **`Region`** - {left, top, width, height} rectangular area
- **`Size`** - {width, height} dimensions
- **`RGBA`** - {R, G, B, A} color values (0-255)
- **`Button`** - Mouse button enum (LEFT, MIDDLE, RIGHT)
- **`Key`** - Keyboard key enum (complete US layout)
- **`FileType`** - Image file format enum (PNG, JPG)

### Query Types
- **`WordQuery`** - Search for text word
- **`LineQuery`** - Search for text line
- **`WindowQuery`** - Search for window by title
- **`ColorQuery`** - Search for specific color
- **`WindowElementQuery`** - Search for UI element

## MCP Tool Implementation Recommendations

Based on this analysis, here are the key capabilities that should be exposed as MCP tools:

### High Priority Tools
1. **Mouse Control**: click, double-click, drag, scroll, move
2. **Keyboard Input**: type text, key combinations, special keys
3. **Screen Capture**: full screen and region screenshots
4. **Visual Search**: find images, text, colors on screen
5. **Window Management**: focus, move, resize, minimize windows
6. **Clipboard Operations**: get/set clipboard content

### Medium Priority Tools
1. **Advanced Mouse**: custom movement paths, button press/release
2. **Screen Information**: get screen dimensions, color at point
3. **Window Discovery**: list windows, find by title
4. **Image Processing**: load/save images, format conversion
5. **Assertions**: verify UI state for testing

### Advanced Tools
1. **UI Element Interaction**: find and interact with window elements
2. **Event Hooks**: register callbacks for UI events
3. **OCR Text Recognition**: extract text from screen regions
4. **Multi-monitor Support**: work with multiple displays
5. **Custom Movement**: easing functions for natural mouse movement

## Platform-Specific Considerations

### macOS
- Requires accessibility permissions
- Uses `@nut-tree-fork/libnut-darwin` with native bindings
- Full window management and UI element access

### Windows
- Uses `@nut-tree-fork/libnut-win32` with native bindings
- Complete Win32 API integration
- Full automation capabilities

### Linux
- Uses `@nut-tree-fork/libnut-linux` with X11/Wayland support
- May require additional system permissions
- Full desktop automation support

## Security and Permissions

The library requires system-level permissions for:
- Screen capture and reading
- Input simulation (mouse/keyboard)
- Window management
- Accessibility features
- File system access for image operations

Proper permission handling should be implemented in MCP tools to ensure secure operation.
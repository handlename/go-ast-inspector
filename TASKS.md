# Go AST Inspector - Task Definition Document

## Document Information

**Version**: 1.0  
**Created**: 2025-11-23  
**Related Documents**: [REQUIREMENTS.md](./REQUIREMENTS.md), [DESIGN.md](./DESIGN.md)

---

## Task Overview

This document defines the tasks required for implementing Go AST Inspector in a phased manner. Each phase is organized based on logical dependencies, aiming for MVP (Minimum Viable Product) completion.

### MVP Scope
- FR-001 to FR-006 are all mandatory
- Tree display and hover display implementation are top priorities

---

## Phase 1: Project Setup

### 1-1. Project Initialization

- [x] Project Initialization
  - Purpose: Build the foundation for the development environment and build system
  - Details:
    - Create package.json with `npm init`
    - Install required dependencies (Svelte, Vite, TypeScript, Biome)
    - Configure gitignore
  - Completion Criteria:
    - [x] package.json is created
    - [x] node_modules are installed
    - [x] .gitignore is properly configured

- [x] TypeScript Configuration
  - Purpose: Configure the TypeScript compiler
  - Details:
    - Create tsconfig.json
    - Add type definitions for Svelte
    - Enable strict mode
  - Completion Criteria:
    - [x] tsconfig.json exists and follows DESIGN.md specifications
    - [x] `tsc --noEmit` runs without errors

- [x] Vite Configuration
  - Purpose: Configure build tool and Svelte plugin
  - Details:
    - Create vite.config.ts
    - Configure @sveltejs/vite-plugin-svelte
    - Configure vite-plugin-singlefile
    - Set up path alias ($lib)
  - Completion Criteria:
    - [x] vite.config.ts exists and follows DESIGN.md specifications
    - [x] Dev server starts with `npm run dev`

- [x] Svelte Configuration
  - Purpose: Configure the Svelte compiler
  - Details:
    - Create svelte.config.js
    - Configure vitePreprocess
    - Enable runes mode (runes: true)
  - Completion Criteria:
    - [x] svelte.config.js exists and follows DESIGN.md specifications
    - [x] Svelte files compile correctly

- [x] Biome Configuration
  - Purpose: Configure Linter and Formatter
  - Details:
    - Create biome.json
    - Apply recommended rules
    - Configure TypeScript/Svelte support
  - Completion Criteria:
    - [x] biome.json exists and follows DESIGN.md specifications
    - [x] `npm run lint` runs without errors

---

## Phase 2: Go WebAssembly Parser Implementation

### 2-1. Go WASM Development Environment Setup

- [x] WASM Development Environment Setup
  - Purpose: Set up Go WebAssembly build environment
  - Details:
    - Create src/wasm directory
    - Initialize go.mod
    - Create build.sh script
    - Add wasm_exec.js copy script
  - Completion Criteria:
    - [x] src/wasm/build.sh is executable
    - [x] `npm run build:wasm` succeeds
    - [x] public/parser.wasm and public/wasm_exec.js are generated

### 2-2. Go Parser Implementation

- [x] Basic AST Parser Implementation
  - Purpose: Implement functionality to convert Go source code to AST
  - Details:
    - Create src/wasm/parser.go
    - Implement parsing logic using go/parser and go/ast
    - Implement error handling
    - Export JavaScript-callable functions
  - Completion Criteria:
    - [x] Can convert valid Go code to AST
    - [x] Returns error information including line and column numbers on syntax errors
    - [x] Callable from JavaScript

- [x] AST JSON Conversion Implementation
  - Purpose: Convert Go AST structure to JSON format usable in JavaScript
  - Details:
    - Implement function to serialize AST structure to JSON
    - Include node type, position information, and metadata
    - Preserve hierarchical structure of child nodes
  - Completion Criteria:
    - [x] AST is output in appropriate JSON format
    - [x] All major node types are converted
    - [x] Position information (pos, end) is correctly included

### 2-3. WASM Integration

- [x] WASM Initialization Process Implementation
  - Purpose: Load and initialize WASM in the browser
  - Details:
    - Create src/lib/core/parser-bridge.ts
    - Load WASM using WebAssembly.instantiate
    - Integrate wasm_exec.js
    - Manage initialization completion flag
  - Completion Criteria:
    - [x] WASM loads successfully
    - [x] Can detect initialization completion
    - [x] Error handling is appropriate

- [x] Parser Bridge Implementation
  - Purpose: Implement interface to call WASM parser from TypeScript
  - Details:
    - Implement ParserBridge class
    - Implement parse(sourceCode: string) method
    - Define error and success response types
    - Design Promise-based API
  - Completion Criteria:
    - [x] Can call parser from TypeScript
    - [x] AST nodes are returned on success
    - [x] Error information is returned on error

---

## Phase 3: State Management and Core Logic Implementation

### 3-1. Svelte Store Implementation

- [x] AST State Management Store Implementation
  - Purpose: Implement Svelte Store to manage AST-related state
  - Details:
    - Create src/lib/stores/ast-store.ts
    - Implement astStore (current AST)
    - Implement parseErrorStore (parse errors)
    - Implement selectedNodeStore (selected node)
    - Implement expandedNodesStore (expanded node IDs)
  - Completion Criteria:
    - [x] All Stores are type-defined
    - [x] Store subscription and updates function
    - [x] Type safety is guaranteed

- [x] Editor State Management Store Implementation
  - Purpose: Implement Svelte Store to manage code editor state
  - Details:
    - Create src/lib/stores/editor-store.ts
    - Manage source code state
    - Manage highlight range
    - Manage cursor position
  - Completion Criteria:
    - [x] Editor state is managed by Store
    - [x] State updates reactively

### 3-2. Position Mapping Implementation

- [x] PositionMapper Implementation
  - Purpose: Manage correspondence between source code positions and AST nodes
  - Details:
    - Create src/lib/core/position-mapper.ts
    - Byte offset → line/column conversion
    - Line/column → byte offset conversion
    - AST node search from position
  - Completion Criteria:
    - [x] Position conversion functions accurately
    - [x] Can retrieve AST node at specified position
    - [x] Works correctly with code containing Japanese comments

### 3-3. Type Definitions and Utilities

- [x] Common Type Definitions
  - Purpose: Define types used throughout the project
  - Details:
    - Create src/lib/core/types.ts
    - Define ASTNode type
    - Define ParseResult type
    - Other common types
  - Completion Criteria:
    - [x] All types are exported
    - [x] Type consistency is maintained

- [x] Constant Definitions
  - Purpose: Define constants used throughout the project
  - Details:
    - Create src/lib/utils/constants.ts
    - Default expansion level
    - Debounce time
    - Other constants
  - Completion Criteria:
    - [x] Constants are properly defined
    - [x] Magic numbers are eliminated

---

## Phase 4: Svelte Component Implementation

### 4-1. Basic Component Implementation

- [x] App.svelte Root Component Implementation
  - Purpose: Implement overall application layout
  - Details:
    - Create src/App.svelte
    - Layout for header, main content, status bar
    - Apply global styles
    - Call WASM initialization process
  - Completion Criteria:
    - [x] Layout displays properly
    - [x] WASM initialization completes
    - [x] English UI is applied

- [x] HeaderBar.svelte Implementation
  - Purpose: Implement header bar and control buttons
  - Details:
    - Create src/components/HeaderBar.svelte
    - Parse Button (manual parse)
    - Expand All Button
    - Collapse All Button
  - Completion Criteria:
    - [x] All buttons are displayed
    - [x] Button clicks trigger appropriate processing

- [x] ErrorDisplay.svelte Implementation
  - Purpose: Implement component to display parse errors
  - Details:
    - Create src/components/ErrorDisplay.svelte
    - Subscribe to parseErrorStore
    - Display error message, line and column numbers
    - Implement clear button
  - Completion Criteria:
    - [x] Error information is displayed appropriately
    - [x] Hidden when error is resolved

### 4-2. CodeEditor Component Implementation

- [x] CodeEditor Basic Implementation
  - Purpose: Implement editor to input Go source code
  - Details:
    - Create src/components/CodeEditor.svelte
    - Implement textarea
    - Set default code (Hello World)
    - Handle input events
  - Completion Criteria:
    - [x] Can input code
    - [x] Default code is displayed
    - [x] Supports multi-line input

- [x] CodeEditor Parse Integration
  - Purpose: Automatically execute parse on code changes
  - Details:
    - Integrate with ParserBridge
    - Implement debounce processing (300ms)
    - Update astStore and parseErrorStore
  - Completion Criteria:
    - [x] Parse executes on code changes
    - [x] Debounce is functioning
    - [x] Parse results are reflected in Store

- [x] CodeEditor Syntax Highlighting Implementation (Recommended)
  - Purpose: Implement syntax highlighting for Go language
  - Details:
    - Add highlight display layer
    - Simple regex-based highlighting
    - Color coding for keywords, strings, comments
  - Completion Criteria:
    - [x] Basic syntax highlighting functions
    - [x] No performance issues

- [x] CodeEditor Click Interaction Feature Implementation
  - Purpose: Identify corresponding AST node on click/cursor movement
  - Details:
    - Handle click and keyup events
    - Get cursor position (selectionStart)
    - Identify node using PositionMapper
    - Update selectedNodeStore
  - Completion Criteria:
    - [x] Corresponding AST node is identified on click/cursor movement
    - [x] selectedNodeStore is updated

### 4-3. ASTTreeView Component Implementation

- [x] ASTTreeView Basic Implementation
  - Purpose: Implement container component to display AST tree structure
  - Details:
    - Create src/components/ASTTreeView.svelte
    - Subscribe to astStore
    - Expand All / Collapse All functionality
    - Display empty state
  - Completion Criteria:
    - [x] Tree displays when AST exists
    - [x] Empty state displays appropriately
    - [x] Expand/Collapse All buttons function

- [x] TreeNode Recursive Component Implementation
  - Purpose: Implement component to recursively display tree nodes
  - Details:
    - Create src/components/TreeNode.svelte
    - Recursive component structure
    - Manage expand/collapse state
    - Display node type
    - Handle click events
  - Completion Criteria:
    - [x] Tree displays hierarchically
    - [x] Can expand/collapse on click
    - [x] Node type is displayed
    - [x] Expansion state syncs with expandedNodesStore

- [x] TreeNode Visual Decoration Implementation
  - Purpose: Decorate tree nodes for better visibility
  - Details:
    - Implement indentation display
    - Expand/collapse icons
    - Color coding by node type
    - Highlight selected node
  - Completion Criteria:
    - [x] Hierarchy is visually understandable
    - [x] Icons display appropriately
    - [x] Color coding functions

### 4-4. Bidirectional Highlight Implementation

- [x] Tree Node Auto-expand Feature Implementation
  - Purpose: Automatically expand branches up to selected node
  - Details:
    - Monitor changes to selectedNodeStore
    - Get path to parent nodes from node ID
    - Add all parent nodes to expandedNodesStore
  - Completion Criteria:
    - [x] Auto-expands if selected node is collapsed
    - [x] Expansion animation is smooth
    - [x] No performance issues

- [x] Tree Node Highlight Display Implementation
  - Purpose: Visually emphasize selected node
  - Details:
    - Apply dedicated CSS class to selected node
    - Adjust scroll position to show selected node
    - Configure highlight color
  - Completion Criteria:
    - [x] Selected node is clearly identifiable
    - [x] Scroll position is appropriately adjusted
    - [x] Highlight disappears when deselected

- [x] Source Code Highlight Feature Implementation
  - Purpose: Highlight source code range corresponding to node selected in AST tree
  - Details:
    - Add highlightedRangeStore
    - Monitor selectedNodeStore in CodeEditor
    - Highlight corresponding range with background color
    - Implement highlight layer overlaying textarea
  - Completion Criteria:
    - [x] Source code section is highlighted when node is selected in AST tree
    - [x] Highlight range is accurate
    - [x] Highlight display is visually clear
    - [x] Highlight updates appropriately during text editing
    - [x] No performance issues

---

## Phase 5: Styling and UI/UX Improvement

### 5-1. Global Style Implementation

- [x] Global Stylesheet Creation
  - Purpose: Define styles for the entire application
  - Details:
    - Create src/styles/global.css
    - Reset CSS
    - Color scheme definition
    - Font settings
    - Responsive support (desktop-first)
  - Completion Criteria:
    - [x] Unified design is applied
    - [x] Easy to read on desktop browsers

- [x] Component-specific Style Implementation
  - Purpose: Implement styles for each Svelte component
  - Details:
    - Implement `<style>` section for each .svelte file
    - Apply BEM naming convention
    - Clean and readable layout
  - Completion Criteria:
    - [x] All components are properly styled
    - [x] No layout breaks

### 5-2. UI/UX Improvement

- [x] Responsive Layout Adjustment
  - Purpose: Achieve appropriate display according to window size
  - Details:
    - Adjust 2-column layout
    - Implement splitter (optional)
    - Set minimum width
  - Completion Criteria:
    - [x] Responds to window resize
    - [x] Doesn't break below minimum width

- [x] Accessibility Improvement
  - Purpose: Improve keyboard operation and screen reader support
  - Details:
    - Add ARIA attributes
    - Keyboard navigation
    - Focus management
  - Completion Criteria:
    - [x] Basic operations possible with keyboard
    - [x] ARIA attributes are properly set

---

## Phase 6: Build and Deployment

### 6-1. Single HTML File Generation

- [x] Vite Build Configuration Optimization
  - Purpose: Enable output as a single HTML file
  - Details:
    - Adjust vite-plugin-singlefile configuration
    - Confirm asset inlining
    - Base64 encode WASM binary
  - Completion Criteria:
    - [x] `npm run build` generates single HTML file
    - [x] File size is 5.1MB (1.4MB when gzip compressed)
    - [x] All resources are inlined

- [x] Build Verification
  - Purpose: Confirm generated HTML file works properly
  - Details:
    - Open HTML file locally and verify operation
    - Check network traffic (should be zero)
    - Verify all features work
  - Completion Criteria:
    - [x] All features work locally
    - [x] No network requests occur
    - [x] No errors occur

### 6-2. GitHub Actions Configuration

- [x] GitHub Actions Workflow Creation
  - Purpose: Configure automatic deployment to GitHub Pages
  - Details:
    - Create .github/workflows/deploy.yml
    - Configure Node.js 20 and Go 1.21 environment
    - Pipeline: WASM build → Vite build → Deploy
    - Trigger on push to main branch
  - Completion Criteria:
    - [x] Workflow file exists
    - [x] Follows DESIGN.md specifications
    - [x] Build succeeds locally

- [x] GitHub Pages Configuration
  - Purpose: Enable publication on GitHub Pages
  - Details:
    - Enable GitHub Pages in repository settings
    - Configure deploy permissions from GitHub Actions
    - Custom domain configuration (optional)
  - Completion Criteria:
    - [x] GitHub Pages is enabled
    - [x] Deploy permissions are configured
    - [x] Public URL works

---

## Phase 7: Testing and Quality Assurance

### 7-1. Unit Test Implementation (Recommended)

- [x] Vitest Setup
  - Purpose: Configure test framework
  - Details:
    - Install Vitest and @testing-library/svelte
    - Create vitest.config.ts
    - Add test commands
  - Completion Criteria:
    - [x] Vitest can run
    - [x] Test commands function

- [x] Store Test Implementation
  - Purpose: Implement unit tests for Svelte Store
  - Details:
    - Test ast-store
    - Test editor-store
    - Test Store subscription and updates
  - Completion Criteria:
    - [x] Store tests are implemented
    - [x] Tests pass

- [x] Core Logic Test Implementation
  - Purpose: Implement tests for ParserBridge and PositionMapper
  - Details:
    - Test parse functionality
    - Test position mapping
    - Test error handling
  - Completion Criteria:
    - [x] Core logic tests are implemented
    - [x] All 32 tests pass

### 7-2. Integration Test Implementation (Recommended)

- [ ] Component Integration Test Implementation
  - Purpose: Test collaboration between components
  - Details:
    - Test CodeEditor + ASTTreeView
    - Test CodeEditor + HoverTooltip
    - Test TreeNode expand/collapse
  - Completion Criteria:
    - [ ] Integration tests are implemented
    - [ ] Tests pass

### 7-3. E2E Test Implementation (Recommended)

- [x] Playwright Setup
  - Purpose: Configure E2E test framework
  - Details:
    - Install Playwright
    - Create playwright.config.ts
    - Configure test browsers
  - Completion Criteria:
    - [x] Playwright can run
    - [x] Can test on multiple browsers (Chromium, Firefox, WebKit)

- [x] E2E Test Scenario Implementation
  - Purpose: Test end-to-end scenarios
  - Details:
    - Page load → Display default code → Parse success
    - Code input → AST update
    - Error code input → Error display
    - Node expand/collapse → Highlight display
  - Completion Criteria:
    - [x] E2E tests are implemented (9 scenarios)
    - [x] Can run on Chromium, Firefox, WebKit

---

## Phase 8: Documentation

### 8-1. User Documentation Creation

- [x] README.md Creation
  - Purpose: Explain project overview and usage
  - Details:
    - Project overview
    - Demo link
    - Usage instructions
    - Developer information
    - License information
  - Completion Criteria:
    - [x] README.md exists
    - [x] Content understandable for first-time viewers

- [x] License File Creation
  - Purpose: Apply MIT License
  - Details:
    - Create LICENSE file
    - Add copyright notice
  - Completion Criteria:
    - [x] LICENSE file exists
    - [x] MIT License is applied

### 8-2. Developer Documentation Update

- [x] Architecture Documentation Update
  - Purpose: Update DESIGN.md based on implementation
  - Details:
    - Check differences between implementation and design
    - Update DESIGN.md
    - Update code examples
  - Completion Criteria:
    - [x] DESIGN.md reflects latest implementation
    - [x] Differences are documented

- [ ] Contribution Guide Creation (Optional)
  - Purpose: Clarify contribution methods as open source project
  - Details:
    - Create CONTRIBUTING.md
    - Development environment setup instructions
    - Pull request guidelines
  - Completion Criteria:
    - [ ] CONTRIBUTING.md exists
    - [ ] Contribution methods are clear

---

## Recommended Task Execution Order

1. **Phase 1**: Execute all tasks in order (prerequisite)
2. **Phase 2**: Execute all tasks in order (AST analysis foundation)
3. **Phase 3**: Execute all tasks in order (state management foundation)
4. **Phase 4**: Execute in order: 4-1 → 4-2 → 4-3 → 4-4 (UI implementation)
5. **Phase 5**: Execute after Phase 4 completion (visual improvement)
6. **Phase 6**: Execute after Phase 5 completion (deployment)
7. **Phase 7**: Can run in parallel with Phase 6 (quality assurance)
8. **Phase 8**: Execute after all phases complete (documentation)

---

## Next Steps

Task definition is complete. To begin implementation, run the following commands:

```bash
# Execute specific task
/prj-exec-task [task name or task ID]

# Execute all tasks within a phase
/prj-exec-tasks --until=[task name or task ID]
```

**Recommended First Task**: Start with Phase 1-1 "Project Initialization".

---

**Document Version**: 1.0  
**Created**: 2025-11-23

# Go AST Inspector - Technical Design Document

## Document Information

**Version**: 1.4  
**Created**: 2025-11-23  
**Last Updated**: 2025-11-29  
**Related Documents**: [REQUIREMENTS.md](./REQUIREMENTS.md)  
**Revision History**:
- v1.4: Updated build scripts, added test configuration, updated directory structure
- v1.3: Removed HoverTooltip (requirements change), added HeaderBar, reorganized documentation to reflect implementation completion
- v1.2: Added bidirectional highlight feature (source code ↔ AST tree linking), added highlightedRangeStore
- v1.1: Changed UI framework to Svelte 5.x, completely revised component design
- v1.0: Initial version (Vanilla TypeScript version)

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Design](#architecture-design)
4. [Module Design](#module-design)
5. [Data Flow Design](#data-flow-design)
6. [UI Component Design](#ui-component-design)
7. [Build Configuration](#build-configuration)
8. [Deployment Design](#deployment-design)
9. [Development Environment Setup](#development-environment-setup)

---

## Overview

This design document defines the technical implementation approach for the Go AST Inspector project. To meet the requirements defined in REQUIREMENTS.md, we adopt a design that combines WebAssembly technology with modern frontend technologies.

### Design Principles

1. **Thorough Standalone Nature**: Embed all resources in a single HTML file to achieve complete offline operation
2. **Emphasis on Type Safety**: Combine TypeScript and Svelte to minimize runtime errors
3. **Ensure Maintainability**: Enable easy future extension and modification through Svelte's component-based design
4. **Performance Optimization**: Fast AST parsing through WebAssembly and efficient rendering by Svelte
5. **Development Efficiency**: Concise implementation of state management and UI updates through Svelte's reactive system

---

## Technology Stack

### Adopted Technologies

| Category | Technology | Version | Selection Reason |
|----------|------------|---------|------------------|
| **Language** | TypeScript | 5.x | Improved type safety, development efficiency, and maintainability |
| **UI Framework** | Svelte | 5.x | Lightweight, fast, reactive state management, small bundle size |
| **Build Tool** | Vite | 5.x | Fast development experience, Svelte integration, single HTML file generation |
| **Linter/Formatter** | Biome | 1.x | Fast, all-in-one, TypeScript/Svelte support |
| **AST Parser** | Go WebAssembly | Go 1.21+ | Use of standard libraries (go/ast, go/parser) |
| **UI Language** | English | - | Intended for international use |

### Technologies Not Adopted and Reasons

| Technology | Reason for Not Adopting |
|------------|-------------------------|
| **Vanilla JavaScript/TypeScript** | To avoid complexity in component and state management, adopted Svelte |
| **React** | Large bundle size, unsuitable for standalone nature |
| **Vue** | Larger bundle size compared to Svelte |
| **ESLint + Prettier** | Biome is fast and all-in-one, no need for multiple tool combinations |
| **Webpack/Parcel** | Vite is faster and has a richer plugin ecosystem for single HTML file generation |
| **JavaScript-based Go parser** | Prioritizing accuracy and standard compliance, using Go's official go/parser via WebAssembly |

---

## Architecture Design

### Overall Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Runtime                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Single HTML File (index.html)         │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  Inline CSS (styles)                         │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  Inline JavaScript (bundled Svelte + TS)     │  │ │
│  │  │  ┌────────────────────────────────────────┐  │  │ │
│  │  │  │  UI Layer (Svelte Components)          │  │  │ │
│  │  │  │  ├─ App.svelte (Root)                  │  │  │ │
│  │  │  │  ├─ CodeEditor.svelte                  │  │  │ │
│  │  │  │  ├─ ASTTreeView.svelte                 │  │  │ │
│  │  │  │  ├─ TreeNode.svelte (recursive)        │  │  │ │
│  │  │  │  ├─ HeaderBar.svelte                   │  │  │ │
│  │  │  │  └─ ErrorDisplay.svelte                │  │  │ │
│  │  │  └────────────────────────────────────────┘  │  │ │
│  │  │  ┌────────────────────────────────────────┐  │  │ │
│  │  │  │  Application Logic Layer               │  │  │ │
│  │  │  │  ├─ ASTManager (state management)      │  │  │ │
│  │  │  │  ├─ Parser (WASM bridge)               │  │  │ │
│  │  │  │  └─ Position Mapper (code ↔ AST)       │  │  │ │
│  │  │  └────────────────────────────────────────┘  │  │ │
│  │  │  ┌────────────────────────────────────────┐  │  │ │
│  │  │  │  WebAssembly Layer                     │  │  │ │
│  │  │  │  └─ Go Parser (go/ast, go/parser)      │  │  │ │
│  │  │  └────────────────────────────────────────┘  │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  Inline WebAssembly Binary (base64)         │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Layer Structure

#### 1. WebAssembly Layer
- **Responsibility**: Convert Go source code to AST
- **Technology**: Go 1.21+, go/parser, go/ast, go/token
- **Interface**: Messaging between JavaScript ↔ WebAssembly

#### 2. Application Logic Layer
- **Responsibility**: Business logic, state management, data transformation
- **Components**:
  - `ASTManager`: AST state management
  - `Parser`: Wrapper for WASM calls
  - `PositionMapper`: Mapping between source code positions and AST nodes

#### 3. UI Layer (Svelte Components)
- **Responsibility**: User interface display and operations
- **Svelte Components**:
  - `App.svelte`: Root component, layout management
  - `CodeEditor.svelte`: Source code input editor (with bidirectional highlight feature)
  - `ASTTreeView.svelte`: Container for AST tree structure display
  - `TreeNode.svelte`: Tree node (recursive component, with auto-expand and highlight features)
  - `HeaderBar.svelte`: Header bar and control buttons
  - `ErrorDisplay.svelte`: Error message display

---

## Module Design

### Directory Structure

```
go-ast-inspector/
├── src/
│   ├── main.ts                 # Entry point
│   ├── App.svelte              # Root component
│   ├── wasm/
│   │   ├── parser.go           # Go AST parser implementation
│   │   ├── main.go             # WASM entry point
│   │   ├── go.mod              # Go module definition
│   │   └── build.sh            # WASM build script
│   ├── lib/
│   │   ├── stores/
│   │   │   ├── ast-store.ts        # AST state management (Svelte Store)
│   │   │   ├── ast-store.test.ts   # AST store unit tests
│   │   │   ├── editor-store.ts     # Editor state management (Svelte Store)
│   │   │   └── editor-store.test.ts # Editor store unit tests
│   │   ├── core/
│   │   │   ├── parser-bridge.ts        # WASM bridge
│   │   │   ├── position-mapper.ts      # Position mapping
│   │   │   ├── position-mapper.test.ts # Position mapper unit tests
│   │   │   └── types.ts                # Common type definitions
│   │   └── utils/
│   │       └── constants.ts        # Constants definition
│   ├── components/
│   │   ├── CodeEditor.svelte       # Code editor component
│   │   ├── ASTTreeView.svelte      # AST tree view component
│   │   ├── TreeNode.svelte         # Tree node (recursive)
│   │   ├── HeaderBar.svelte        # Header bar
│   │   └── ErrorDisplay.svelte     # Error display
│   └── styles/
│       └── global.css              # Global styles
├── public/
│   ├── parser.wasm             # Built WASM binary (generated)
│   └── wasm_exec.js            # Go WASM runtime (generated)
├── dist/                       # Build output (single HTML file)
├── e2e/                        # E2E test files
├── vite.config.ts              # Vite configuration
├── vitest.config.ts            # Vitest configuration
├── playwright.config.ts        # Playwright configuration
├── svelte.config.js            # Svelte configuration
├── biome.json                  # Biome configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # npm configuration
├── .github/
│   ├── workflows/
│   │   └── deploy.yml          # GitHub Pages deployment workflow
│   └── pull_request_template.md # Pull request template
├── REQUIREMENTS.md             # Requirements document
├── DESIGN.md                   # Technical design document (this document)
└── README.md                   # Project description
```

### Key Module Details

#### src/lib/stores/ast-store.ts

```typescript
// State management using Svelte Writable Store
import { writable, derived } from 'svelte/store';

export interface ASTNode {
  type: string;           // Node type (e.g., "FuncDecl", "Ident")
  pos: number;            // Start position
  end: number;            // End position
  children: ASTNode[];    // Child nodes
  metadata: Record<string, unknown>; // Metadata
}

// Store holding AST state
export const astStore = writable<ASTNode | null>(null);

// Store holding error state
export const parseErrorStore = writable<{
  message: string;
  line: number;
  column: number;
} | null>(null);

// Store holding expanded node IDs
export const expandedNodesStore = writable<Set<string>>(new Set());

// Store holding selected node
export const selectedNodeStore = writable<ASTNode | null>(null);

// Store holding source code highlight range
export const highlightedRangeStore = writable<{
  start: number;  // Start position (byte offset)
  end: number;    // End position (byte offset)
} | null>(null);

// Store holding source code
export const sourceCodeStore = writable<string>("");
```

#### src/core/parser-bridge.ts

```typescript
interface ParseResult {
  success: boolean;
  ast?: ASTNode;
  error?: {
    message: string;
    line: number;
    column: number;
  };
}

class ParserBridge {
  private wasmInstance: WebAssembly.Instance | null = null;

  // WASM initialization
  async initialize(): Promise<void>;
  
  // Code parsing
  async parse(sourceCode: string): Promise<ParseResult>;
  
  // WASM readiness check
  isReady(): boolean;
}
```

#### src/core/position-mapper.ts

```typescript
interface PositionRange {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

class PositionMapper {
  private sourceCode: string = '';
  private astNodes: Map<string, ASTNode> = new Map();

  // Set source code
  setSourceCode(code: string): void;
  
  // Set AST
  setAST(ast: ASTNode): void;
  
  // Get line and column from byte position
  getPositionFromOffset(offset: number): { line: number; column: number };
  
  // Get byte position from line and column
  getOffsetFromPosition(line: number, column: number): number;
  
  // Get AST node at specified position
  getNodeAtPosition(line: number, column: number): ASTNode | null;
}
```

#### src/components/ASTTreeView.svelte

```svelte
<script lang="ts">
  import { astStore, expandedNodesStore } from '$lib/stores/ast-store';
  import TreeNode from './TreeNode.svelte';
  
  export let defaultExpandLevel = 2;
  
  function expandAll() {
    // Add all node IDs to expandedNodesStore
    expandedNodesStore.update(nodes => {
      // Traverse entire AST and collect all node IDs
      return new Set(/* all node IDs */);
    });
  }
  
  function collapseAll() {
    expandedNodesStore.set(new Set());
  }
</script>

<div class="ast-tree-view">
  <div class="controls">
    <button on:click={expandAll}>Expand All</button>
    <button on:click={collapseAll}>Collapse All</button>
  </div>
  
  {#if $astStore}
    <TreeNode node={$astStore} level={0} {defaultExpandLevel} />
  {:else}
    <p class="empty-state">No AST available</p>
  {/if}
</div>
```

#### src/components/CodeEditor.svelte

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { parseCode } from '$lib/core/parser-bridge';
  import { 
    astStore, 
    parseErrorStore, 
    selectedNodeStore,
    highlightedRangeStore,
    sourceCodeStore 
  } from '$lib/stores/ast-store';
  import { PositionMapper } from '$lib/core/position-mapper';
  
  export let defaultCode = `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`;
  
  let code = $state(defaultCode);
  let textareaElement: HTMLTextAreaElement | undefined = $state();
  
  const positionMapper = $derived(new PositionMapper(code));
  
  async function handleInput() {
    const result = await parseCode(code);
    sourceCodeStore.set(code);
    
    if (result.success && result.ast) {
      astStore.set(result.ast);
      parseErrorStore.set(null);
    } else if (result.error) {
      parseErrorStore.set(result.error);
      astStore.set(null);
    }
  }
  
  function handleClick(event: MouseEvent) {
    if (!textareaElement) return;
    
    setTimeout(() => {
      const cursorPos = textareaElement.selectionStart;
      const node = positionMapper.findNodeAtOffset($astStore, cursorPos + 1);
      selectedNodeStore.set(node);
      
      if (node) {
        highlightedRangeStore.set({ start: node.pos, end: node.end });
      } else {
        highlightedRangeStore.set(null);
      }
    }, 0);
  }
  
  function handleSelectionChange() {
    if (!textareaElement) return;
    const cursorPos = textareaElement.selectionStart;
    const node = positionMapper.findNodeAtOffset($astStore, cursorPos + 1);
    selectedNodeStore.set(node);
    
    if (node) {
      highlightedRangeStore.set({ start: node.pos, end: node.end });
    } else {
      highlightedRangeStore.set(null);
    }
  }
  
  // Monitor selection from AST tree and highlight display
  $effect(() => {
    if ($selectedNodeStore) {
      highlightedRangeStore.set({
        start: $selectedNodeStore.pos,
        end: $selectedNodeStore.end
      });
    }
  });
  
  onMount(() => {
    handleInput();
  });
</script>

<div class="code-editor">
  <textarea
    bind:value={code}
    bind:this={textareaElement}
    oninput={handleInput}
    onclick={handleClick}
    onkeyup={handleSelectionChange}
    spellcheck="false"
    placeholder="Enter Go code here..."
  />
  <!-- Highlight display layer (background) -->
  {#if $highlightedRangeStore}
    <div class="highlight-overlay" style="..."></div>
  {/if}
</div>
```

---

## Data Flow Design

### 1. Initialization Flow

```
Page Load
    ↓
Execute main.ts
    ↓
Initialize WASM (ParserBridge.initialize())
    ↓
Initialize UI (generate each component)
    ↓
Set default code ("Hello World" sample)
    ↓
Execute initial parse
    ↓
Display AST
```

### 2. Code Edit Flow

```
User edits code
    ↓
Fire CodeEditor.onChange event
    ↓
ParserBridge.parse(sourceCode)
    ↓
Execute parse in WASM
    ↓
Get ParseResult
    ├─ Success
    │   ↓
    │   ASTManager.updateAST(ast)
    │   ↓
    │   Notify each listener
    │   ↓
    │   ASTTreeView.updateAST(ast)
    │   ↓
    │   Redraw tree
    │
    └─ Failure
        ↓
        ErrorDisplay.show(error)
        ↓
        Highlight error line
```

### 3. Bidirectional Highlight Flow

#### 3-1. Source Code → AST Tree Linking

```
User clicks on code/moves cursor
    ↓
Fire CodeEditor.onClick/onKeyUp event
    ↓
Get cursor position (offset)
    ↓
PositionMapper.findNodeAtOffset(offset)
    ↓
Get corresponding AST node
    ↓
selectedNodeStore.set(node)
    ↓
TreeNode monitors selectedNode
    ↓
Auto-expand branch to relevant node
    ↓
Highlight relevant node
    ↓
Auto-scroll to relevant node
```

#### 3-2. AST Tree → Source Code Linking

```
User clicks on TreeNode
    ↓
Fire TreeNode.onClick event
    ↓
selectedNodeStore.set(node)
    ↓
CodeEditor monitors selectedNode
    ↓
Calculate relevant range from node's pos/end
    ↓
highlightedRangeStore.set({start: pos, end: end})
    ↓
Highlight relevant range in CodeEditor
    ↓
Auto-scroll to relevant range (recommended)
```

### 4. Tree Operation Flow

```
User clicks node
    ↓
ASTTreeView.toggleNode(nodeId)
    ↓
Update expand state
    ↓
Redraw only relevant node (partial update)
```

---

## UI Component Design

### Layout Structure

```
┌────────────────────────────────────────────────────────┐
│                     Header Bar                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Parse    │ │ Expand   │ │ Collapse │               │
│  │ Button   │ │ All      │ │ All      │               │
│  └──────────┘ └──────────┘ └──────────┘               │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│                     Main Content                       │
│  ┌──────────────────────┐ ┌─────────────────────────┐ │
│  │                      │ │                         │ │
│  │   Code Editor        │ │   AST Tree View         │ │
│  │   (Left Panel)       │ │   (Right Panel)         │ │
│  │                      │ │                         │ │
│  │  - Syntax Highlight  │ │  - Tree Structure       │ │
│  │  - Line Numbers      │ │  - Expand/Collapse      │ │
│  │  - Hover Support     │ │  - Node Selection       │ │
│  │                      │ │                         │ │
│  └──────────────────────┘ └─────────────────────────┘ │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│                     Status Bar                         │
│  Ready | 15 nodes | No errors                          │
└────────────────────────────────────────────────────────┘
```

### UI Component Specifications

#### 1. Header Bar
- **Parse Button**: Execute manual parse (when auto-parse is disabled)
- **Expand All**: Expand all nodes
- **Collapse All**: Collapse all nodes

#### 2. Code Editor
- **Features**:
  - Syntax highlighting (Go language, recommended)
  - Line number display (recommended)
  - AST node selection on click/cursor movement
  - Highlight code range corresponding to selected AST node
  - Error line marking
- **Technology Used**: `<textarea>` + custom highlight implementation
- **Highlight Display**: Emphasize the range of selected AST node with background color

#### 3. AST Tree View
- **Features**:
  - Hierarchical tree display
  - Expand/collapse on node click
  - Visual distinction of node types (color coding)
  - Highlight of selected node
  - Auto-expand and highlight based on selected position in code editor
- **Technology Used**: No virtual DOM, efficient DOM manipulation

#### 4. Error Display
- **Display Content**:
  - Error message
  - Error location (line and column)
  - Highlight of relevant line
- **Display Location**: Status Bar or inline message

---

## Build Configuration

### Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        // Enable Svelte 5 runes mode
        runes: true,
      },
    }),
    viteSingleFile({
      removeViteModuleLoader: true, // Remove Vite module loader
    }),
  ],
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 100000000, // Inline all assets
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // Also inline dynamic imports
      },
    },
  },
  base: './', // Relative path support
  resolve: {
    alias: {
      '$lib': '/src/lib',
    },
  },
});
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "allowSyntheticDefaultImports": true,
    "types": []
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/wasm"]
}
```

### Biome Configuration (biome.json)

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noVar": "error",
        "useConst": "warn"
      },
      "correctness": {
        "noUnusedVariables": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  },
  "files": {
    "ignore": ["node_modules", "dist", "src/wasm/*.go"]
  }
}
```

### Svelte Configuration (svelte.config.js)

```javascript
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true, // Enable Svelte 5 runes mode
  },
};
```

### package.json Scripts and Dependencies

```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run build:wasm && vite build",
    "build:wasm": "cd src/wasm && ./build.sh",
    "preview": "vite preview",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "type-check": "svelte-check --tsconfig ./tsconfig.json && tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  },
  "dependencies": {
    "svelte": "^5.0.0"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "@biomejs/biome": "^1.9.0",
    "@playwright/test": "^1.56.0",
    "@testing-library/svelte": "^5.2.0",
    "@vitest/ui": "^4.0.0",
    "jsdom": "^27.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vite-plugin-singlefile": "^2.0.0",
    "vitest": "^4.0.0",
    "svelte-check": "^4.0.0"
  }
}
```

### WASM Build Script (src/wasm/build.sh)

```bash
#!/bin/bash
set -e

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
OUTPUT_DIR="$SCRIPT_DIR/../../public"

mkdir -p "$OUTPUT_DIR"

echo "Building Go WebAssembly..."
GOOS=js GOARCH=wasm go build -o "$OUTPUT_DIR/parser.wasm" "$SCRIPT_DIR"

echo "Copying wasm_exec.js..."
GOROOT=$(go env GOROOT)
if [ -f "$GOROOT/lib/wasm/wasm_exec.js" ]; then
  rm -f "$OUTPUT_DIR/wasm_exec.js"
  cp "$GOROOT/lib/wasm/wasm_exec.js" "$OUTPUT_DIR/wasm_exec.js"
elif [ -f "$GOROOT/misc/wasm/wasm_exec.js" ]; then
  rm -f "$OUTPUT_DIR/wasm_exec.js"
  cp "$GOROOT/misc/wasm/wasm_exec.js" "$OUTPUT_DIR/wasm_exec.js"
else
  echo "Error: wasm_exec.js not found"
  exit 1
fi

echo "WebAssembly build complete!"
```

---

## Deployment Design

### GitHub Pages Deployment

#### GitHub Actions Workflow (.github/workflows/deploy.yml)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.21'

      - name: Install dependencies
        run: npm ci

      - name: Build WASM
        run: npm run build:wasm

      - name: Build project
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Build Artifacts

- **Output File**: `dist/index.html`
- **File Size Target**: 5MB or less
- **Includes**:
  - All HTML
  - Inlined CSS
  - Inlined JavaScript (TypeScript compiled)
  - Base64-encoded WASM binary

---

## Development Environment Setup

### Prerequisites

- Node.js 20.x or higher
- Go 1.21 or higher
- npm or yarn

### Setup Procedure

```bash
# 1. Clone repository
git clone https://github.com/handlename/go-ast-inspector.git
cd go-ast-inspector

# 2. Install dependencies
npm install

# 3. Build WASM
npm run build:wasm

# 4. Start development server
npm run dev

# 5. Open in browser
# http://localhost:5173
```

### Development Workflow

```bash
# Code change monitoring + hot reload
npm run dev

# Lint check
npm run lint

# Fix formatting
npm run format

# Type check
npm run type-check

# Production build
npm run build

# Preview build result
npm run preview
```

---

## Performance Optimization

### 1. WASM Optimization

- **Minimized Build**: Reduce binary size with `-ldflags="-s -w"` flag
- **gzip Compression**: Compress WASM binary with gzip and Base64 encode

### 2. UI Optimization

- **Svelte's Efficient Rendering**: Reactive updates redraw only necessary parts
- **Virtual Scrolling**: Apply virtual scrolling when displaying large AST trees (consider using svelte-virtual)
- **Lazy Rendering**: Skip rendering of collapsed nodes (implemented with Svelte conditional branching)
- **Debounce**: Delay parse execution by 300ms on code change

### 3. Memory Optimization

- **Svelte's Efficient DOM Management**: Optimized DOM operations by Svelte compiler
- **Minimize Event Listeners**: Efficient management through Svelte's event handling
- **Store Optimization**: Avoid unnecessary calculations using derived stores

---

## Security Considerations

### 1. Data Protection

- **No LocalStorage Use**: Never save input code
- **No Network Communication**: Complete all processing on client side
- **XSS Protection**: Thoroughly escape user input

### 2. Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'wasm-unsafe-eval'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data:; 
               connect-src 'none';">
```

---

## Testing Strategy

### 1. Unit Tests (Recommended)

- **Target**: 
  - Svelte Stores (ast-store, editor-store, etc.)
  - Core logic (ParserBridge, PositionMapper, etc.)
  - Utility functions
- **Tools**: Vitest (Vite-integrated test framework) + @testing-library/svelte
- **Coverage Goal**: 70% or higher

### 2. Integration Tests (Recommended)

- **Target**: Integration between Svelte components
- **Tools**: @testing-library/svelte
- **Scenarios**:
  - Code input → Parse → AST display (CodeEditor + ASTTreeView)
  - Tree node selection → Source code highlight (TreeNode → CodeEditor)
  - Node click → Expand/collapse (TreeNode + expandedNodesStore)

### 3. E2E Tests (Recommended)

- **Tools**: Playwright
- **Scenarios**:
  - Page load → Display default code → Parse success
  - Error code input → Confirm error display
  - Browser compatibility test (Chrome, Firefox, Safari, Edge)

---

## Future Extensibility

### Phase 2 Features (Optional)

1. **Multi-language Support**: Add JavaScript/TypeScript AST parsing
2. **Export Feature**: Output AST in JSON/YAML format
3. **Custom Themes**: Dark mode, color scheme changes
4. **Code Formatting**: Code formatter using AST information
5. **Diff Display**: Comparison display of two ASTs

### Design Considerations for Extension

- **Plugin Architecture**: Make parser replacement easy
- **Configuration File**: Externalize user settings (when using localStorage)
- **Module Independence**: Maintain loose coupling of each component

---

## Appendix

### A. Reference Materials

- [Svelte Documentation](https://svelte.dev/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [Vite Documentation](https://vitejs.dev/)
- [Biome Documentation](https://biomejs.dev/)
- [Go WebAssembly Documentation](https://github.com/golang/go/wiki/WebAssembly)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### B. Glossary

| Term | Description |
|------|-------------|
| AST | Abstract Syntax Tree |
| WASM | WebAssembly |
| CSP | Content Security Policy |
| HMR | Hot Module Replacement |
| MVP | Minimum Viable Product |

---

**End of Document**

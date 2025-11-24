# Go AST Inspector

Browser-based Abstract Syntax Tree (AST) viewer for Go language source code, operating entirely standalone without any external dependencies.

## Features

- **Standalone Operation**: Works completely offline as a single HTML file
- **Real-time AST Parsing**: Instantly visualizes Go source code as an Abstract Syntax Tree
- **Interactive Tree View**: Expandable/collapsible tree structure with automatic node expansion
- **Bidirectional Highlighting**: Click on source code to highlight AST nodes, or vice versa
- **Resizable Panels**: Adjustable layout between code editor and AST tree view
- **Accessibility Support**: Full keyboard navigation and screen reader compatibility
- **No Installation Required**: Just open the HTML file in your browser

## Demo

[Live Demo on GitHub Pages](https://handlename.github.io/go-ast-inspector/)

## Usage

### Online

Visit the [live demo](https://handlename.github.io/go-ast-inspector/) and start exploring Go AST immediately.

### Offline

1. Download `dist/index.html` from the [releases page](https://github.com/handlename/go-ast-inspector/releases)
2. Open the file in your web browser
3. Enter or paste Go source code into the left editor
4. The AST tree will be displayed on the right side

### Example

Try this "Hello World" example (loaded by default):

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello, World!")
}
```

The AST tree will show:
- File node
- Package declaration
- Import specifications
- Function declarations
- Call expressions
- And more...

## Development

### Prerequisites

- Node.js 20 or later
- Go 1.21 or later

### Setup

```bash
# Clone the repository
git clone https://github.com/handlename/go-ast-inspector.git
cd go-ast-inspector

# Install dependencies
npm install

# Build WebAssembly parser
npm run build:wasm

# Start development server
npm run dev
```

### Build

```bash
# Build single HTML file
npm run build

# Output: dist/index.html (standalone, 5.1MB)
```

### Project Structure

```
go-ast-inspector/
├── src/
│   ├── components/        # Svelte UI components
│   │   ├── ASTTreeView.svelte
│   │   ├── CodeEditor.svelte
│   │   ├── ErrorDisplay.svelte
│   │   ├── HeaderBar.svelte
│   │   └── TreeNode.svelte
│   ├── lib/
│   │   ├── core/          # Core logic
│   │   │   ├── parser-bridge.ts
│   │   │   ├── position-mapper.ts
│   │   │   └── types.ts
│   │   ├── stores/        # Svelte stores
│   │   │   ├── ast-store.ts
│   │   │   └── editor-store.ts
│   │   └── utils/         # Utilities
│   │       └── constants.ts
│   ├── wasm/              # Go WebAssembly parser
│   │   ├── parser.go
│   │   ├── go.mod
│   │   └── build.sh
│   ├── App.svelte         # Root component
│   └── main.ts            # Entry point
├── public/                # Static assets
│   ├── parser.wasm
│   └── wasm_exec.js
├── REQUIREMENTS.md        # Requirements specification
├── DESIGN.md              # Technical design
└── TASKS.md               # Implementation tasks

```

### Architecture

- **Frontend**: Svelte 5 (Runes mode) + TypeScript
- **AST Parser**: Go WebAssembly (go/parser, go/ast)
- **Build Tool**: Vite with vite-plugin-singlefile
- **State Management**: Svelte stores (writable)
- **Styling**: Scoped CSS with BEM naming convention

## Technical Details

### AST Parsing

The AST parsing is performed using Go's standard `go/parser` and `go/ast` packages, compiled to WebAssembly. This ensures:

- 100% compatibility with official Go syntax
- Support for all Go language versions up to 1.21
- Accurate position information for source code mapping

### Single HTML File Generation

All resources (CSS, JavaScript, WebAssembly) are inlined into a single HTML file:

- **parser.wasm**: Base64-encoded and embedded
- **JavaScript**: Bundled and inlined
- **CSS**: Inlined with styles
- **File size**: ~5.1MB uncompressed, ~1.4MB gzip

This approach enables:
- Zero network requests
- Offline operation
- Easy distribution and deployment

## Browser Compatibility

- Chrome/Edge: 88+
- Firefox: 89+
- Safari: 15+

WebAssembly support is required.

## License

MIT License - See [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Development Guidelines

1. Follow the existing code style (enforced by Biome)
2. Maintain type safety (TypeScript strict mode)
3. Test changes locally before submitting
4. Update documentation as needed

## Acknowledgments

- Built with [Svelte](https://svelte.dev/)
- AST parsing powered by [Go](https://golang.org/)
- Inspired by [goast-viewer](https://yuroyoro.github.io/goast-viewer/)

## Author

handlename

## Links

- [GitHub Repository](https://github.com/handlename/go-ast-inspector)
- [Issue Tracker](https://github.com/handlename/go-ast-inspector/issues)
- [Live Demo](https://handlename.github.io/go-ast-inspector/)

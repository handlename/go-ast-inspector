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
echo "Output: $OUTPUT_DIR/parser.wasm"
echo "Runtime: $OUTPUT_DIR/wasm_exec.js"

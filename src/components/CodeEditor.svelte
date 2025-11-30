<script lang="ts">
import { PositionMapper } from '$lib/core/position-mapper';
import { astStore, highlightedRangeStore, selectedNodeStore } from '$lib/stores/ast-store';
import { sourceCodeStore } from '$lib/stores/editor-store';

// biome-ignore lint/style/useConst: Svelte $state() requires let for bind:this
let textareaElement: HTMLTextAreaElement | undefined = $state();
// biome-ignore lint/style/useConst: Svelte $state() requires let for bind:this
let syntaxLayerElement: HTMLDivElement | undefined = $state();
const positionMapper = $derived(new PositionMapper($sourceCodeStore));

// Go language syntax highlighting tokens
const GO_KEYWORDS =
  /\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/g;
const GO_TYPES =
  /\b(bool|byte|complex64|complex128|error|float32|float64|int|int8|int16|int32|int64|rune|string|uint|uint8|uint16|uint32|uint64|uintptr)\b/g;
const GO_LITERALS = /\b(true|false|nil|iota)\b/g;
const GO_STRINGS = /"(?:[^"\\]|\\.)*"|`[^`]*`/g;
const GO_COMMENTS = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
const GO_NUMBERS = /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g;

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function applySyntaxHighlighting(escapedCode: string): string {
  if (!escapedCode) return '';

  let highlighted = escapedCode;

  const markers: Array<{ placeholder: string; replacement: string }> = [];
  let markerIndex = 0;

  function createMarker(match: string, className: string): string {
    const placeholder = `___MARKER_${markerIndex}___`;
    markers.push({
      placeholder,
      replacement: `<span class="${className}">${match}</span>`,
    });
    markerIndex++;
    return placeholder;
  }

  highlighted = highlighted.replace(GO_COMMENTS, (match) => createMarker(match, 'token-comment'));
  highlighted = highlighted.replace(GO_STRINGS, (match) => createMarker(match, 'token-string'));
  highlighted = highlighted.replace(GO_KEYWORDS, (match) => createMarker(match, 'token-keyword'));
  highlighted = highlighted.replace(GO_TYPES, (match) => createMarker(match, 'token-type'));
  highlighted = highlighted.replace(GO_LITERALS, (match) => createMarker(match, 'token-literal'));
  highlighted = highlighted.replace(GO_NUMBERS, (match) => createMarker(match, 'token-number'));

  for (const marker of markers) {
    highlighted = highlighted.replace(marker.placeholder, marker.replacement);
  }

  return highlighted;
}

// Generate code with inline selection highlight embedded in syntax highlighting
function generateHighlightedCode(
  code: string,
  range: { start: number; end: number } | null,
): string {
  if (!code) return '';

  // If no range, just return syntax highlighted code
  if (!range) {
    return applySyntaxHighlighting(escapeHtml(code));
  }

  // AST positions are 1-based, convert to 0-based
  const startOffset = Math.max(0, range.start - 1);
  const endOffset = Math.min(code.length, range.end - 1);

  if (startOffset >= endOffset) {
    return applySyntaxHighlighting(escapeHtml(code));
  }

  // Split code into three parts and escape each
  const beforeText = escapeHtml(code.substring(0, startOffset));
  const highlightText = escapeHtml(code.substring(startOffset, endOffset));
  const afterText = escapeHtml(code.substring(endOffset));

  // Apply syntax highlighting to each part
  const beforeHighlighted = applySyntaxHighlighting(beforeText);
  const highlightedPart = applySyntaxHighlighting(highlightText);
  const afterHighlighted = applySyntaxHighlighting(afterText);

  // Wrap the highlighted portion with a mark element
  return `${beforeHighlighted}<mark class="code-highlight">${highlightedPart}</mark>${afterHighlighted}`;
}

const renderedCode = $derived(generateHighlightedCode($sourceCodeStore, $highlightedRangeStore));

// Watch for AST tree selection and set highlight range, scroll editor
$effect(() => {
  if ($selectedNodeStore) {
    highlightedRangeStore.set({
      start: $selectedNodeStore.pos,
      end: $selectedNodeStore.end,
    });

    if (textareaElement) {
      scrollToPosition($selectedNodeStore.pos);
    }
  } else {
    highlightedRangeStore.set(null);
  }
});

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  sourceCodeStore.set(target.value);
}

function handleClick() {
  if (!textareaElement) return;

  const textarea = textareaElement;

  setTimeout(() => {
    const cursorPos = textarea.selectionStart;

    if (cursorPos === undefined || cursorPos < 0) {
      selectedNodeStore.set(null);
      return;
    }

    const node = positionMapper.findNodeAtOffset($astStore, cursorPos + 1);
    selectedNodeStore.set(node);
  }, 0);
}

function handleSelectionChange() {
  if (!textareaElement) return;

  const textarea = textareaElement;
  const cursorPos = textarea.selectionStart;

  if (cursorPos === undefined || cursorPos < 0) {
    selectedNodeStore.set(null);
    return;
  }

  const node = positionMapper.findNodeAtOffset($astStore, cursorPos + 1);
  selectedNodeStore.set(node);
}

function handleBlur() {
  selectedNodeStore.set(null);
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Tab') {
    event.preventDefault();

    const textarea = event.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    const newValue = `${value.substring(0, start)}\t${value.substring(end)}`;
    sourceCodeStore.set(newValue);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 1;
    }, 0);
  }
}

function handleScroll() {
  if (!textareaElement || !syntaxLayerElement) return;

  syntaxLayerElement.scrollTop = textareaElement.scrollTop;
  syntaxLayerElement.scrollLeft = textareaElement.scrollLeft;
}

function scrollToPosition(astPosition: number) {
  if (!textareaElement) return;

  const text = $sourceCodeStore;
  const offset = Math.max(0, astPosition - 1);

  const lines = text.split('\n');
  let currentOffset = 0;
  let targetLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length + 1;
    if (currentOffset + lineLength > offset) {
      targetLine = i;
      break;
    }
    currentOffset += lineLength;
  }

  const lineHeight = 1.5 * 14;
  const targetScrollTop = targetLine * lineHeight;

  const editorHeight = textareaElement.clientHeight;
  const scrollTop = Math.max(0, targetScrollTop - editorHeight / 3);

  textareaElement.scrollTop = scrollTop;
  if (syntaxLayerElement) syntaxLayerElement.scrollTop = scrollTop;
}
</script>

<div class="code-editor">
    <div class="code-editor__header">
        <h2 class="code-editor__title" id="code-editor-title">
            Go Source Code
        </h2>
    </div>
    <div class="code-editor__wrapper">
        <div
            bind:this={syntaxLayerElement}
            class="code-editor__syntax-layer"
            aria-hidden="true"
        >
            <pre class="code-editor__syntax-pre"><code
                    >{@html renderedCode}</code
                ></pre>
        </div>
        <textarea
            bind:this={textareaElement}
            class="code-editor__textarea"
            value={$sourceCodeStore}
            oninput={handleInput}
            onclick={handleClick}
            onkeydown={handleKeyDown}
            onkeyup={handleSelectionChange}
            onblur={handleBlur}
            onscroll={handleScroll}
            spellcheck="false"
            placeholder="Enter Go source code here..."
            aria-label="Go source code editor"
            aria-labelledby="code-editor-title"
        ></textarea>
    </div>
</div>

<style>
    .code-editor {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .code-editor__header {
        display: flex;
        align-items: center;
        min-height: 3.25rem;
        padding: 0.75rem 1rem;
        box-sizing: border-box;
        background-color: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
    }

    .code-editor__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #333;
    }

    .code-editor__wrapper {
        position: relative;
        flex: 1;
        overflow: hidden;
        background-color: #fafafa;
    }

    .code-editor__syntax-layer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 1;
    }

    .code-editor__syntax-layer::-webkit-scrollbar {
        display: none;
    }

    .code-editor__syntax-pre {
        margin: 0;
        padding: 1rem;
        box-sizing: border-box;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #333;
        tab-size: 4;
        white-space: pre;
        min-width: 100%;
        width: max-content;
    }

    .code-editor__textarea {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        padding: 1rem;
        box-sizing: border-box;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        border: none;
        outline: none;
        resize: none;
        background-color: transparent;
        color: transparent;
        caret-color: #333;
        tab-size: 4;
        white-space: pre;
        z-index: 2;
    }

    .code-editor__textarea::-webkit-scrollbar {
        display: none;
    }

    .code-editor__textarea {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .code-editor__textarea::placeholder {
        color: #999;
    }

    .code-editor__textarea::selection {
        background-color: rgba(0, 123, 255, 0.3);
    }

    /* Inline highlight style */
    :global(.code-editor__syntax-pre .code-highlight) {
        background-color: rgba(255, 235, 59, 0.4);
        border-radius: 2px;
    }

    /* Syntax highlighting colors */
    :global(.code-editor__syntax-pre .token-keyword) {
        color: #0000ff;
        font-weight: 600;
    }

    :global(.code-editor__syntax-pre .token-type) {
        color: #267f99;
        font-weight: 500;
    }

    :global(.code-editor__syntax-pre .token-literal) {
        color: #0000ff;
    }

    :global(.code-editor__syntax-pre .token-string) {
        color: #a31515;
    }

    :global(.code-editor__syntax-pre .token-comment) {
        color: #008000;
        font-style: italic;
    }

    :global(.code-editor__syntax-pre .token-number) {
        color: #098658;
    }
</style>

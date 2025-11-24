<script lang="ts">
    import { PositionMapper } from "$lib/core/position-mapper";
    import {
        astStore,
        selectedNodeStore,
        highlightedRangeStore,
    } from "$lib/stores/ast-store";
    import { sourceCodeStore } from "$lib/stores/editor-store";

    let textareaElement: HTMLTextAreaElement | undefined = $state();
    let syntaxLayerElement: HTMLDivElement | undefined = $state();
    let highlightLayerElement: HTMLDivElement | undefined = $state();
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

    function highlightSyntax(code: string): string {
        if (!code) return "";

        // First escape HTML
        let highlighted = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Create a temporary marker system to avoid conflicts
        const markers: Array<{ placeholder: string; replacement: string }> = [];
        let markerIndex = 0;

        // Helper function to create temporary markers
        function createMarker(match: string, className: string): string {
            const placeholder = `___MARKER_${markerIndex}___`;
            markers.push({
                placeholder,
                replacement: `<span class="${className}">${match}</span>`,
            });
            markerIndex++;
            return placeholder;
        }

        // Comments (must be first to avoid highlighting inside comments)
        highlighted = highlighted.replace(GO_COMMENTS, (match) =>
            createMarker(match, "token-comment"),
        );

        // Strings
        highlighted = highlighted.replace(GO_STRINGS, (match) =>
            createMarker(match, "token-string"),
        );

        // Keywords
        highlighted = highlighted.replace(GO_KEYWORDS, (match) =>
            createMarker(match, "token-keyword"),
        );

        // Types
        highlighted = highlighted.replace(GO_TYPES, (match) =>
            createMarker(match, "token-type"),
        );

        // Literals
        highlighted = highlighted.replace(GO_LITERALS, (match) =>
            createMarker(match, "token-literal"),
        );

        // Numbers
        highlighted = highlighted.replace(GO_NUMBERS, (match) =>
            createMarker(match, "token-number"),
        );

        // Replace all markers with actual HTML
        for (const marker of markers) {
            highlighted = highlighted.replace(
                marker.placeholder,
                marker.replacement,
            );
        }

        return highlighted;
    }

    const highlightedCode = $derived(highlightSyntax($sourceCodeStore));

    // ASTツリーからの選択を監視してハイライト範囲を設定
    $effect(() => {
        if ($selectedNodeStore) {
            highlightedRangeStore.set({
                start: $selectedNodeStore.pos,
                end: $selectedNodeStore.end,
            });
        } else {
            highlightedRangeStore.set(null);
        }
    });

    // タブ文字を考慮した表示幅の計算
    function getVisualWidth(text: string, tabSize: number = 4): number {
        let width = 0;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === "\t") {
                width += tabSize - (width % tabSize);
            } else {
                width += 1;
            }
        }
        return width;
    }

    function getHighlightedLines(): Array<{
        top: number;
        left: number;
        width: number;
        height: number;
    }> {
        if (!$highlightedRangeStore || !textareaElement) {
            return [];
        }

        const { start, end } = $highlightedRangeStore;
        const text = $sourceCodeStore;

        // AST positions are 1-based, convert to 0-based
        const startOffset = Math.max(0, start - 1);
        const endOffset = Math.min(text.length, end - 1);

        if (startOffset >= endOffset) {
            return [];
        }

        // Calculate line height and padding from textarea styles
        const lineHeight = 1.5 * 14; // 1.5 * 0.875rem (assuming 16px base)
        const padding = 16; // 1rem
        const charWidth = 8.4; // Approximate width for 0.875rem monospace
        const tabSize = 4; // tab-size: 4 from CSS

        // Split text into lines
        const allLines = text.split("\n");
        let currentOffset = 0;
        let startLine = 0;
        let startCol = 0;
        let endLine = 0;
        let endCol = 0;

        // Find start and end line/column
        for (let i = 0; i < allLines.length; i++) {
            const lineLength = allLines[i].length + 1; // +1 for newline

            if (currentOffset + lineLength > startOffset && startLine === 0) {
                startLine = i;
                startCol = startOffset - currentOffset;
            }

            if (currentOffset + lineLength > endOffset) {
                endLine = i;
                endCol = endOffset - currentOffset;
                break;
            }

            currentOffset += lineLength;
        }

        const result: Array<{
            top: number;
            left: number;
            width: number;
            height: number;
        }> = [];

        if (startLine === endLine) {
            // Single line highlight
            const lineText = allLines[startLine];
            const beforeStart = lineText.substring(0, startCol);
            const highlightText = lineText.substring(startCol, endCol);

            result.push({
                top: padding + startLine * lineHeight,
                left:
                    padding + getVisualWidth(beforeStart, tabSize) * charWidth,
                width: getVisualWidth(highlightText, tabSize) * charWidth,
                height: lineHeight,
            });
        } else {
            // First line
            const firstLineText = allLines[startLine];
            const beforeStart = firstLineText.substring(0, startCol);
            const firstLineHighlight = firstLineText.substring(startCol);

            result.push({
                top: padding + startLine * lineHeight,
                left:
                    padding + getVisualWidth(beforeStart, tabSize) * charWidth,
                width: getVisualWidth(firstLineHighlight, tabSize) * charWidth,
                height: lineHeight,
            });

            // Middle lines
            for (let i = startLine + 1; i < endLine; i++) {
                result.push({
                    top: padding + i * lineHeight,
                    left: padding,
                    width: getVisualWidth(allLines[i], tabSize) * charWidth,
                    height: lineHeight,
                });
            }

            // Last line
            const lastLineHighlight = allLines[endLine].substring(0, endCol);
            result.push({
                top: padding + endLine * lineHeight,
                left: padding,
                width: getVisualWidth(lastLineHighlight, tabSize) * charWidth,
                height: lineHeight,
            });
        }

        return result;
    }

    function handleInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        sourceCodeStore.set(target.value);
    }

    function handleClick() {
        if (!textareaElement) return;

        const textarea = textareaElement;

        // Get cursor position after click
        setTimeout(() => {
            const cursorPos = textarea.selectionStart;

            if (cursorPos === undefined || cursorPos < 0) {
                selectedNodeStore.set(null);
                return;
            }

            const node = positionMapper.findNodeAtOffset(
                $astStore,
                cursorPos + 1,
            ); // AST positions are 1-based
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
        if (event.key === "Tab") {
            event.preventDefault();

            const textarea = event.target as HTMLTextAreaElement;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;

            // Insert tab character at cursor position
            const newValue =
                value.substring(0, start) + "\t" + value.substring(end);
            sourceCodeStore.set(newValue);

            // Set cursor position after the inserted tab
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 1;
            }, 0);
        }
    }

    function handleScroll() {
        if (!textareaElement || !syntaxLayerElement || !highlightLayerElement)
            return;

        const scrollTop = textareaElement.scrollTop;
        const scrollLeft = textareaElement.scrollLeft;

        syntaxLayerElement.scrollTop = scrollTop;
        syntaxLayerElement.scrollLeft = scrollLeft;
        highlightLayerElement.scrollTop = scrollTop;
        highlightLayerElement.scrollLeft = scrollLeft;
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
                    >{@html highlightedCode}</code
                ></pre>
        </div>
        <div
            bind:this={highlightLayerElement}
            class="code-editor__highlight-layer"
            aria-hidden="true"
        >
            {#if $highlightedRangeStore}
                {#each getHighlightedLines() as line}
                    <div
                        class="highlight-line"
                        style="top: {line.top}px; left: {line.left}px; width: {line.width}px; height: {line.height}px;"
                    ></div>
                {/each}
            {/if}
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
        padding: 0.75rem 1rem;
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
        overflow: auto;
        z-index: 1;
    }

    .code-editor__syntax-layer::-webkit-scrollbar {
        display: none;
    }

    .code-editor__syntax-pre {
        margin: 0;
        padding: 1rem;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #333;
        tab-size: 4;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .code-editor__highlight-layer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        overflow: auto;
        z-index: 2;
    }

    .code-editor__highlight-layer::-webkit-scrollbar {
        display: none;
    }

    .highlight-line {
        position: absolute;
        background-color: rgba(255, 235, 59, 0.3);
        border-radius: 2px;
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
        z-index: 3;
    }

    .code-editor__textarea::placeholder {
        color: #999;
    }

    .code-editor__textarea::selection {
        background-color: rgba(0, 123, 255, 0.3);
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

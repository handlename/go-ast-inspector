<script lang="ts">
    import { PositionMapper } from "$lib/core/position-mapper";
    import {
        astStore,
        highlightedRangeStore,
        selectedNodeStore,
    } from "$lib/stores/ast-store";
    import { sourceCodeStore } from "$lib/stores/editor-store";

    // biome-ignore lint/style/useConst: Svelte $state() requires let for bind:this
    let textareaElement: HTMLTextAreaElement | undefined = $state();
    // biome-ignore lint/style/useConst: Svelte $state() requires let for bind:this
    let syntaxLayerElement: HTMLDivElement | undefined = $state();
    // biome-ignore lint/style/useConst: Svelte $state() requires let for bind:this
    let highlightLayerElement: HTMLDivElement | undefined = $state();
    // biome-ignore lint/style/useConst: Svelte $state() requires let for bind:this
    let measureLayerElement: HTMLDivElement | undefined = $state();
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

    // ASTツリーからの選択を監視してハイライト範囲を設定し、エディタをスクロール
    $effect(() => {
        if ($selectedNodeStore) {
            highlightedRangeStore.set({
                start: $selectedNodeStore.pos,
                end: $selectedNodeStore.end,
            });

            // Scroll editor to the selected node position
            if (textareaElement) {
                scrollToPosition($selectedNodeStore.pos);
            }
        } else {
            highlightedRangeStore.set(null);
        }
    });

    // Escape HTML for safe rendering in the measurement layer
    function escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // Calculate highlight rectangles using DOM measurement
    function getHighlightRects(): DOMRect[] {
        if (
            !$highlightedRangeStore ||
            !measureLayerElement ||
            !syntaxLayerElement
        ) {
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

        // Create HTML with a span around the highlighted portion
        const beforeText = escapeHtml(text.substring(0, startOffset));
        const highlightText = escapeHtml(
            text.substring(startOffset, endOffset),
        );
        const afterText = escapeHtml(text.substring(endOffset));

        // Insert HTML with marker span
        measureLayerElement.innerHTML = `<pre class="code-editor__measure-pre">${beforeText}<span id="highlight-marker">${highlightText}</span>${afterText}</pre>`;

        // Get the marker span's bounding rectangles
        const marker = measureLayerElement.querySelector("#highlight-marker");
        if (!marker) {
            return [];
        }

        // Use getClientRects to get individual line rectangles (handles word wrap)
        const clientRects = marker.getClientRects();
        const containerRect = measureLayerElement.getBoundingClientRect();

        // Convert client rects to positions relative to the measure layer
        const rects: DOMRect[] = [];
        for (let i = 0; i < clientRects.length; i++) {
            const rect = clientRects[i];
            rects.push(
                new DOMRect(
                    rect.left -
                        containerRect.left +
                        measureLayerElement.scrollLeft,
                    rect.top -
                        containerRect.top +
                        measureLayerElement.scrollTop,
                    rect.width,
                    rect.height,
                ),
            );
        }

        return rects;
    }

    // Reactive state for highlight rectangles
    let highlightRects = $state<DOMRect[]>([]);

    // Update highlight rectangles when range or source code changes
    $effect(() => {
        // Dependencies
        $highlightedRangeStore;
        $sourceCodeStore;

        // Use tick to ensure DOM is updated
        if (measureLayerElement) {
            // Delay measurement to next frame to ensure layout is complete
            requestAnimationFrame(() => {
                highlightRects = getHighlightRects();
            });
        }
    });

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
            const newValue = `${value.substring(0, start)}\t${value.substring(end)}`;
            sourceCodeStore.set(newValue);

            // Set cursor position after the inserted tab
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 1;
            }, 0);
        }
    }

    function handleScroll() {
        if (!textareaElement) return;

        const scrollTop = textareaElement.scrollTop;
        const scrollLeft = textareaElement.scrollLeft;

        if (syntaxLayerElement) {
            syntaxLayerElement.scrollTop = scrollTop;
            syntaxLayerElement.scrollLeft = scrollLeft;
        }
        if (highlightLayerElement) {
            highlightLayerElement.scrollTop = scrollTop;
            highlightLayerElement.scrollLeft = scrollLeft;
        }
        if (measureLayerElement) {
            measureLayerElement.scrollTop = scrollTop;
            measureLayerElement.scrollLeft = scrollLeft;
        }
    }

    function scrollToPosition(astPosition: number) {
        if (!textareaElement || !measureLayerElement) return;

        const text = $sourceCodeStore;
        const offset = Math.max(0, astPosition - 1); // AST positions are 1-based

        // Create a measurement element to find the actual scroll position
        const beforeText = escapeHtml(text.substring(0, offset));
        const afterText = escapeHtml(text.substring(offset));
        measureLayerElement.innerHTML = `<pre class="code-editor__measure-pre">${beforeText}<span id="scroll-marker"></span>${afterText}</pre>`;

        const marker = measureLayerElement.querySelector("#scroll-marker");
        if (!marker) return;

        const markerRect = marker.getBoundingClientRect();
        const containerRect = measureLayerElement.getBoundingClientRect();

        // Calculate the target scroll position relative to the container
        const targetOffsetTop =
            markerRect.top - containerRect.top + measureLayerElement.scrollTop;

        // Scroll to position with some margin (show target in upper third of editor)
        const editorHeight = textareaElement.clientHeight;
        const scrollTop = Math.max(0, targetOffsetTop - editorHeight / 3);

        textareaElement.scrollTop = scrollTop;

        // Synchronize other layers
        if (syntaxLayerElement) syntaxLayerElement.scrollTop = scrollTop;
        if (highlightLayerElement) highlightLayerElement.scrollTop = scrollTop;
        measureLayerElement.scrollTop = scrollTop;
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
            bind:this={measureLayerElement}
            class="code-editor__measure-layer"
            aria-hidden="true"
        ></div>
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
                {#each highlightRects as rect}
                    <div
                        class="highlight-line"
                        style="top: {rect.y}px; left: {rect.x}px; width: {rect.width}px; height: {rect.height}px;"
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

    .code-editor__measure-layer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        overflow: auto;
        visibility: hidden;
        z-index: 0;
    }

    .code-editor__measure-layer::-webkit-scrollbar {
        display: none;
    }

    :global(.code-editor__measure-pre) {
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

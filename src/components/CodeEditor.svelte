<script lang="ts">
    import { PositionMapper } from "$lib/core/position-mapper";
    import {
        astStore,
        selectedNodeStore,
        highlightedRangeStore,
    } from "$lib/stores/ast-store";
    import { sourceCodeStore } from "$lib/stores/editor-store";

    let textareaElement: HTMLTextAreaElement | undefined = $state();
    const positionMapper = $derived(new PositionMapper($sourceCodeStore));

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
</script>

<div class="code-editor">
    <div class="code-editor__header">
        <h2 class="code-editor__title" id="code-editor-title">
            Go Source Code
        </h2>
    </div>
    <div class="code-editor__wrapper">
        <div class="code-editor__highlight-layer" aria-hidden="true">
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
            onkeyup={handleSelectionChange}
            onblur={handleBlur}
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

    .code-editor__highlight-layer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        overflow: hidden;
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
        color: #333;
        tab-size: 4;
    }

    .code-editor__textarea::placeholder {
        color: #999;
    }
</style>

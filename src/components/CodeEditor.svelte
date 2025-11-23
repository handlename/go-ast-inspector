<script lang="ts">
    import { PositionMapper } from "$lib/core/position-mapper";
    import { astStore, selectedNodeStore } from "$lib/stores/ast-store";
    import { sourceCodeStore } from "$lib/stores/editor-store";

    const textareaElement: HTMLTextAreaElement | undefined = $state();
    const positionMapper = $derived(new PositionMapper($sourceCodeStore));

    function handleInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        sourceCodeStore.set(target.value);
    }

    function handleMouseMove(event: MouseEvent) {
        if (!textareaElement) return;

        const textarea = textareaElement;
        const rect = textarea.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calculate character position from mouse coordinates
        const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
        const charWidth = parseFloat(getComputedStyle(textarea).fontSize) * 0.6; // Approximate monospace width

        const line = Math.floor(y / lineHeight) + 1;
        const column = Math.floor(x / charWidth) + 1;

        const offset = positionMapper.positionToOffset(line, column);
        if (offset === -1) {
            selectedNodeStore.set(null);
            return;
        }

        const node = positionMapper.findNodeAtOffset($astStore, offset);
        selectedNodeStore.set(node);
    }

    function handleMouseLeave() {
        selectedNodeStore.set(null);
    }
</script>

<div class="code-editor">
    <div class="code-editor__header">
        <h2 class="code-editor__title">Go Source Code</h2>
    </div>
    <textarea
        bind:this={textareaElement}
        class="code-editor__textarea"
        value={$sourceCodeStore}
        oninput={handleInput}
        onmousemove={handleMouseMove}
        onmouseleave={handleMouseLeave}
        spellcheck="false"
        placeholder="Enter Go source code here..."
    ></textarea>
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

    .code-editor__textarea {
        flex: 1;
        padding: 1rem;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        border: none;
        outline: none;
        resize: none;
        background-color: #fafafa;
        color: #333;
        tab-size: 4;
    }

    .code-editor__textarea::placeholder {
        color: #999;
    }
</style>

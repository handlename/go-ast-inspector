<script lang="ts">
    import { PositionMapper } from "$lib/core/position-mapper";
    import { astStore, selectedNodeStore } from "$lib/stores/ast-store";
    import { sourceCodeStore } from "$lib/stores/editor-store";

    let textareaElement: HTMLTextAreaElement | undefined = $state();
    const positionMapper = $derived(new PositionMapper($sourceCodeStore));

    function handleInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        sourceCodeStore.set(target.value);
    }

    function handleClick(event: MouseEvent) {
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
        <h2 class="code-editor__title">Go Source Code</h2>
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

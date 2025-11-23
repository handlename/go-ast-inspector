<script lang="ts">
import { sourceCodeStore } from '$lib/stores/editor-store';

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  sourceCodeStore.set(target.value);
}
</script>

<div class="code-editor">
    <div class="code-editor__header">
        <h2 class="code-editor__title">Go Source Code</h2>
    </div>
    <textarea
        class="code-editor__textarea"
        value={$sourceCodeStore}
        oninput={handleInput}
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

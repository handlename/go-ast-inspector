<script lang="ts">
interface Props {
  message: string;
  line?: number;
  column?: number;
}

const { message, line, column }: Props = $props();
</script>

<div class="error-display">
    <div class="error-display__header">
        <span class="error-display__icon">⚠️</span>
        <h3 class="error-display__title">Error</h3>
    </div>
    <p class="error-display__message">{message}</p>
    {#if line !== undefined && column !== undefined && line > 0 && column > 0}
        <p class="error-display__location">
            at line {line}, column {column}
        </p>
    {/if}
</div>

<style>
    .error-display {
        margin: 1rem;
        padding: 1rem;
        background-color: #fee;
        border: 1px solid #fcc;
        border-radius: 4px;
    }

    .error-display__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .error-display__icon {
        font-size: 1.25rem;
    }

    .error-display__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #c33;
    }

    .error-display__message {
        margin: 0;
        color: #333;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;
        font-size: 0.875rem;
    }

    .error-display__location {
        margin: 0.5rem 0 0 0;
        color: #666;
        font-size: 0.8125rem;
    }
</style>

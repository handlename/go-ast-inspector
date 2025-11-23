<script lang="ts">
import { selectedNodeStore } from '$lib/stores/ast-store';

let mouseX = $state(0);
let mouseY = $state(0);
let showTooltip = $state(false);
let timeoutId: number | undefined = $state();

$effect(() => {
  if ($selectedNodeStore) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      showTooltip = true;
    }, 300);
  } else {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    showTooltip = false;
  }
});

function handleMouseMove(event: MouseEvent) {
  mouseX = event.clientX;
  mouseY = event.clientY;
}

function formatMetadata(metadata: Record<string, unknown>): string {
  const entries = Object.entries(metadata);
  if (entries.length === 0) return '';

  return entries
    .map(([key, value]) => {
      if (value === null || value === undefined) return null;
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      return `${key}: ${valueStr}`;
    })
    .filter(Boolean)
    .join('\n');
}
</script>

<svelte:window onmousemove={handleMouseMove} />

{#if showTooltip && $selectedNodeStore}
    <div
        class="hover-tooltip"
        style="left: {mouseX + 10}px; top: {mouseY + 10}px"
    >
        <div class="hover-tooltip__header">
            <span class="hover-tooltip__type">{$selectedNodeStore.type}</span>
        </div>
        <div class="hover-tooltip__body">
            <div class="hover-tooltip__position">
                Position: [{$selectedNodeStore.pos}:{$selectedNodeStore.end}]
            </div>
            {#if Object.keys($selectedNodeStore.metadata).length > 0}
                <div class="hover-tooltip__metadata">
                    <pre>{formatMetadata($selectedNodeStore.metadata)}</pre>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .hover-tooltip {
        position: fixed;
        z-index: 1000;
        background-color: #2c3e50;
        color: #ecf0f1;
        padding: 0.75rem;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        font-size: 0.875rem;
        pointer-events: none;
    }

    .hover-tooltip__header {
        margin-bottom: 0.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #34495e;
    }

    .hover-tooltip__type {
        font-weight: 600;
        color: #3498db;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;
    }

    .hover-tooltip__body {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .hover-tooltip__position {
        font-size: 0.75rem;
        color: #95a5a6;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;
    }

    .hover-tooltip__metadata {
        margin-top: 0.25rem;
    }

    .hover-tooltip__metadata pre {
        margin: 0;
        font-size: 0.75rem;
        color: #bdc3c7;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;
        white-space: pre-wrap;
        word-break: break-word;
    }
</style>
